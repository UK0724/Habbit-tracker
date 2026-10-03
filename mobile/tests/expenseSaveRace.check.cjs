const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");
const { QueryClient, QueryClientProvider } = require("@tanstack/react-query");

// Render the real form, buttons, sheet, mutation hooks and expense service.
// Only device APIs and the HTTP boundary are mocked. This does not simulate
// native keyboard geometry; that still needs an Android/iOS device check.
const requests = [];
const announcements = [];
const alerts = [];
let windowDimensions = { width: 320, height: 616, scale: 1, fontScale: 1 };
const keyboardListeners = new Map();
const native = {
  Keyboard: { addListener: (event, callback) => { keyboardListeners.set(event, callback); return { remove: () => keyboardListeners.delete(event) }; } },
  Platform: { OS: "android" },
  useWindowDimensions: () => windowDimensions,
  StyleSheet: { create: (value) => value, absoluteFill: {} },
  AccessibilityInfo: {
    announceForAccessibility: (text) => announcements.push(text)
  },
  Modal: ({ visible, children }) => (visible ? children : null),
  Alert: {
    alert: (title, message, buttons) => alerts.push({ title, message, buttons })
  },
  ...Object.fromEntries(
    [
      "KeyboardAvoidingView",
      "Pressable",
      "ScrollView",
      "Text",
      "TextInput",
      "TouchableOpacity",
      "View",
      "ActivityIndicator"
    ].map((name) => [name, name])
  )
};
const cache = new Map();
const load = (file) => {
  if (cache.has(file)) return cache.get(file);
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true
    }
  }).outputText;
  const moduleObject = { exports: {} };
  const requireModule = (name) => {
    if (name.endsWith("/UpiPaymentPanel")) return { UpiPaymentPanel: "UpiPaymentPanel" };
    if (name === "react-native") return native;
    if (name === "react-native-safe-area-context")
      return {
        useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 })
      };
    if (name === "lucide-react-native")
      return new Proxy({}, { get: (_target, key) => key });
    if (name === "@react-native-community/datetimepicker")
      return {
        __esModule: true,
        default: "DateTimePicker",
        DateTimePickerAndroid: { open: () => {} }
      };
    if (name.endsWith("/services/api"))
      return {
        errorMessage: (error, fallback) => error.message || fallback,
        apiRequest: (url, init) =>
          new Promise((resolve, reject) => {
            requests.push({
              url,
              method: init.method,
              input: init.body ? JSON.parse(init.body) : undefined,
              resolve,
              reject
            });
          })
      };
    if (name.endsWith("/stores/authStore"))
      return { useAuthStore: (select) => select({ user: { id: "qa-user" } }) };
    if (name.endsWith("/hooks/useRewardCelebration"))
      return { useRewardCelebration: () => () => {} };
    if (name.endsWith("/utils/haptics"))
      return {
        hapticLight: async () => {},
        hapticError: async () => {},
        hapticSuccess: async () => {}
      };
    if (name === "@habit-tracker/shared")
      return load(path.resolve(__dirname, "../../shared/src/lib/rules.ts"));
    if (!name.startsWith(".")) return require(name);
    const base = path.resolve(path.dirname(file), name);
    const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) =>
      fs.existsSync(candidate)
    );
    // The expense service imports its API boundary using a same-directory path.
    if (target?.replace(/\\/g, "/").endsWith("/services/api.ts"))
      return requireModule("../../services/api");
    assert.ok(target, `Unresolved import ${name} from ${file}`);
    return load(target);
  };
  vm.runInNewContext(
    compiled,
    {
      module: moduleObject,
      exports: moduleObject.exports,
      require: requireModule,
      console,
      Date,
      setTimeout,
      clearTimeout
    },
    { filename: file }
  );
  cache.set(file, moduleObject.exports);
  return moduleObject.exports;
};

const { ExpenseSheet } = load(
  path.resolve(__dirname, "../src/components/expenses/ExpenseSheet.tsx")
);
const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const flush = async () =>
  act(async () => {
    await tick();
    await tick();
  });
const existing = {
  id: "expense-1",
  amount: 250,
  category: "Food",
  date: "2026-09-29",
  description: "Lunch",
  paymentMethod: "UPI"
};

async function renderSheet(overrides = {}) {
  requests.length = 0;
  announcements.length = 0;
  alerts.length = 0;
  const client = new QueryClient({
    defaultOptions: { mutations: { retry: false, gcTime: Infinity } }
  });
  const saved = [];
  let closes = 0;
  let focuses = 0;
  let props = {
    visible: true,
    expense: null,
    initialDate: "2026-09-30",
    today: "2026-09-30",
    onClose: () => {
      closes += 1;
    },
    onSaved: (...args) => saved.push(args),
    ...overrides
  };
  const tree = () =>
    React.createElement(
      QueryClientProvider,
      { client },
      React.createElement(ExpenseSheet, props)
    );
  let renderer;
  await act(async () => {
    renderer = create(tree(), {
      createNodeMock: () => ({ focus: () => { focuses += 1; } })
    });
  });
  const find = (type, label) =>
    renderer.root
      .findAll((node) => node.type === type || (type === "TouchableOpacity" && node.type === "Pressable"))
      .find((node) => node.props.accessibilityLabel === label);
  return {
    renderer,
    saved,
    closes: () => closes,
    focuses: () => focuses,
    show: () => act(() => renderer.root.findByType(native.Modal).props.onShow()),
    input: (label) => find("TextInput", label),
    button: (label) => find("TouchableOpacity", label),
    change: (label, value) =>
      act(() => find("TextInput", label).props.onChangeText(value)),
    press: (label) =>
      act(() => find("TouchableOpacity", label).props.onPress()),
    alert: () =>
      renderer.root
        .findAllByType("Text")
        .find((node) => node.props.accessibilityRole === "alert"),
    async update(next) {
      props = { ...props, ...next };
      await act(async () => renderer.update(tree()));
    },
    unmount() {
      act(() => renderer.unmount());
      client.clear();
    }
  };
}


async function checkPlatform(platform) {
  native.Platform.OS = platform;
  const add = await renderSheet();
  add.change("Amount in rupees", "99.50");
  const submit = add.button("Add expense").props.onPress;
  const close = add.button("Close expense form").props.onPress;
  const cancelPending = () => add.renderer.root.findByType(native.Modal).props.onRequestClose();
  act(() => { submit(); submit(); close(); cancelPending(); });
  await flush();
  console.log(`${platform}: same-frame save requests=${requests.length}, pending dismissals=${add.closes()}`);
  assert.equal(requests.length, 1, "Rapid taps must create only one expense before the pending render");
  assert.equal(add.closes(), 0, "Close/cancel cannot dismiss an in-flight save before its pending render");
  await act(async () => requests[0].resolve({ id: "first", ...requests[0].input }));
  await flush();
  assert.equal(add.closes(), 1);
  assert.equal(add.saved.length, 1);
  await add.update({ visible: false });
  await add.update({ visible: true });
  assert.equal(add.input("Amount in rupees").props.value, "");
  add.change("Amount in rupees", "25");
  add.press("Add expense");
  await flush();
  assert.equal(requests.length, 2);
  await act(async () => requests[1].reject(new Error("Offline. Try again.")));
  await flush();
  assert.equal(add.closes(), 1);
  assert.equal(add.input("Amount in rupees").props.value, "25");
  assert.equal(add.button("Add expense").props.disabled, false);
  add.press("Add expense");
  await flush();
  assert.equal(requests.length, 3);
  await act(async () => requests[2].resolve({ id: "retry", ...requests[2].input }));
  await flush();
  assert.equal(add.closes(), 2);
  add.unmount();
  const edit = await renderSheet({ expense: existing });
  assert.equal(edit.input("Amount in rupees").props.value, "250");
  edit.change("Amount in rupees", "300");
  edit.press("Save changes");
  await flush();
  assert.equal(requests[0].method, "PUT");
  await act(async () => requests[0].resolve({ ...existing, amount: 300 }));
  await flush();
  assert.equal(edit.closes(), 1);
  edit.unmount();
  const removal = await renderSheet({ expense: existing });
  removal.press("Delete expense");
  assert.equal(requests.length, 0, "Deletion waits for explicit confirmation");
  const confirm = alerts.at(-1).buttons.find(button => button.text === "Delete").onPress;
  const dismiss = removal.button("Close expense form").props.onPress;
  act(() => { confirm(); confirm(); dismiss(); });
  await flush();
  assert.equal(requests.length, 1, "Repeated confirmation must send one delete");
  assert.equal(removal.closes(), 0);
  assert.equal(requests[0].method, "DELETE");
  await act(async () => requests[0].reject(new Error("Delete failed. Retry.")));
  await flush();
  assert.equal(removal.closes(), 0);
  removal.press("Delete expense");
  act(() => alerts.at(-1).buttons.find(button => button.text === "Delete").onPress());
  await flush();
  assert.equal(requests.length, 2);
  await act(async () => requests[1].resolve(undefined));
  await flush();
  assert.equal(removal.closes(), 1);
  removal.unmount();
  const cancel = await renderSheet();
  cancel.change("Amount in rupees", "100");
  cancel.press("Close expense form");
  assert.equal(cancel.closes(), 1);
  assert.equal(requests.length, 0);
  cancel.unmount();
  console.log(`${platform}: save race, pending cancel, retry, reopen, edit and idle back passed`);
}
(async () => { await checkPlatform("android"); await checkPlatform("ios"); })().catch(error => { console.error(error); process.exitCode = 1; });
