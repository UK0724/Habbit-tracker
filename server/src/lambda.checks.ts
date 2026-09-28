import assert from "node:assert/strict";
import { MongoMemoryServer } from "mongodb-memory-server";

const database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
process.env.NODE_ENV = "test";
process.env.MONGODB_URI = database.getUri();
process.env.JWT_SECRET = "lambda-check-isolated-test-secret";
process.env.CLIENT_ORIGIN = "https://habbit-dev.abuk.in";
const { handler } = await import("./lambda.js");
const { disconnectDatabase } = await import("./config/database.js");

async function request(path: string, method = "GET", body?: unknown, token?: string) {
  const result = await handler({
    version: "2.0", routeKey: "$default", rawPath: path, rawQueryString: "",
    headers: {
      host: "habbit-dev.abuk.in", "content-type": "application/json",
      origin: "https://habbit-dev.abuk.in",
      ...(token ? { authorization: `Bearer ${token}` } : {})
    },
    requestContext: {
      accountId: "test", apiId: "test", domainName: "habbit-dev.abuk.in",
      domainPrefix: "dev", requestId: "test", routeKey: "$default", stage: "$default",
      time: "", timeEpoch: Date.now(),
      http: { method, path, protocol: "HTTP/1.1", sourceIp: "127.0.0.1", userAgent: "lambda-check" }
    },
    isBase64Encoded: false,
    ...(body ? { body: JSON.stringify(body) } : {})
  }, { callbackWaitsForEmptyEventLoop: true });
  return result as { statusCode: number; body: string; headers: Record<string, string> };
}

try {
  const health = await request("/api/health");
  assert.equal(health.statusCode, 200);
  assert.equal(health.headers["cache-control"], "no-store");
  assert.equal((await request("/api/habits")).statusCode, 401);
  const registered = await request("/api/auth/register", "POST", {
    email: "lambda@example.test", password: "LambdaTest123!", timezone: "Asia/Kolkata"
  });
  assert.equal(registered.statusCode, 201);
  const token = JSON.parse(registered.body).data.token as string;
  assert.ok(token);
  assert.equal((await request("/api/habits", "GET", undefined, token)).statusCode, 200);
  assert.equal((await request("/api/not-a-route", "GET", undefined, token)).statusCode, 404);
  await disconnectDatabase();
  assert.equal((await request("/api/health")).statusCode, 200, "Reconnect after disconnect");
  const { MongoRateLimitStore } = await import("./middleware/mongoRateLimitStore.js");
  const mongoose = (await import("mongoose")).default;
  const firstStore = new MongoRateLimitStore("concurrent-test");
  const secondStore = new MongoRateLimitStore("concurrent-test");
  const hits = await Promise.all(Array.from({ length: 40 }, (_, i) =>
    (i % 2 ? firstStore : secondStore).increment("same-client")));
  assert.equal(new Set(hits.map(hit => hit.totalHits)).size, 40, "Atomic counts across instances");
  assert.equal((await new MongoRateLimitStore("concurrent-test").increment("same-client")).totalHits, 41);
  await mongoose.connection.collection("authratelimits").updateMany({}, { $set: { resetAt: new Date(0) } });
  assert.equal((await secondStore.increment("same-client")).totalHits, 1, "Expired counters reset before TTL cleanup");
  for (let i = 0; i < 30; i++) {
    assert.equal((await request("/api/auth/login", "POST", { email: "missing@example.test", password: "wrong-password" })).statusCode, 401);
  }
  assert.equal((await request("/api/auth/login", "POST", { email: "missing@example.test", password: "wrong-password" })).statusCode, 429);
  console.log("Shared authentication limiter checks passed: concurrency, new instance, expiration, HTTP 429");
  console.log("Lambda HTTP checks passed: health, auth, POST, bearer token, 404, reconnect");
} finally {
  await disconnectDatabase();
  await database.stop();
}

