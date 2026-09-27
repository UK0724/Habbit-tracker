const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const path = require("node:path");
const handlers = {};
const stores = new Map();
const key = (request) => typeof request === "string" ? request : request.url;
const caches = {
  open: async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      match: async (request) => store.get(key(request))?.clone(),
      put: async (request, response) => store.set(key(request), response.clone()),
      delete: async (request) => store.delete(key(request)),
      addAll: async () => {}
    };
  },
  keys: async () => [...stores.keys()],
  delete: async (name) => stores.delete(name),
  match: async (request) => {
    for (const store of stores.values()) if (store.has(key(request))) return store.get(key(request)).clone();
  }
};
let networkCalls = 0;
let network = async () => new Response("export default 1", { headers: { "content-type": "text/javascript" } });
vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../public/sw.js"), "utf8"), {
  self: { location: { origin: "https://pulse.test" }, addEventListener: (name, handler) => { handlers[name] = handler; }, clients: { claim: async () => {} } },
  caches, URL, Response,
  fetch: (...args) => { networkCalls++; return network(...args); }
});
function request(pathname, destination = "script", mode = "cors") {
  let result;
  handlers.fetch({ request: { method: "GET", url: "https://pulse.test" + pathname, destination, mode, headers: new Headers() }, respondWith: (promise) => { result = promise; } });
  return result;
}
(async () => {
  await caches.open("pulse-shell-v2");
  let activation;
  handlers.activate({ waitUntil: (promise) => { activation = promise; } });
  await activation;
  assert.equal(stores.has("pulse-shell-v2"), false, "Old potentially poisoned cache must be removed");
  const good = await request("/assets/good.js");
  assert.equal(good.status, 200);
  await request("/assets/good.js");
  assert.equal(networkCalls, 1, "Immutable chunks should be reused without revalidation races");
  network = async () => new Response("<html>fallback</html>", { headers: { "content-type": "text/html" } });
  assert.equal((await request("/assets/missing.js")).type, "error");
  assert.equal(await (await caches.open("pulse-shell-v3")).match("https://pulse.test/assets/missing.js"), undefined, "HTML must not poison the script cache");
  assert.equal(request("/api/preferences", ""), undefined);
  assert.equal(request("/downloads/pulse.apk", ""), undefined);
  await request("/settings", "document", "navigate");
  network = async () => { throw new Error("offline"); };
  assert.equal(await (await request("/settings", "document", "navigate")).text(), "<html>fallback</html>");
  console.log("Service worker: stale cache migration, MIME validation, asset reuse, API/download bypass and offline shell checks passed.");
})().catch((error) => { console.error(error); process.exitCode = 1; });
