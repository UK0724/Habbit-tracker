import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
process.env.MONGODB_URI = database.getUri();
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "account-check-isolated-test-secret";
process.env.CLIENT_ORIGIN = "http://127.0.0.1:5174";
const { app } = await import("./app.js");
await mongoose.connect(process.env.MONGODB_URI);
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("No test address");
const base = `http://127.0.0.1:${address.port}/api`;

const request = async (path: string, token?: string, method = "GET", body?: unknown) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, body: res.status === 204 ? {} : await res.json() };
};
const register = async (email: string) => {
  const res = await request("/auth/register", undefined, "POST", {
    email, password: "AccountCheck123!", timezone: "Asia/Kolkata"
  });
  assert.equal(res.status, 201);
  return res.body.data as { token: string; user: { id: string } };
};
const seed = async (token: string) => {
  const habit = await request("/habits", token, "POST", {
    title: "Account check habit", type: "action", color: "#6366f1", schedule: "daily"
  });
  assert.equal(habit.status, 201);
  const habitId = habit.body.data.id ?? habit.body.data._id;
  const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata" }).format(new Date());
  assert.equal((await request(`/habits/${habitId}/logs`, token, "POST", { date, status: "done" })).status, 201);
  assert.equal((await request("/expenses", token, "POST", {
    date, amount: 5, category: "Food", paymentMethod: "Cash", description: "Account check"
  })).status, 201);
  assert.equal((await request("/gamification/profile", token)).status, 200);
};

try {
  const doomed = await register("doomed@example.test");
  const kept = await register("kept@example.test");
  await seed(doomed.token);
  await seed(kept.token);
  const db = mongoose.connection.db!;
  const collections = ["habits", "habitlogs", "expenses", "usergameprofiles"];
  const counts = async () =>
    Object.fromEntries(await Promise.all(collections.map(async (name) =>
      [name, await db.collection(name).countDocuments()] as const)));
  const before = await counts();
  for (const name of collections) assert.ok(before[name]! >= 2, `${name} seeded for both users`);

  assert.equal((await request("/account", undefined, "DELETE", { password: "x" })).status, 401);
  assert.equal((await request("/account", doomed.token, "DELETE", {})).status, 400);
  const wrong = await request("/account", doomed.token, "DELETE", { password: "WrongPassword1!" });
  assert.equal(wrong.status, 403, "Wrong password must not look like an expired session");
  assert.equal((await request("/account", doomed.token, "DELETE", { password: "AccountCheck123!" })).status, 204);

  const after = await counts();
  for (const name of collections) assert.equal(after[name], before[name]! / 2, `${name}: only the deleted user's rows removed`);
  const userId = new mongoose.Types.ObjectId(doomed.user.id);
  for (const name of ["habits", "expenses", "usergameprofiles", "xpevents", "pushsubscriptions"])
    assert.equal(await db.collection(name).countDocuments({ userId: { $in: [userId, doomed.user.id] } }), 0, name);
  assert.equal(await db.collection("users").countDocuments({ _id: userId }), 0);
  assert.equal((await request("/habits", doomed.token)).status, 401, "Deleted account token rejected");
  assert.equal((await request("/habits", doomed.token, "POST", {
    title: "Cannot recreate data", type: "action", color: "#6366f1", schedule: "daily"
  })).status, 401, "Deleted account cannot create new data");
  assert.equal((await request("/auth/login", undefined, "POST", {
    email: "doomed@example.test", password: "AccountCheck123!"
  })).status, 401);
  assert.equal((await request("/habits", kept.token)).body.data.length, 1, "Other users keep their data");
  console.log("Account deletion checks passed: auth, validation, wrong password, full removal, isolation");
} finally {
  server.close();
  await mongoose.disconnect();
  await database.stop();
}
