// Live dev-only checks. Creates disposable smoke users; removes their habits and
// expenses. User records remain because the API has no account-delete endpoint.
import assert from 'node:assert/strict';
import { randomBytes } from 'node:crypto';

const base = new URL(process.argv[2]);
assert.equal(base.protocol, 'https:');
assert.ok(['habbit-dev.abuk.in', 'd15g90nayqn9rk.cloudfront.net', 'qijwmuwdtiylhfdxbqk7offevy0ccfvp.lambda-url.ap-south-1.on.aws'].includes(base.hostname), 'Only the verified dev environment is allowed');
const suffix = `${Date.now()}-${randomBytes(4).toString('hex')}`;
const password = `${randomBytes(24).toString('base64url')}Aa1!`;
const email = `pulse-smoke-${suffix}@example.test`;
const origin = 'https://habbit-dev.abuk.in';
async function request(path, method = 'GET', data, token, expected = 200) {
  const result = await fetch(new URL(path, base), {
    method, signal: AbortSignal.timeout(30000),
    headers: { origin, ...(data ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    ...(data ? { body: JSON.stringify(data) } : {})
  });
  assert.equal(result.status, expected, `${method} ${path}: HTTP ${result.status}, expected ${expected}`);
  if (path.startsWith('/api/') && method !== 'OPTIONS') assert.equal(result.headers.get('cache-control'), 'no-store');
  console.log(`PASS ${method} ${path} ${result.status}`);
  return result.status === 204 ? undefined : result.json();
}

await request('/api/health');
await request('/api/habits', 'GET', undefined, undefined, 401);
const registered = await request('/api/auth/register', 'POST', { email, password, timezone: 'Asia/Kolkata' }, undefined, 201);
const token = registered.data.token;
assert.ok(token);
const loggedIn = await request('/api/auth/login', 'POST', { email, password });
assert.ok(loggedIn.data.token);
const other = await request('/api/auth/register', 'POST', { email: `other-${email}`, password, timezone: 'Asia/Kolkata' }, undefined, 201);
const otherToken = other.data.token;
await request('/api/auth/me', 'GET', undefined, token);
let habitId, expenseId;
try {
  const habit = await request('/api/habits', 'POST', { title: 'Disposable deployment smoke habit', type: 'action', color: '#6366f1', schedule: 'daily' }, token, 201);
  habitId = habit.data.id ?? habit.data._id;
  assert.match(habitId, /^[a-f0-9]{24}$/);
  await request(`/api/habits/${habitId}`, 'GET', undefined, token);
  await request(`/api/habits/${habitId}`, 'GET', undefined, otherToken, 404);
  await request(`/api/habits/${habitId}`, 'PATCH', { title: 'Disposable edited smoke habit' }, otherToken, 404);
  await request(`/api/habits/${habitId}`, 'PATCH', { title: 'Disposable edited smoke habit' }, token);
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(new Date());
  await request(`/api/habits/${habitId}/logs`, 'POST', { date, status: 'done' }, token, 201);
  await request(`/api/habits/${habitId}/logs`, 'GET', undefined, token);
  const expense = await request('/api/expenses', 'POST', { date, amount: 1, category: 'Food', paymentMethod: 'Cash', description: 'Disposable deployment smoke expense' }, token, 201);
  expenseId = expense.data.id ?? expense.data._id;
  assert.match(expenseId, /^[a-f0-9]{24}$/);
  const otherExpenses = await request('/api/expenses', 'GET', undefined, otherToken);
  assert.equal(otherExpenses.data.length, 0);
  await request(`/api/expenses/${expenseId}`, 'PUT', { amount: 2 }, otherToken, 404);
  await request(`/api/expenses/${expenseId}`, 'PUT', { amount: 2 }, token);
  await request('/api/gamification/profile', 'GET', undefined, token);
} finally {
  if (expenseId) await request(`/api/expenses/${expenseId}`, 'DELETE', undefined, token, 204);
  if (habitId) await request(`/api/habits/${habitId}`, 'DELETE', undefined, token, 204);
}
console.log('Dev smoke checks passed; disposable habits and expenses removed.');
