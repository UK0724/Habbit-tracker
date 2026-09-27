const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

// Resolve the actual decoder shipped through Expo Router, not a test-only copy.
const routerRoot = path.dirname(require.resolve("expo-router/package.json"));
const queryPath = require.resolve("query-string", { paths: [routerRoot] });
const decoderPath = require.resolve("decode-uri-component", { paths: [path.dirname(queryPath)] });
const script = `
  const assert = require('node:assert/strict');
  const decode = require(${JSON.stringify(decoderPath)});
  const query = require(${JSON.stringify(queryPath)});
  assert.equal(decode('Read+%26+learn'), 'Read & learn');
  assert.equal(decode('%E2%9C%93%20%F0%9F%92%8E'), '✓ 💎');
  assert.equal(decode('%FE%FF'), '\\uFFFD\\uFFFD');
  assert.equal(decode('%C2'), '\\uFFFD');
  const malformed = '%FF'.repeat(4096);
  assert.equal(decode(malformed), malformed);
  assert.equal(decode('%41' + malformed + '%E2%9C%93'), 'A' + malformed + '✓');
  assert.equal(query.parse('title=' + malformed).title, malformed);
  assert.deepEqual({...query.parse(query.stringify({title:'Read & learn',redirect:'/(app)/habits'}))}, {title:'Read & learn',redirect:'/(app)/habits'});
`;
// A vulnerable decoder cannot hang the full release check indefinitely.
const result = spawnSync(process.execPath, ["-e", script], { timeout: 10000, encoding: "utf8" });
assert.equal(result.error, undefined, "URL decoding exceeded the time limit: " + result.error);
assert.equal(result.status, 0, result.stderr);
console.log("Router URL decoding: Unicode, legacy plus handling, malformed input and bounded execution passed.");
