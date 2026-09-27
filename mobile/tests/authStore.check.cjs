const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const source = fs.readFileSync(
  path.join(__dirname, "../src/stores/authStore.ts"),
  "utf8"
);
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022
  }
}).outputText;

const saved = new Map();
let failTokenDelete = false;
let failUserDelete = false;
const keys = { AUTH_TOKEN: "token", AUTH_USER: "user" };
const storage = {
  setItemAsync: async (key, value) => saved.set(key, value),
  getItemAsync: async (key) => saved.get(key) ?? null,
  deleteItemAsync: async (key) => {
    if (
      (key === keys.AUTH_TOKEN && failTokenDelete) ||
      (key === keys.AUTH_USER && failUserDelete)
    ) {
      throw new Error("storage unavailable");
    }
    saved.delete(key);
  }
};
const moduleObject = { exports: {} };
const loggedErrors = [];
vm.runInNewContext(compiled, {
  module: moduleObject,
  exports: moduleObject.exports,
  require: (name) => {
    if (name === "zustand") return require("zustand");
    if (name === "../services/storage") return storage;
    if (name === "../constants/config") return { SECURE_STORE_KEYS: keys };
    throw new Error(`Unexpected import: ${name}`);
  },
  console: { error: (...args) => loggedErrors.push(args) }
});

const store = moduleObject.exports.useAuthStore;
const user = { id: "user-1", email: "user@example.com" };

(async () => {
  await store.getState().setAuth("secret-token", user);
  failTokenDelete = true;
  await assert.rejects(
    store.getState().clearAuth(),
    /Could not sign out securely/
  );
  assert.equal(store.getState().isAuthenticated, true);
  assert.equal(saved.get(keys.AUTH_TOKEN), "secret-token");

  failTokenDelete = false;
  await store.getState().clearAuth();
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(saved.has(keys.AUTH_TOKEN), false);
  assert.equal(saved.has(keys.AUTH_USER), false);

  await store.getState().setAuth("second-token", user);
  failUserDelete = true;
  await store.getState().clearAuth();
  assert.equal(store.getState().isAuthenticated, false);
  assert.equal(saved.has(keys.AUTH_TOKEN), false);
  assert.equal(loggedErrors.length, 1);
  console.log("Mobile secure sign-out checks passed");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
