const assert = require("node:assert/strict");
const path = require("node:path");

// Google Play's Photos & Videos policy: the profile photo uses the system
// photo picker. QR scanning alone uses the camera; broad media / mic permissions must never be merged
// into the manifest (blockedPermissions -> tools:node="remove").
const { expo } = require(path.join(__dirname, "../app.json"));
const blocked = expo.android.blockedPermissions ?? [];
for (const permission of [
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.RECORD_AUDIO",
  "android.permission.SYSTEM_ALERT_WINDOW"
])
  assert.ok(
    blocked.includes(permission),
    `${permission} must stay in android.blockedPermissions`
  );
assert.ok(
  !(expo.android.permissions ?? []).some((permission) =>
    blocked.includes(permission)
  ),
  "A permission can't be both requested and blocked"
);

const picker = expo.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-image-picker"
);
assert.ok(picker, "expo-image-picker config plugin must be configured");
assert.deepEqual(
  picker[1],
  {
    photosPermission: false,
    cameraPermission:
      "Allow Pulse to scan a UPI payment QR code when you choose Scan.",
    microphonePermission: false
  },
  "Photo picker stays system-only; do not let its plugin block the UPI scanner camera"
);

// The plugin must keep honouring `false` (v16 blocks CAMERA/RECORD_AUDIO for it).
const withImagePicker = require.resolve(
  "expo-image-picker/plugin/build/withImagePicker.js",
  {
    paths: [path.join(__dirname, "..")]
  }
);
const source = require("node:fs").readFileSync(withImagePicker, "utf8");
assert.match(
  source,
  /cameraPermission === false/,
  "expo-image-picker plugin still supports cameraPermission: false"
);
assert.match(
  source,
  /microphonePermission === false/,
  "expo-image-picker plugin still supports microphonePermission: false"
);

console.log("Android permission policy checks passed");

assert.ok(
  !blocked.includes("android.permission.CAMERA"),
  "QR scanning needs CAMERA, only requested on demand"
);
assert.ok(expo.android.permissions.includes("android.permission.CAMERA"));
const camera = expo.plugins.find(
  (plugin) => Array.isArray(plugin) && plugin[0] === "expo-camera"
);
assert.deepEqual(
  camera?.[1],
  {
    cameraPermission: false,
    microphonePermission: false,
    recordAudioAndroid: false
  },
  "Android-only scanner adds no iOS usage strings or microphone permission"
);
assert.ok(
  expo.plugins.indexOf(camera) < expo.plugins.indexOf(picker),
  "Expo52 runs permission mods in reverse, so camera must remove iOS usage strings last"
);
const cameraSource = require("node:fs").readFileSync(
  require.resolve("expo-camera/plugin/build/withCamera.js", {
    paths: [path.join(__dirname, "..")]
  }),
  "utf8"
);
assert.match(
  cameraSource,
  /recordAudioAndroid && 'android.permission.RECORD_AUDIO'/,
  "Audio stays opt-in at the installed plugin boundary"
);
assert.match(cameraSource, /'android.permission.CAMERA'/);
const lock = require("../../package-lock.json");
assert.equal(lock.packages.mobile.dependencies["expo-camera"], "~16.0.18");
assert.equal(lock.packages["node_modules/expo-camera"].version, "16.0.18");
console.log(
  "UPI camera-only native configuration and dependency pin checks passed"
);

// Execute the installed SDK52 plugins against Expo's introspection templates.
// This verifies actual tools:node removal entries and iOS mod ordering without
// a native build, Android SDK or device. It is not APK manifest verification.
(async () => {
  const fs = require("node:fs");
  const vm = require("node:vm");
  const { createRequire } = require("node:module");
  const toolkit = require("@expo/config-plugins");
  let config = JSON.parse(JSON.stringify(expo));
  config.plugins = [];
  for (const [name, options] of expo.plugins.filter(
    (plugin) =>
      Array.isArray(plugin) &&
      ["expo-camera", "expo-image-picker"].includes(plugin[0])
  )) {
    const filename = require.resolve(
      `${name}/plugin/build/${name === "expo-camera" ? "withCamera" : "withImagePicker"}.js`,
      { paths: [path.join(__dirname, "..")] }
    );
    const installedRequire = createRequire(filename);
    const moduleObject = { exports: {} };
    vm.runInNewContext(
      fs.readFileSync(filename, "utf8"),
      {
        module: moduleObject,
        exports: moduleObject.exports,
        require: (key) =>
          key === "expo/config-plugins" ? toolkit : installedRequire(key)
      },
      { filename }
    );
    config = moduleObject.exports.default(config, options);
  }
  config = require("../plugins/withOptionalQrCamera.cjs")(config);
  config =
    toolkit.AndroidConfig.Permissions.withInternalBlockedPermissions(config);
  const result = await toolkit.compileModsAsync(config, {
    projectRoot: path.resolve(__dirname, ".."),
    platforms: ["android", "ios"],
    introspect: true
  });
  const results = result._internal.modResults;
  const permissions = results.android.manifest.manifest["uses-permission"].map(
    (entry) => entry.$
  );
  assert.equal(
    permissions.find(
      (entry) => entry["android:name"] === "android.permission.CAMERA"
    )?.["tools:node"],
    undefined
  );
  assert.ok(
    permissions.some(
      (entry) => entry["android:name"] === "android.permission.CAMERA"
    )
  );
  for (const name of ["android.hardware.camera", "android.hardware.camera.autofocus"])
    assert.equal(results.android.manifest.manifest["uses-feature"].find((entry) => entry.$["android:name"] === name)?.$["android:required"], "false", "Optional scanning must not require camera hardware");
  for (const permission of blocked)
    assert.equal(
      permissions.find((entry) => entry["android:name"] === permission)?.[
        "tools:node"
      ],
      "remove",
      `${permission} must remain removed in the evaluated manifest`
    );
  for (const key of [
    "NSCameraUsageDescription",
    "NSMicrophoneUsageDescription",
    "NSPhotoLibraryUsageDescription"
  ])
    assert.equal(
      results.ios.infoPlist[key],
      undefined,
      `${key} must stay disabled for this Android-only feature`
    );
  console.log(
    "Installed Expo permission plugin introspection passed: Android camera only, media/mic removed, iOS unchanged."
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
