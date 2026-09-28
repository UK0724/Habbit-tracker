import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

const database = await MongoMemoryServer.create({ instance: { launchTimeout: 60000 } });
process.env.MONGODB_URI = database.getUri();
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "rewards-check-isolated-test-secret";
process.env.CLIENT_ORIGIN = "http://127.0.0.1:5174";
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;
const { app } = await import("./app.js");
await mongoose.connect(process.env.MONGODB_URI);
const { UserGameProfileModel, PushSubscriptionModel } = await import(
  "./modules/gamification/gamification.model.js"
);
const { UserModel } = await import("./modules/auth/user.model.js");
const server = app.listen(0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("No test address");
const base = `http://127.0.0.1:${address.port}/api`;

// Loosely typed HTTP bodies keep the assertions readable.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;
const request = async (path: string, token?: string, method = "GET", body?: unknown) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  return { status: res.status, body: (res.status === 204 ? {} : await res.json()) as Json };
};
const timezone = "America/Los_Angeles";
const localToday = new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date());
const password = "RewardsCheck123!";

try {
  const registered = await request("/auth/register", undefined, "POST", {
    email: "rewards@example.test", password, timezone
  });
  assert.equal(registered.status, 201);
  const token = registered.body.data.token as string;
  const userId = registered.body.data.user.id as string;

  // No streak before the first habit: opening the app records nothing.
  const early = await request("/gamification/checkin", token, "POST");
  assert.equal(early.body.data.needsHabit, true);
  assert.equal(early.body.data.xpAwarded, 0);
  assert.equal((await request("/gamification/profile", token)).body.data.loginStreak, 0);

  // Habits start on the creation day in the user's timezone, not the UTC day.
  const habit = await request("/habits", token, "POST", {
    title: "Read", type: "action", color: "#6366f1", schedule: "daily"
  });
  assert.equal(habit.status, 201);
  assert.equal(habit.body.data.startDate, localToday);
  const habitId = habit.body.data.id as string;
  // Creating the first habit starts the streak at Day 1.
  assert.equal((await request("/gamification/profile", token)).body.data.loginStreak, 1);
  // Undo it so logging exercises the automatic check-in below.
  await UserGameProfileModel.updateOne({ userId }, { $set: { lastLoginDate: null, loginStreak: 0 } });

  // First log today: habit XP + automatic check-in, first badges and gems.
  const logged = await request(`/habits/${habitId}/logs`, token, "POST", { date: localToday, status: "done" });
  assert.equal(logged.status, 201);
  const reward = logged.body.data.reward;
  assert.ok(reward, "log response carries a reward");
  assert.ok(reward.checkin && reward.checkin.alreadyCheckedIn === false, "auto check-in");
  assert.equal(reward.xpAwarded, 10 + 25, "habit + Legendary Day (only habit)");
  assert.equal(reward.checkin.xpAwarded, 5, "check-in XP reported separately");
  assert.ok(reward.newAchievements.some((a: Json) => a.id === "first_step"));
  assert.ok(reward.newAchievements.every((a: Json) => typeof a.gemBonus === "number" && a.category));
  assert.ok(reward.gemsAwarded >= 1, "badges pay gems");
  assert.equal(typeof reward.legendaryDay, "boolean");
  assert.equal(reward.legendaryDay, true, "the only habit done = Legendary Day");

  // Undo returns 200 with the XP taken back.
  const undone = await request(`/habits/${habitId}/logs/${logged.body.data.id}`, token, "DELETE");
  assert.equal(undone.status, 200);
  assert.equal(undone.body.data.reward.xpAwarded, -10);

  // Profile exposes badge totals.
  const profile = await request("/gamification/profile", token);
  assert.equal(profile.body.data.achievementTotal, 31);
  assert.equal(profile.body.data.brokenStreak, null);

  // A broken streak can be restored with gems within 24h.
  const threeDaysAgo = new Intl.DateTimeFormat("en-CA", { timeZone: timezone })
    .format(new Date(Date.now() - 3 * 86400000));
  await UserGameProfileModel.updateOne(
    { userId },
    { $set: { lastLoginDate: threeDaysAgo, loginStreak: 8, gems: 4, streakFreezes: 0 } }
  );
  const broken = await request("/gamification/checkin", token, "POST");
  assert.equal(broken.body.data.streakBroken, true);
  assert.equal(broken.body.data.previousStreak, 8);
  assert.equal(broken.body.data.canRestore, true);
  assert.equal(broken.body.data.restoreCost, 5);
  assert.ok(broken.body.data.newAchievements.some((a: Json) => a.id === "comeback_kid"));
  const gemsNow = (await UserGameProfileModel.findOne({ userId }))!.gems;
  assert.ok(gemsNow >= 4);
  await UserGameProfileModel.updateOne({ userId }, { $set: { gems: 4 } });
  assert.equal((await request("/gamification/restore-streak", token, "POST")).status, 400, "needs 5 gems");
  await UserGameProfileModel.updateOne({ userId }, { $set: { gems: 5 } });
  const restored = await request("/gamification/restore-streak", token, "POST");
  assert.equal(restored.status, 200);
  assert.equal(restored.body.data.streak, 9, "8 restored + today");
  assert.equal(restored.body.data.gems, 0);
  assert.equal((await request("/gamification/restore-streak", token, "POST")).status, 400, "only once");
  await UserGameProfileModel.updateOne(
    { userId },
    { $set: { brokenStreak: 3, brokenAt: new Date(Date.now() - 25 * 3600000), gems: 10 } }
  );
  assert.equal((await request("/gamification/restore-streak", token, "POST")).status, 400, "window expired");

  // Sharing unlocks Social Proof exactly once.
  const shared = await request("/gamification/share", token, "POST");
  assert.ok(shared.body.data.newAchievements.some((a: Json) => a.id === "social_proof"));
  assert.equal((await request("/gamification/share", token, "POST")).body.data.newAchievements.length, 0);

  // Unsubscribing one device leaves the others.
  const keys = { p256dh: "p", auth: "a" };
  await PushSubscriptionModel.create([
    { userId, endpoint: "https://push.example/a", keys },
    { userId, endpoint: "https://push.example/b", keys }
  ]);
  await request("/gamification/push/unsubscribe", token, "DELETE", { endpoint: "https://push.example/a" });
  assert.deepEqual(
    (await PushSubscriptionModel.find({ userId })).map((s) => s.endpoint),
    ["https://push.example/b"]
  );

  // Password reset: no account enumeration, single-use expiring token.
  assert.equal((await request("/auth/forgot-password", undefined, "POST", { email: "nobody@example.test" })).status, 200);
  assert.equal((await request("/auth/forgot-password", undefined, "POST", { email: "rewards@example.test" })).status, 200);
  assert.ok((await UserModel.findById(userId))!.resetTokenHash, "token stored hashed");
  const knownToken = "k".repeat(43);
  await UserModel.updateOne({ _id: userId }, {
    $set: {
      resetTokenHash: createHash("sha256").update(knownToken).digest("hex"),
      resetTokenExpiresAt: new Date(Date.now() + 60000)
    }
  });
  assert.equal((await request("/auth/reset-password", undefined, "POST", { token: knownToken, password: "short" })).status, 400);
  const reset = await request("/auth/reset-password", undefined, "POST", { token: knownToken, password: "BrandNewPass123!" });
  assert.equal(reset.status, 200);
  assert.equal((await request("/auth/reset-password", undefined, "POST", { token: knownToken, password: "AnotherPass123!" })).status, 400, "single use");
  assert.equal((await request("/auth/login", undefined, "POST", { email: "rewards@example.test", password })).status, 401);
  assert.equal((await request("/auth/login", undefined, "POST", { email: "rewards@example.test", password: "BrandNewPass123!" })).status, 200);

  // Habit streak repair: freeze first, then gems; oldest missed day first.
  const { HabitModel } = await import("./modules/habits/habit.model.js");
  const back = (days: number) =>
    new Intl.DateTimeFormat("en-CA", { timeZone: timezone }).format(new Date(Date.now() - days * 86400000));
  const walk = await request("/habits", token, "POST", { title: "Walk", type: "action", color: "#10b981", schedule: "daily" });
  const walkId = walk.body.data.id as string;
  await HabitModel.updateOne({ _id: walkId }, { $set: { startDate: back(5) } });
  assert.equal((await request(`/habits/${walkId}/logs`, token, "POST", { date: back(3), status: "done" })).status, 201);
  assert.equal(
    (await request(`/habits/${walkId}/logs`, token, "POST", { date: back(1), status: "skipped" })).status,
    400,
    "past days cannot be skipped for free"
  );
  const offerOf = async () =>
    (await request("/habits", token)).body.data.find((h: Json) => h.id === walkId).streakRepair;
  const firstOffer = await offerOf();
  assert.equal(firstOffer?.date, back(2), "oldest missed day first");
  assert.equal(firstOffer.gemCost, 3);
  await UserGameProfileModel.updateOne({ userId }, { $set: { streakFreezes: 1, gems: 0 } });
  assert.equal((await request(`/habits/${walkId}/streak-repair`, token, "POST", { date: back(1) })).status, 400, "must repair the offered day");
  const repaired = await request(`/habits/${walkId}/streak-repair`, token, "POST", { date: back(2) });
  assert.equal(repaired.status, 200);
  assert.equal(repaired.body.data.paidWith, "freeze");
  assert.equal(repaired.body.data.streakFreezes, 0);
  assert.ok(repaired.body.data.newAchievements.some((a: Json) => a.id === "second_chance"));
  const secondOffer = await offerOf();
  assert.equal(secondOffer?.date, back(1), "next missed day becomes repairable");
  assert.equal((await request(`/habits/${walkId}/streak-repair`, token, "POST", { date: back(1) })).status, 400, "no freeze or gems");
  await UserGameProfileModel.updateOne({ userId }, { $set: { gems: 3 } });
  const paidGems = await request(`/habits/${walkId}/streak-repair`, token, "POST", { date: back(1) });
  assert.equal(paidGems.body.data.paidWith, "gems");
  assert.equal(paidGems.body.data.gems, 0);
  assert.equal(paidGems.body.data.newAchievements.length, 0, "badge only once");
  assert.equal(await offerOf(), null, "streak fully repaired");
  const walkDays = (await request("/habits", token)).body.data.find((h: Json) => h.id === walkId).recentDays;
  assert.deepEqual(
    walkDays.filter((d: Json) => d.frozen).map((d: Json) => d.date),
    [back(2), back(1)]
  );
  const walkLogs = (await request(`/habits/${walkId}/logs`, token)).body.data;
  assert.equal(walkLogs.filter((l: Json) => l.frozen).length, 2);

  // Profile photo: small validated images only, removable.
  const jpeg = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.alloc(200)]).toString("base64")}`;
  assert.equal((await request("/account/avatar", token)).body.data.avatar, null);
  assert.equal((await request("/account/avatar", token, "PUT", { image: jpeg })).status, 200);
  assert.equal((await request("/account/avatar", token)).body.data.avatar, jpeg);
  const fakePng = `data:image/png;base64,${Buffer.from("not really a png").toString("base64")}`;
  assert.equal((await request("/account/avatar", token, "PUT", { image: fakePng })).status, 400);
  assert.equal((await request("/account/avatar", token, "PUT", { image: "https://example.com/a.jpg" })).status, 400);
  const huge = `data:image/jpeg;base64,${Buffer.concat([Buffer.from([0xff, 0xd8, 0xff]), Buffer.alloc(70 * 1024)]).toString("base64")}`;
  assert.ok([400, 413].includes((await request("/account/avatar", token, "PUT", { image: huge })).status));
  assert.equal((await request("/auth/me", token)).body.data.avatar, undefined, "photo not leaked in /me");
  assert.equal((await request("/account/avatar", token, "DELETE")).body.data.avatar, null);

  // Removed features are gone.
  assert.equal((await request("/job-tracker/profile", token)).status, 404);
  assert.equal((await request("/gamification/ad-token", token, "POST")).status, 404);

  console.log("Reward checks passed: log rewards, streak repair, profile photo, auto check-in, local start date, undo, streak restore, share, per-device unsubscribe, password reset, removed routes");
} finally {
  server.close();
  await mongoose.disconnect();
  await database.stop();
}
