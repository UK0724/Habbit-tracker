const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const mapPath = path.join(root, "android/app/build/intermediates/sourcemaps/react/release/index.android.bundle.packager.map");
const map = JSON.parse(fs.readFileSync(mapPath, "utf8"));
const sourceIndex = map.sources.findIndex((source) => source.replaceAll("\\", "/").endsWith("/decode-uri-component/index.js"));
assert.ok(sourceIndex >= 0, "Android bundle must include the router URL decoder");
const routerRoot = path.dirname(require.resolve("expo-router/package.json", { paths: [root] }));
const queryPath = require.resolve("query-string", { paths: [routerRoot] });
const decoderPath = require.resolve("decode-uri-component", { paths: [path.dirname(queryPath)] });
const normalize = (source) => source.replace(/\r\n/g, "\n").trim();
assert.equal(normalize(map.sourcesContent[sourceIndex]), normalize(fs.readFileSync(decoderPath, "utf8")),
  "Android bundle contains a stale URL decoder; rebuild the JS bundle before distributing the APK");
console.log("Android bundle contains the current patched URL decoder.");
