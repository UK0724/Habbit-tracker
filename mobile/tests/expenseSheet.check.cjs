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
const native = {
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
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true
    }
  }).outputText;
  const moduleObject = { exports: {} };
  const requireModule = (name) => {
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
    if (target?.endsWith("/services/api.ts"))
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
      .findAllByType(type)
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
  const firstOpen = await renderSheet();
  const rootStyle = () => Object.assign(
    {}, ...[firstOpen.renderer.root.findByType("KeyboardAvoidingView").props.style].flat()
  );
  assert.equal(rootStyle().height, 616, "The first modal layout is bounded by the window before native sizing");
  assert.equal(rootStyle().flexShrink, 1, "The root can still shrink when Android resizes for the keyboard");
  assert.equal(rootStyle().flex, undefined, "Do not use a zero flex basis for an initially unmeasured modal root");
  assert.equal(firstOpen.focuses(), 0, "Do not focus before the native modal is shown");
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.equal(firstOpen.focuses(), 0, "Slow first opens must not use a guessed animation timer");
  firstOpen.show();
  assert.equal(firstOpen.focuses(), 1, "Focus the amount after the native shown event");
  windowDimensions = { ...windowDimensions, height: 346 };
  await firstOpen.update({});
  assert.equal(rootStyle().height, 346, "The bound follows window resize rather than a cached screen height");
  await firstOpen.update({ visible: false });
  firstOpen.show();
  assert.equal(firstOpen.focuses(), 1, "A late shown event must not focus a closed form");
  windowDimensions = { ...windowDimensions, height: 616 };
  await firstOpen.update({ visible: true });
  assert.equal(rootStyle().height, 616);
  firstOpen.show();
  assert.equal(firstOpen.focuses(), 2, "Reopening focuses from the new shown event");
  await firstOpen.update({ expense: existing });
  firstOpen.show();
  assert.equal(firstOpen.focuses(), 2, "Editing must not unexpectedly open the keyboard");
  firstOpen.unmount();
  // Invalid input must explain the failure beside the pinned submit control,
  // even if the amount field has been scrolled offscreen.
  const validation = await renderSheet();
  for (const amount of ["", "0", "-1", "abc", "1.234"]) {
    validation.change("Amount in rupees", amount);
    validation.press("Add expense");
    assert.equal(requests.length, 0, "Invalid amounts never send a request");
    assert.ok(validation.alert(), "Validation is visible in the fixed footer");
    const scrollBody = validation.renderer.root.findByType("ScrollView");
    assert.equal(
      scrollBody.findAll((node) => node.props.accessibilityRole === "alert")
        .length,
      0,
      "Submit feedback must not be confined to the scrollable body"
    );
    assert.equal(validation.alert().props.children, announcements.at(-1));
  }
  validation.change("Amount in rupees", "99.50");
  assert.equal(
    validation.alert(),
    undefined,
    "Editing the amount clears stale validation"
  );
  validation.unmount();

  const add = await renderSheet();
  add.change("Amount in rupees", "99.50");
  add.change("Note (optional)", "  Bus fare  ");
  add.press("Transport");
  add.press("Cash");
  const submit = add.button("Add expense").props.onPress;
  const close = add.button("Close").props.onPress;
  const cancelPending = add.button("Cancel").props.onPress;
  act(() => {
    submit();
    submit();
    close();
    cancelPending();
  });
  assert.equal(
    add.closes(),
    0,
    "Even before the pending render, close/cancel cannot race a save"
  );
  await flush();
  assert.equal(
    requests.length,
    1,
    "Rapid taps create one expense, including before a pending-state render"
  );
  assert.equal(requests[0].url, "/expenses");
  assert.equal(requests[0].method, "POST");
  assert.deepEqual(requests[0].input, {
    amount: 99.5,
    category: "Transport",
    date: "2026-09-30",
    description: "Bus fare",
    paymentMethod: "Cash"
  });
  assert.equal(add.button("Add expense").props.disabled, true);
  assert.equal(add.button("Cancel").props.disabled, true);
  add.press("Close");
  assert.equal(add.closes(), 0, "A pending save cannot be dismissed");
  await act(async () =>
    requests[0].resolve({ id: "new-expense", ...requests[0].input })
  );
  await flush();
  assert.equal(add.saved.length, 1);
  assert.equal(add.saved[0][1], "2026-09-30");
  assert.equal(add.closes(), 1);
  await add.update({ visible: false });
  await add.update({ visible: true });
  assert.equal(
    add.input("Amount in rupees").props.value,
    "",
    "Reopening starts a fresh form"
  );
  assert.equal(add.alert(), undefined);
  add.change("Amount in rupees", "25");
  add.press("Add expense");
  await flush();
  assert.equal(
    requests.length,
    2,
    "A completed save must not lock the next form"
  );
  await act(async () =>
    requests[1].resolve({ id: "second-expense", ...requests[1].input })
  );
  await flush();
  assert.equal(add.closes(), 2);
  add.unmount();

  const retry = await renderSheet({ initialDate: "2026-08-31" });
  retry.change("Amount in rupees", "50");
  retry.press("Add expense");
  await flush();
  await act(async () =>
    requests[0].reject(new Error("Check your connection and try again."))
  );
  await flush();
  assert.equal(
    retry.alert().props.children,
    "Check your connection and try again."
  );
  assert.equal(
    retry.input("Amount in rupees").props.value,
    "50",
    "Failed saves preserve the form"
  );
  assert.equal(
    retry.button("Add expense").props.disabled,
    false,
    "Retry is enabled after an error"
  );
  assert.equal(retry.closes(), 0);
  retry.press("Add expense");
  await flush();
  assert.equal(requests.length, 2);
  assert.equal(requests[1].input.date, "2026-08-31");
  assert.equal(
    retry.alert(),
    undefined,
    "Retry clears the previous server error"
  );
  await act(async () =>
    requests[1].resolve({ id: "retried", ...requests[1].input })
  );
  await flush();
  assert.equal(retry.closes(), 1);
  retry.unmount();

  const edit = await renderSheet({ expense: existing });
  assert.equal(edit.input("Amount in rupees").props.value, "250");
  edit.change("Amount in rupees", "300");
  edit.press("Save changes");
  await flush();
  assert.equal(requests.length, 1);
  assert.equal(requests[0].method, "PUT");
  assert.equal(requests[0].url, "/expenses/expense-1");
  await act(async () => requests[0].resolve({ ...existing, amount: 300 }));
  await flush();
  assert.equal(edit.closes(), 1);
  edit.unmount();

  const remove = await renderSheet({ expense: existing });
  remove.change("Amount in rupees", "0");
  remove.press("Save changes");
  assert.ok(remove.alert(), "Invalid edits report their validation error");
  remove.press("Delete expense");
  assert.equal(requests.length, 0, "Delete waits for confirmation");
  act(() =>
    alerts
      .at(-1)
      .buttons.find((button) => button.text === "Delete")
      .onPress()
  );
  await flush();
  assert.equal(requests[0].method, "DELETE");
  await act(async () =>
    requests[0].reject(new Error("Could not delete. Please try again."))
  );
  await flush();
  assert.equal(
    remove.alert().props.children,
    "Could not delete. Please try again.",
    "A deletion failure is not hidden behind an earlier amount error"
  );
  assert.equal(remove.closes(), 0);
  remove.unmount();

  const cancel = await renderSheet();
  cancel.change("Amount in rupees", "100");
  cancel.press("Cancel");
  assert.equal(cancel.closes(), 1);
  assert.equal(requests.length, 0, "Cancel never creates an expense");
  await cancel.update({ visible: false });
  await cancel.update({ visible: true });
  assert.equal(cancel.input("Amount in rupees").props.value, "");
  cancel.unmount();
  console.log(
    `${platform}: Expense sheet validation, create/edit, repeated tap, failure/retry and reopen checks passed.`
  );
}

(async () => {
  await checkPlatform("android");
  await checkPlatform("ios");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
