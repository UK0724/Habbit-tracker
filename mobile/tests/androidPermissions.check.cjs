const assert = require("node:assert/strict");
const path = require("node:path");

// Google Play's Photos & Videos policy: the profile photo uses the system
// photo picker, so broad media / camera / mic permissions must never be merged
// into the manifest (blockedPermissions -> tools:node="remove").
const { expo } = require(path.join(__dirname, "../app.json"));
const blocked = expo.android.blockedPermissions ?? [];
for (const permission of [
  "android.permission.READ_MEDIA_IMAGES",
  "android.permission.READ_MEDIA_VIDEO",
  "android.permission.READ_MEDIA_VISUAL_USER_SELECTED",
  "android.permission.READ_EXTERNAL_STORAGE",
  "android.permission.WRITE_EXTERNAL_STORAGE",
  "android.permission.CAMERA",
  "android.permission.RECORD_AUDIO",
  "android.permission.SYSTEM_ALERT_WINDOW"
])
  assert.ok(blocked.includes(permission), `${permission} must stay in android.blockedPermissions`);
assert.ok(
  !(expo.android.permissions ?? []).some((permission) => blocked.includes(permission)),
  "A permission can't be both requested and blocked"
);

const picker = expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-image-picker");
assert.ok(picker, "expo-image-picker config plugin must be configured");
assert.deepEqual(
  picker[1],
  { photosPermission: false, cameraPermission: false, microphonePermission: false },
  "Image picker permissions are disabled (photo library via the system picker only)"
);

// The plugin must keep honouring `false` (v16 blocks CAMERA/RECORD_AUDIO for it).
const withImagePicker = require.resolve("expo-image-picker/plugin/build/withImagePicker.js", {
  paths: [path.join(__dirname, "..")]
});
const source = require("node:fs").readFileSync(withImagePicker, "utf8");
assert.match(source, /cameraPermission === false/, "expo-image-picker plugin still supports cameraPermission: false");
assert.match(source, /microphonePermission === false/, "expo-image-picker plugin still supports microphonePermission: false");

console.log("Android permission policy checks passed");
