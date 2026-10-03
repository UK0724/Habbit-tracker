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
    if (name === "react-native") return native;
    if (name === "./UpiPaymentPanel")
      return { UpiPaymentPanel: "UpiPaymentPanel" };
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
      createNodeMock: () => ({
        focus: () => {
          focuses += 1;
        }
      })
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
    show: () =>
      act(() => renderer.root.findByType(native.Modal).props.onShow()),
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
  const modal = firstOpen.renderer.root.findByType(native.Modal);
  assert.equal(
    modal.props.transparent,
    false,
    "Entry must cover the underlying tab bar completely"
  );
  assert.equal(
    modal.props.presentationStyle,
    "fullScreen",
    "Expense entry matches the full-screen habit form"
  );
  assert.ok(
    firstOpen.button("Close expense form"),
    "A back control replaces the sheet's close icon"
  );
  assert.equal(
    firstOpen.button("Cancel"),
    undefined,
    "Keep a single primary action in the footer"
  );
  const scroll = firstOpen.renderer.root.findByType("ScrollView");
  assert.equal(
    scroll.props.style.flex,
    1,
    "The form scrolls between the fixed header and footer"
  );
  assert.equal(
    scroll.findAll((node) => node.props.accessibilityLabel === "Add expense")
      .length,
    0
  );
  assert.ok(
    firstOpen.input("Note (optional)"),
    "The note remains available in the scrollable form"
  );
  const rootStyle = () =>
    Object.assign(
      {},
      ...[
        firstOpen.renderer.root.findByType("KeyboardAvoidingView").props.style
      ].flat()
    );
  assert.equal(
    rootStyle().height,
    616,
    "The first modal layout is bounded by the window before native sizing"
  );
  assert.equal(
    rootStyle().flexGrow,
    1,
    "The opaque form fills native modal bounds while keyboard maxHeight limits growth"
  );
  assert.equal(
    rootStyle().flexShrink,
    1,
    "The root can still shrink when Android resizes for the keyboard"
  );
  assert.equal(
    rootStyle().flex,
    undefined,
    "Do not use a zero flex basis for an initially unmeasured modal root"
  );
  assert.equal(
    firstOpen.focuses(),
    0,
    "Do not focus before the native modal is shown"
  );
  await new Promise((resolve) => setTimeout(resolve, 400));
  assert.equal(
    firstOpen.focuses(),
    0,
    "Slow first opens must not use a guessed animation timer"
  );
  firstOpen.show();
  assert.equal(
    firstOpen.focuses(),
    1,
    "Focus the amount after the native shown event"
  );
  if (platform === "android") {
  await act(async () => keyboardListeners.get("keyboardDidShow")({ endCoordinates: { screenY: 346 } }));
  assert.equal(rootStyle().height, 346, "Keyboard position bounds an Android Modal even when window size stays unchanged");
  assert.equal(rootStyle().maxHeight, 346, "The keyboard bound prevents flex growth behind the IME");
  }
  windowDimensions = { ...windowDimensions, height: 346 };
  await firstOpen.update({});
  assert.equal(
    rootStyle().height,
    346,
    "The bound follows window resize rather than a cached screen height"
  );
  if (platform === "android") {
  await act(async () => keyboardListeners.get("keyboardDidHide")());
  }
  assert.equal(rootStyle().height, 346, "An already-resized window must not subtract the keyboard twice");
  windowDimensions = { ...windowDimensions, height: 616 };
  await firstOpen.update({});
  assert.equal(rootStyle().height, 616, "Keyboard dismissal restores the full form");
  await firstOpen.update({ visible: false });
  firstOpen.show();
  assert.equal(
    firstOpen.focuses(),
    1,
    "A late shown event must not focus a closed form"
  );
  windowDimensions = { ...windowDimensions, height: 616 };
  await firstOpen.update({ visible: true });
  assert.equal(rootStyle().height, 616);
  firstOpen.show();
  assert.equal(
    firstOpen.focuses(),
    2,
    "Reopening focuses from the new shown event"
  );
  await firstOpen.update({ expense: existing });
  firstOpen.show();
  assert.equal(
    firstOpen.focuses(),
    2,
    "Editing must not unexpectedly open the keyboard"
  );
  firstOpen.unmount();

  const upi = await renderSheet();
  const panels = () => upi.renderer.root.findAllByType("UpiPaymentPanel");
  if (platform === "android") {
    assert.equal(panels().length, 1, "UPI is optional on new Android expenses");
    upi.change("Amount in rupees", "99.50");
    const staleSubmit = upi.button("Add expense").props.onPress;
    act(() => {
      panels()[0].props.onPaymentStateChange("unconfirmed");
      staleSubmit();
    });
    assert.equal(
      requests.length,
      0,
      "Starting UPI gates a same-frame Add tap before state re-renders"
    );
    assert.equal(upi.button("Add expense").props.disabled, true);
    upi.press("Cash");
    assert.equal(
      upi.button("Add expense").props.disabled,
      true,
      "Changing payment method cannot bypass an unresolved payment"
    );
    const payment = {
      upiId: "shop@bank",
      name: "Shop",
      amount: "99.50",
      note: ""
    };
    act(() => panels()[0].props.onPaymentStateChange("confirmed", payment));
    assert.equal(
      requests.length,
      0,
      "Manual payment confirmation does not save an expense by itself"
    );
    upi.change("Amount in rupees", "100");
    upi.press("Add expense");
    assert.equal(
      requests.length,
      0,
      "Changing the amount invalidates earlier payment confirmation synchronously"
    );
    upi.change("Amount in rupees", "99.50");
    upi.change("Note (optional)", "Changed note");
    upi.press("Add expense");
    assert.equal(
      requests.length,
      0,
      "Changing the payment note also requires review"
    );
    upi.change("Note (optional)", "");
    upi.press("Cash");
    upi.press("Add expense");
    assert.equal(
      requests.length,
      0,
      "Confirmed UPI cannot be silently recorded with another payment method"
    );
    act(() => panels()[0].props.onPaymentStateChange("confirmed", payment));
    upi.press("Add expense");
    await flush();
    assert.equal(
      requests.length,
      1,
      "Only the explicit Add action records a matching manually confirmed payment"
    );
    assert.equal(requests[0].input.paymentMethod, "UPI");
    assert.equal(requests[0].input.amount, 99.5);
    await act(async () =>
      requests[0].resolve({ id: "upi-expense", ...requests[0].input })
    );
    await flush();
    assert.equal(upi.closes(), 1);
    await upi.update({ visible: false });
    await upi.update({ visible: true });
    assert.equal(
      upi.button("Add expense").props.disabled,
      false,
      "A new form does not retain an old payment gate"
    );
    act(() => panels()[0].props.onPaymentStateChange("unconfirmed"));
    act(() =>
      panels()[0].props.onDraftChange({ amount: "10.00", note: "QR draft" })
    );
    assert.equal(
      requests.length,
      1,
      "Scanning only prepares the expense draft"
    );
    act(() => panels()[0].props.onPaymentStateChange("idle"));
    assert.equal(
      upi.button("Add expense").props.disabled,
      false,
      "Explicit return to manual entry permits normal expense recording"
    );
    upi.press("Cash");
    upi.press("Add expense");
    await flush();
    assert.equal(requests.length, 2);
    assert.equal(requests[1].input.paymentMethod, "Cash");
    assert.equal(requests[1].input.description, "QR draft");
    await act(async () =>
      requests[1].resolve({ id: "manual-expense", ...requests[1].input })
    );
    await flush();
    await upi.update({ expense: existing });
    assert.equal(
      panels().length,
      0,
      "Editing an expense never offers to pay it again"
    );
  } else {
    assert.equal(
      panels().length,
      0,
      "The Android-only handoff is not offered on iOS"
    );
  }
  upi.unmount();
  if (platform === "android") {
    const confirmed = {
      upiId: "shop@bank",
      name: "Shop",
      amount: "99.50",
      note: ""
    };
    for (const edit of [
      "amount",
      "note",
      "method",
      "quick amount",
      "QR draft"
    ]) {
      const race = await renderSheet();
      race.change("Amount in rupees", "99.50");
      const panel = () => race.renderer.root.findByType("UpiPaymentPanel");
      act(() => panel().props.onPaymentStateChange("confirmed", confirmed));
      const staleAdd = race.button("Add expense").props.onPress;
      act(() => {
        if (edit === "amount")
          race.input("Amount in rupees").props.onChangeText("100");
        if (edit === "note")
          race.input("Note (optional)").props.onChangeText("Different note");
        if (edit === "method") race.button("Cash").props.onPress();
        if (edit === "quick amount")
          race.button("Add 50 rupees").props.onPress();
        if (edit === "QR draft")
          panel().props.onDraftChange({ amount: "100", note: "Changed QR" });
        staleAdd();
      });
      assert.equal(
        requests.length,
        0,
        `${edit} must invalidate confirmation before a same-frame Add tap`
      );
      assert.equal(race.button("Add expense").props.disabled, true);
      assert.equal(
        panel().props.paymentState,
        "unconfirmed",
        "The panel receives the revoked gate so its message cannot remain confirmed"
      );
      race.unmount();
    }
    const lateConfirmation = await renderSheet();
    lateConfirmation.change("Amount in rupees", "99.50");
    const panel = lateConfirmation.renderer.root.findByType("UpiPaymentPanel");
    const staleAdd = lateConfirmation.button("Add expense").props.onPress;
    act(() => {
      panel.props.onDraftChange({ amount: "100" });
      panel.props.onPaymentStateChange("confirmed", confirmed);
      staleAdd();
    });
    assert.equal(
      requests.length,
      0,
      "A stale confirmation callback cannot approve an edited draft"
    );
    lateConfirmation.unmount();
  }

  const latestDraft = await renderSheet();
  latestDraft.change("Amount in rupees", "50");
  const manualAdd = latestDraft.button("Add expense").props.onPress;
  act(() => {
    latestDraft.input("Amount in rupees").props.onChangeText("100");
    manualAdd();
  });
  await flush();
  assert.equal(
    requests[0].input.amount,
    100,
    "Manual entry also saves the latest native input event, not a stale render value"
  );
  await act(async () =>
    requests[0].resolve({ id: "latest-draft", ...requests[0].input })
  );
  await flush();
  latestDraft.unmount();
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
  const close = add.button("Close expense form").props.onPress;
  const cancelPending = add.renderer.root.findByType(native.Modal).props
    .onRequestClose;
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
  assert.equal(add.button("Close expense form").props.disabled, true);
  add.press("Close expense form");
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
  cancel.press("Close expense form");
  assert.equal(cancel.closes(), 1);
  assert.equal(requests.length, 0, "Cancel never creates an expense");
  await cancel.update({ visible: false });
  await cancel.update({ visible: true });
  assert.equal(cancel.input("Amount in rupees").props.value, "");
  cancel.unmount();

  const hardwareBack = await renderSheet();
  act(() =>
    hardwareBack.renderer.root.findByType(native.Modal).props.onRequestClose()
  );
  assert.equal(
    hardwareBack.closes(),
    1,
    "Android Back dismisses without saving"
  );
  assert.equal(requests.length, 0);
  hardwareBack.unmount();

  const { ExpenseBottomSheet } = load(
    path.resolve(__dirname, "../src/components/expenses/ExpenseBottomSheet.tsx")
  );
  let budgetShell;
  await act(async () => {
    budgetShell = create(
      React.createElement(
        ExpenseBottomSheet,
        {
          visible: true,
          title: "Budgets",
          onClose() {},
          footer: React.createElement("Text", null, "Save budgets")
        },
        React.createElement("Text", null, "Budget fields")
      )
    );
  });
  assert.equal(
    budgetShell.root.findByType(native.Modal).props.transparent,
    true,
    "Budget editing stays a compact sheet"
  );
  assert.equal(
    budgetShell.root.findByType(native.Modal).props.presentationStyle,
    "overFullScreen"
  );
  act(() => budgetShell.unmount());
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
