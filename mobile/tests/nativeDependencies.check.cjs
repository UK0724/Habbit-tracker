const assert = require("node:assert/strict");
const path = require("node:path");

const mobileRoot = path.resolve(__dirname, "..");
const consumers = [
  mobileRoot,
  ...[
    "expo-router",
    "@react-navigation/native-stack",
    "@react-navigation/bottom-tabs"
  ].map((name) =>
    path.dirname(
      require.resolve(`${name}/package.json`, { paths: [mobileRoot] })
    )
  )
];

// Native modules and React contexts must be singletons throughout navigation.
for (const name of [
  "react",
  "react-native",
  "react-native-screens",
  "react-native-safe-area-context"
]) {
  const expected = require.resolve(`${name}/package.json`, {
    paths: [mobileRoot]
  });
  for (const consumer of consumers) {
    const resolved = require.resolve(`${name}/package.json`, {
      paths: [consumer]
    });
    assert.equal(
      resolved,
      expected,
      `${name} resolves to a second copy from ${consumer}`
    );
  }
}
console.log("Mobile native dependency singleton checks passed");

// Expo Router 4 imports query-string as a namespace. Version 9 only has a
// default export, which crashes Hermes during initial route serialization.
const routerRoot = path.dirname(
  require.resolve("expo-router/package.json", { paths: [mobileRoot] })
);
const queryString = require(require.resolve("query-string", {
  paths: [routerRoot]
}));
assert.equal(typeof queryString.stringify, "function", "Router requires a named stringify export");
assert.equal(typeof queryString.parse, "function", "Router requires a named parse export");
const params = { redirect: "/(app)/habits", title: "Read & learn" };
assert.deepEqual(
  { ...queryString.parse(queryString.stringify(params, { sort: false })) },
  params
);
console.log("Expo Router query serialization compatibility checks passed");
