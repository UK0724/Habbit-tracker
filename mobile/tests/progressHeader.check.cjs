const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const React = require("react");
const { act, create } = require("react-test-renderer");

const pushes = [];
let retries = 0;
let query = {};
const native = {
  View: "View",
  Text: "Text",
  Pressable: "Pressable",
  Image: "Image",
  StyleSheet: { create: (value) => value },
  Animated: {
    Text: "AnimatedText",
    Value: class {
      constructor(value) {
        this.value = value;
      }
    },
    spring: () => ({}),
    sequence: () => ({ start() {} })
  }
};
const load = (file) => {
  const compiled = ts.transpileModule(fs.readFileSync(file, "utf8"), {
    fileName: file,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      jsx: ts.JsxEmit.React,
      esModuleInterop: true
    }
  }).outputText;
  const module = { exports: {} };
  const localRequire = (name) => {
    if (name === "react") return React;
    if (name === "react-native") return native;
    if (name === "expo-router")
      return { useRouter: () => ({ push: (route) => pushes.push(route) }) };
    if (name === "@tanstack/react-query") return { useQuery: () => query };
    if (name === "lucide-react-native")
      return new Proxy({}, { get: (_target, key) => key });
    if (name.endsWith("/services/api"))
      return { gamificationApi: { getProfile() {} } };
    if (name.endsWith("/hooks/useCountUp"))
      return { useCountUp: (value) => value };
    if (name === "./StateViews") return { Skeleton: "Skeleton" };
    if (name.endsWith(".png")) return 1;
    if (name.endsWith("/constants/theme"))
      return load(path.resolve(path.dirname(file), `${name}.ts`));
    throw new Error(`Unexpected import ${name}`);
  };
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    require: localRequire,
    Intl
  });
  return module.exports;
};
const { ProgressHeader } = load(
  path.resolve(__dirname, "../src/components/ProgressHeader.tsx")
);
const profile = { loginStreak: 3, totalXP: 740, gems: 0, streakFreezes: 9 };
query = {
  data: profile,
  isLoading: false,
  isError: false,
  refetch: () => {
    retries += 1;
  }
};
let renderer;
act(() => {
  renderer = create(React.createElement(ProgressHeader));
});
const buttons = () => renderer.root.findAllByType("Pressable");
const labels = () => buttons().map((button) => button.props.accessibilityLabel);
assert.deepEqual(
  labels(),
  [
    "Pulse, go to Today",
    "3 day check-in streak. Open profile",
    "740 total XP. Open profile",
    "0 gems. Open profile"
  ],
  "Show only streak, XP and gems, in the v14 order, with accessible descriptions"
);
assert.equal(
  renderer.root.findAllByType("Text").length,
  0,
  "No extra caption row in the compact header"
);
for (const button of buttons().slice(1)) {
  assert.ok(
    button.props.style.minHeight >= 44 && button.props.style.minWidth >= 44
  );
  act(() => button.props.onPress());
}
act(() => buttons()[0].props.onPress());
assert.deepEqual(pushes, [
  "/(app)/profile",
  "/(app)/profile",
  "/(app)/profile",
  "/(app)"
]);

query = { ...query, data: { ...profile, totalXP: 1200000 }, isError: true };
act(() => renderer.update(React.createElement(ProgressHeader)));
assert.equal(
  buttons().length,
  4,
  "A background error preserves cached progress"
);
assert.equal(
  renderer.root.findAllByType("AnimatedText")[1].props.children,
  "1.2M"
);
for (const text of renderer.root.findAllByType("AnimatedText")) {
  assert.equal(text.props.numberOfLines, 1);
  assert.equal(text.props.maxFontSizeMultiplier, 1.3);
}

query = { ...query, data: undefined, isError: false, isLoading: true };
act(() => renderer.update(React.createElement(ProgressHeader)));
assert.deepEqual(labels().slice(1), [
  "Streak loading",
  "XP loading",
  "Gems loading"
]);
assert.equal(renderer.root.findAllByType("Skeleton").length, 3);
query = { ...query, isError: true, isLoading: false };
act(() => renderer.update(React.createElement(ProgressHeader)));
assert.equal(buttons().length, 2);
act(() => buttons()[1].props.onPress());
assert.equal(retries, 1);
query = { ...query, isFetching: true };
act(() => renderer.update(React.createElement(ProgressHeader)));
assert.equal(buttons()[1].props.disabled, true);
act(() => renderer.unmount());
console.log(
  "Progress header: three compact stats, accessibility, navigation, loading, retry and large-value checks passed."
);
