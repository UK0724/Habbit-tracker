const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
const listeners = new Set();
const launches = [];
const permissions = [];
let keyboardDismissals = 0;
let cameraAlreadyGranted = false;
const native = {
  Platform: { OS: "android" },
  Keyboard: {
    dismiss: () => {
      keyboardDismissals += 1;
    }
  },
  StyleSheet: { create: (value) => value },
  AppState: {
    currentState: "active",
    addEventListener: (_name, callback) => {
      listeners.add(callback);
      return { remove: () => listeners.delete(callback) };
    }
  },
  Linking: {
    openURL: (url) =>
      new Promise((resolve, reject) => launches.push({ url, resolve, reject }))
  },
  ...Object.fromEntries(
    ["View", "Text", "TextInput", "TouchableOpacity", "Pressable", "ActivityIndicator"].map(
      (name) => [name, name]
    )
  )
};
const cache = new Map();
function load(file) {
  if (cache.has(file)) return cache.get(file);
  const moduleObject = { exports: {} };
  const requireModule = (name) => {
    if (name === "react-native") return native;
    if (name === "expo-camera")
      return {
        CameraView: "CameraView",
        Camera: {
          getCameraPermissionsAsync: async () => ({ granted: cameraAlreadyGranted, canAskAgain: true }),
          requestCameraPermissionsAsync: () =>
            new Promise((resolve, reject) =>
              permissions.push({ resolve, reject })
            )
        }
      };
    if (name === "lucide-react-native") return { Eye: "Eye", EyeOff: "EyeOff" };
    if (name.endsWith("/utils/haptics")) return { hapticLight: () => {} };
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(file), name);
    return load(
      [base, `${base}.ts`, `${base}.tsx`].find((candidate) =>
        fs.existsSync(candidate)
      )
    );
  };
  vm.runInNewContext(
    ts.transpileModule(fs.readFileSync(file, "utf8"), {
      fileName: file,
    compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.React,
        esModuleInterop: true
      }
    }).outputText,
    {
      module: moduleObject,
      exports: moduleObject.exports,
      require: requireModule,
      console,
      Map,
      Set,
      encodeURIComponent,
      decodeURIComponent
    },
    { filename: file }
  );
  cache.set(file, moduleObject.exports);
  return moduleObject.exports;
}
const { UpiPaymentPanel } = load(
  path.resolve(__dirname, "../src/components/expenses/UpiPaymentPanel.tsx")
);
async function render(overrides = {}) {
  launches.length = 0;
  permissions.length = 0;
  const states = [];
  const drafts = [];
  let props = {
    visible: true,
    amount: "25",
    note: "Tea",
    onPaymentStateChange: (...args) => states.push(args),
    onDraftChange: (draft) => drafts.push(draft),
    ...overrides
  };
  let renderer;
  const tree = () => React.createElement(UpiPaymentPanel, props);
  await act(async () => {
    renderer = create(tree());
  });
  const find = (type, label) =>
    renderer.root
      .findAll((node) => node.type === type || (type === "TouchableOpacity" && node.type === "Pressable"))
      .find((node) => node.props.accessibilityLabel === label);
  return {
    renderer,
    states,
    drafts,
    button: (label) => find("TouchableOpacity", label),
    press: (label) =>
      act(() => {
        const button = find("TouchableOpacity", label);
        assert.ok(button, label);
        button.props.onPress();
      }),
    change: (label, value) =>
      act(() => find("TextInput", label).props.onChangeText(value)),
    error: () =>
      renderer.root
        .findAllByType("Text")
        .find((node) => node.props.accessibilityRole === "alert"),
    text: () =>
      renderer.root
        .findAllByType("Text")
        .map((node) => node.props.children)
        .flat()
        .join(" "),
    camera: () => renderer.root.findAllByType("CameraView")[0],
    appState: (state) =>
      act(() => {
        for (const callback of listeners) callback(state);
      }),
    async update(next) {
      props = { ...props, ...next };
      await act(async () => renderer.update(tree()));
    },
    async ready() {
      this.press("Set up UPI payment");
      this.change("Recipient UPI ID", "cafe@bank");
      this.change("Recipient name (optional)", "Cafe");
      this.press("Review payment");
    },
    unmount() {
      act(() => renderer.unmount());
    }
  };
}
(async () => {
  const normal = await render();
  assert.equal(permissions.length, 0, "Rendering never requests permission");
  assert.equal(launches.length, 0);
  assert.equal(
    normal.button("Scan UPI QR"),
    undefined,
    "Payment starts collapsed"
  );
  await normal.ready();
  assert.equal(normal.states.at(-1)[0], "unconfirmed");
  assert.equal(launches.length, 0, "Review cannot launch or save");
  assert.ok(keyboardDismissals > 0, "Review dismisses the keyboard");
  const open = normal.button("Open payment app").props.onPress;
  act(() => {
    open();
    open();
  });
  assert.equal(
    launches.length,
    1,
    "Synchronous repeated taps launch only once"
  );
  assert.equal(
    launches[0].url,
    "upi://pay?pa=cafe%40bank&pn=Cafe&am=25.00&cu=INR&tn=Tea"
  );
  normal.appState("background");
  normal.appState("active");
  assert.ok(
    normal.states.every(([state]) => state !== "confirmed"),
    "Background/return is not payment success"
  );
  await act(async () => launches[0].resolve({ Status: "SUCCESS" }));
  assert.equal(
    normal.states.at(-1)[0],
    "unconfirmed",
    "Even an arbitrary Linking response is not a verified result"
  );
  assert.match(normal.text(), /Payment status is unknown/);
  const confirm = normal.button("I checked: payment succeeded").props.onPress;
  act(() => {
    confirm();
    confirm();
  });
  assert.equal(
    normal.states.filter(([state]) => state === "confirmed").length,
    1
  );
  assert.match(normal.text(), /not verified by Pulse/);
  await normal.update({ amount: "26" });
  assert.equal(
    normal.states.at(-1)[0],
    "unconfirmed",
    "Changing the amount invalidates manual confirmation"
  );
  assert.equal(normal.button("I checked: payment succeeded"), undefined);
  normal.press("Return to manual entry");
  assert.equal(
    normal.states.at(-1)[0],
    "idle",
    "Explicit manual-return clears the payment gate"
  );
  normal.unmount();

  const parentInvalidated = await render({ paymentState: "idle" });
  await parentInvalidated.ready();
  parentInvalidated.press("Open payment app");
  await act(async () => launches[0].resolve());
  parentInvalidated.press("I checked: payment succeeded");
  await parentInvalidated.update({ paymentState: "confirmed" });
  const confirmedCount = parentInvalidated.states.filter(
    ([state]) => state === "confirmed"
  ).length;
  // Final amount and note are unchanged, as with a payment-method edit or an
  // amount edit followed by restoration in the same React event batch.
  await parentInvalidated.update({ paymentState: "unconfirmed" });
  assert.ok(
    parentInvalidated.button("Review payment"),
    "Parent gate invalidation exits the stale confirmed view"
  );
  assert.equal(
    parentInvalidated.button("I checked: payment succeeded"),
    undefined
  );
  assert.match(
    parentInvalidated.error().props.children,
    /Check your payment history before paying again/
  );
  assert.match(
    parentInvalidated.error().props.children,
    /Return to manual entry to record an already-completed payment/
  );
  assert.equal(
    parentInvalidated.states.filter(([state]) => state === "confirmed").length,
    confirmedCount,
    "Parent invalidation never auto-confirms"
  );
  assert.equal(
    launches.length,
    1,
    "Parent invalidation never reopens a payment app"
  );
  parentInvalidated.press("Return to manual entry");
  assert.equal(parentInvalidated.states.at(-1)[0], "idle");
  parentInvalidated.unmount();

  const absent = await render();
  await absent.ready();
  absent.press("Open payment app");
  await act(async () => launches[0].reject(new Error("No activity")));
  assert.equal(absent.states.at(-1)[0], "unconfirmed");
  assert.match(absent.error().props.children, /No payment app opened/);
  assert.equal(absent.button("I checked: payment succeeded"), undefined);
  absent.press("Return to manual entry");
  assert.equal(absent.states.at(-1)[0], "idle");
  absent.unmount();

  const cancelled = await render();
  await cancelled.ready();
  cancelled.press("Open payment app");
  await act(async () => launches[0].resolve(undefined));
  cancelled.appState("background");
  cancelled.appState("active");
  cancelled.press("Payment cancelled or not completed");
  assert.equal(cancelled.states.at(-1)[0], "unconfirmed");
  assert.match(
    cancelled.error().props.children,
    /No expense has been recorded/
  );
  assert.ok(cancelled.states.every(([state]) => state !== "confirmed"));
  cancelled.unmount();

  const noResult = await render();
  await noResult.ready();
  noResult.press("Open payment app");
  noResult.appState("background");
  noResult.appState("active");
  assert.equal(
    noResult.states.at(-1)[0],
    "unconfirmed",
    "An unresolved handoff never records anything"
  );
  await noResult.update({ visible: false });
  await noResult.update({ visible: true });
  await act(async () => launches[0].resolve());
  assert.equal(
    noResult.button("I checked: payment succeeded"),
    undefined,
    "Late resolution cannot contaminate reopened form"
  );
  assert.ok(noResult.button("Set up UPI payment"));
  assert.ok(
    noResult.states.every(
      ([state]) => state !== "confirmed" && state !== "idle"
    ),
    "Visibility never silently clears parent gate"
  );
  noResult.unmount();

  const camera = await render();
  camera.press("Set up UPI payment");
  assert.equal(
    permissions.length,
    0,
    "Entering a UPI ID does not request camera access"
  );
  const scan = camera.button("Scan UPI QR").props.onPress;
  act(() => {
    scan();
    scan();
  });
  await act(async () => {});
  assert.equal(permissions.length, 1, "Repeated scan taps prompt only once");
  await act(async () =>
    permissions[0].resolve({ granted: false, canAskAgain: false })
  );
  assert.match(camera.error().props.children, /Android Settings/);
  assert.equal(camera.camera(), undefined);
  await camera.press("Scan UPI QR");
  camera.appState("inactive");
  camera.appState("active");
  await act(async () =>
    permissions[1].resolve({ granted: true, canAskAgain: true })
  );
  assert.ok(
    camera.camera(),
    "An inactive permission dialog does not cancel the granted scanner request"
  );
  assert.deepEqual(
    [...camera.camera().props.barcodeScannerSettings.barcodeTypes],
    ["qr"]
  );
  act(() =>
    camera.camera().props.onBarcodeScanned({ data: "https://bad.example/pay" })
  );
  assert.equal(camera.camera(), undefined);
  assert.ok(camera.error());
  assert.equal(camera.drafts.length, 0);
  assert.equal(
    launches.length,
    0,
    "A scanned non-UPI URL never opens externally"
  );
  await camera.press("Scan UPI QR");
  await act(async () => permissions[2].resolve({ granted: true }));
  const onBarcode = camera.camera().props.onBarcodeScanned;
  act(() => {
    onBarcode({ data: "upi://pay?pa=shop@bank&pn=Shop&am=42&tn=Lunch" });
    onBarcode({ data: "upi://pay?pa=evil@bank&am=9" });
  });
  assert.equal(
    camera.drafts.length,
    1,
    "First accepted scan locks repeated callbacks"
  );
  assert.equal(camera.drafts[0].amount, "42.00");
  assert.equal(camera.drafts[0].note, "Lunch");
  assert.equal(
    launches.length,
    0,
    "A valid scan still requires review and explicit launch"
  );
  await camera.update({ amount: "42.00", note: "Lunch" });
  camera.press("Review payment");
  assert.match(camera.text(), /shop@bank/);
  camera.press("Edit payment details");
  await camera.press("Scan UPI QR");
  await act(async () => permissions[3].resolve({ granted: true }));
  assert.ok(camera.camera());
  act(() => onBarcode({ data: "upi://pay?pa=stale@bank&am=1" }));
  assert.equal(
    camera.drafts.length,
    1,
    "Old scanner callbacks cannot edit a new scanner session"
  );
  camera.appState("background");
  assert.equal(
    camera.camera(),
    undefined,
    "Scanner is unmounted while backgrounded"
  );
  camera.appState("active");
  assert.equal(
    camera.camera(),
    undefined,
    "Returning never silently restarts camera"
  );
  await camera.press("Scan UPI QR");
  await camera.update({ visible: false });
  await act(async () => permissions[4].resolve({ granted: true }));
  await camera.update({ visible: true });
  assert.equal(
    camera.camera(),
    undefined,
    "Late permission response cannot reopen a closed scanner"
  );
  camera.unmount();
  assert.equal(listeners.size, 0);

  const grantedCamera = await render();
  cameraAlreadyGranted = true;
  grantedCamera.press("Set up UPI payment");
  await grantedCamera.press("Scan UPI QR");
  assert.ok(grantedCamera.camera(), "An existing camera grant opens the scanner without another permission activity");
  assert.equal(permissions.length, 0, "Do not re-request an already granted camera permission");
  grantedCamera.press("Cancel scanning");
  await grantedCamera.press("Scan UPI QR");
  assert.ok(grantedCamera.camera());
  assert.equal(permissions.length, 0, "Repeated granted scans keep using the existing permission");
  grantedCamera.unmount();
  cameraAlreadyGranted = false;

  native.Platform.OS = "ios";
  const ios = await render();
  assert.equal(ios.renderer.toJSON(), null);
  assert.equal(permissions.length, 0);
  ios.unmount();
  console.log(
    "UPI component checks passed: explicit review, no autosave, manual-only confirmation, missing app, cancel/no result, repeated tap, return/background, camera denial, bad QR and stale async responses."
  );
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
