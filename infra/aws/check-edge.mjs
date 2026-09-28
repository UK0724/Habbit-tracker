import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';

const template = JSON.parse(readFileSync(new URL('./edge.json', import.meta.url), 'utf8'));
const handler = runInNewContext(`${template.Resources.SpaRouting.Properties.FunctionCode}; handler;`);
for (const uri of ['/', '/habits', '/habits/abc/edit', '/expenses', '/achievements', '/settings']) {
  for (const method of ['GET', 'HEAD']) {
    const request = { uri, method, querystring: { view: { value: 'all' } } };
    const response = handler({ request });
    assert.equal(response.uri, '/index.html');
    assert.equal(response.querystring.view.value, 'all');
  }
}
for (const uri of ['/api', '/api/health', '/api/habits', '/assets/missing.js', '/assets/missing', '/sw.js', '/fonts/test.woff2', '/downloads/build.apk', '/favicon.ico']) {
  assert.equal(handler({ request: { uri, method: 'GET' } }).uri, uri);
}
assert.equal(handler({ request: { uri: '/habits', method: 'POST' } }).uri, '/habits');
console.log('CloudFront navigation and missing-asset routing checks passed.');
