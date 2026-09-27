import assert from "node:assert/strict";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
const database = await MongoMemoryServer.create({
  instance: { launchTimeout: 60000 }
});
process.env.MONGODB_URI = database.getUri();
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "isolated-arc-test-secret-not-for-production";
process.env.CLIENT_ORIGIN = "http://127.0.0.1:5174";
const { app } = await import("./app.js");
await mongoose.connect(process.env.MONGODB_URI!);
const { HabitModel } = await import("./modules/habits/habit.model.js");
const { HabitLogModel } = await import("./modules/habitLogs/habitLog.model.js");
const { syncWorkspaceActivity } =
  await import("./modules/habits/workspaceSync.js");
await HabitLogModel.init();
const server = app.listen(process.env.ARC_PREVIEW ? 4000 : 0, "127.0.0.1");
await new Promise<void>((resolve) => server.once("listening", resolve));
const address = server.address();
if (!address || typeof address === "string") throw new Error("No test address");
const base = `http://127.0.0.1:${address.port}/api`;
const request = async (
  path: string,
  token?: string,
  method = "GET",
  body?: unknown
) => {
  const res = await fetch(base + path, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const payload = res.status === 204 ? {} : await res.json();
  return { status: res.status, ...payload };
};
try {
  const first = await request("/auth/register", undefined, "POST", {
    email: "arc-test@example.test",
    password: "ArcTestPass123!",
    timezone: "Asia/Kolkata"
  });
  const second = await request("/auth/register", undefined, "POST", {
    email: "other-test@example.test",
    password: "ArcTestPass123!"
  });
  const token = first.data.token,
    other = second.data.token;
  assert.ok(token);
  assert.ok(other);
  assert.equal(
    (await request("/preferences", token)).data.timezone,
    "Asia/Kolkata"
  );
  assert.equal((await request("/preferences", other)).data.timezone, "UTC");
  assert.equal(
    (
      await request("/auth/login", undefined, "POST", {
        email: "other-test@example.test",
        password: "ArcTestPass123!",
        timezone: "America/New_York"
      })
    ).status,
    200
  );
  assert.equal(
    (await request("/preferences", other)).data.timezone,
    "America/New_York"
  );
  assert.equal(
    (
      await request("/auth/login", undefined, "POST", {
        email: "  arc-test@example.test  ",
        password: "ArcTestPass123!"
      })
    ).status,
    200
  );
  assert.equal((await request("/habits")).status, 401);
  assert.deepEqual((await request("/habits", token)).data, []);
  const created = await request("/habits", token, "POST", {
    title: "Reading",
    type: "measurable",
    unit: "pages",
    target: 10,
    description: "Read each day",
    reminderTime: "08:00",
    color: "violet",
    schedule: "weekdays",
    weekdays: [1, 3, 5]
  });
  assert.equal(created.status, 201);
  const id = created.data.id;
  const date = new Date().toISOString().slice(0, 10);
  assert.equal((await request(`/habits/${id}`, other)).status, 404);
  assert.equal(
    (await request(`/habits/${id}`, other, "PATCH", { title: "stolen" }))
      .status,
    404
  );
  assert.equal(
    (await request(`/habits/${id}/logs`, other, "POST", { date, value: 10 }))
      .status,
    404
  );
  const log = await request(`/habits/${id}/logs`, token, "POST", {
    date,
    value: 0,
    comment: "A real zero"
  });
  assert.equal(log.status, 201);
  assert.equal(log.data.value, 0);
  assert.equal(log.data.comment, "A real zero");
  assert.equal(
    (await request(`/habits/${id}/logs`, token, "POST", { date, value: 1 }))
      .status,
    409
  );
  assert.equal(
    (await request(`/habits/${id}/logs/${log.data.id}`, other, "DELETE"))
      .status,
    404
  );
  const rangeUpdate = await request(`/habits/${id}`, token, "PATCH", {
    target: 5,
    targetMax: 12,
    goalDirection: "range"
  });
  assert.equal(rangeUpdate.status, 200);
  assert.equal(rangeUpdate.data.targetMax, 12);
  assert.equal(
    (
      await request(`/habits/${id}`, token, "PATCH", {
        target: 20,
        targetMax: 10,
        goalDirection: "range"
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request(`/habits/${id}`, token, "PATCH", {
        target: null,
        targetMax: null,
        goalDirection: "record",
        description: "",
        reminderTime: ""
      })
    ).status,
    200
  );
  const editedHabit = (await request(`/habits/${id}`, token)).data;
  assert.equal(editedHabit.ruleHistory.length, 2);
  assert.equal(editedHabit.description, undefined);
  assert.equal(editedHabit.reminderTime, "");
  const linked = await request("/habits", token, "POST", {
    title: "Expenses",
    type: "action",
    color: "violet",
    linkToExpenseTracker: true
  });
  const userId = first.data.user.id;
  await Promise.all(
    Array.from({ length: 5 }, () =>
      syncWorkspaceActivity(
        userId,
        "linkToExpenseTracker",
        date,
        "Expense recorded"
      )
    )
  );
  assert.equal(
    await HabitLogModel.countDocuments({ habitId: linked.data.id, date }),
    1
  );
  const linkedLog = await HabitLogModel.findOne({
    habitId: linked.data.id,
    date
  });
  await request(
    `/habits/${linked.data.id}/logs/${linkedLog!._id}`,
    token,
    "PATCH",
    { date, status: "skipped" }
  );
  await syncWorkspaceActivity(
    userId,
    "linkToExpenseTracker",
    date,
    "Expense recorded"
  );
  assert.equal(
    (await HabitLogModel.findById(linkedLog!._id))!.status,
    "skipped"
  );
  assert.equal(
    (await request(`/habits/${id}/archive`, token, "PATCH", { archived: true }))
      .status,
    200
  );
  assert.equal((await request(`/habits/${id}/logs`, token)).data.length, 1);
  assert.equal((await request("/export", other)).data.habits.length, 0);
  assert.equal((await request("/export", token)).data.habits.length, 2);
  assert.equal(
    (
      await request("/preferences", token, "PATCH", {
        timezone: "Invalid/Zone"
      })
    ).status,
    400
  );
  assert.equal(
    (
      await request("/preferences", token, "PATCH", {
        timezone: "Asia/Kolkata"
      })
    ).status,
    200
  );
  const boundaryZone =
    new Date().getUTCHours() >= 10 ? "Pacific/Kiritimati" : "Pacific/Honolulu";
  const expectedToday = new Intl.DateTimeFormat("en-CA", {
    timeZone: boundaryZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
  assert.notEqual(expectedToday, new Date().toISOString().slice(0, 10));
  assert.equal(
    (
      await request("/preferences", token, "PATCH", {
        timezone: boundaryZone
      })
    ).status,
    200
  );
  const defaultInsights = await request("/insights?days=7", token);
  const accountDayList = await request("/habits?includeArchived=true", token);
  const explicitInsights = await request(
    `/insights?days=7&date=${expectedToday}`,
    token
  );
  assert.equal(defaultInsights.data.length, 2);
  assert.equal(accountDayList.data[0].recentDays.at(-1).date, expectedToday);
  assert.deepEqual(defaultInsights.data, explicitInsights.data);
  assert.equal(defaultInsights.data[0].cells.at(-1).date, expectedToday);
  assert.equal(
    (
      await request("/preferences", token, "PATCH", {
        timezone: "Asia/Kolkata"
      })
    ).status,
    200
  );
  assert.equal(await HabitModel.countDocuments({ userId }), 2);

  const { UserGameProfileModel, XPEventModel } =
    await import("./modules/gamification/gamification.model.js");
  const { gamificationService } =
    await import("./modules/gamification/gamification.service.js");
  const { XP_REWARDS } =
    await import("./modules/gamification/gamification.constants.js");
  await UserGameProfileModel.init();
  const checkins = await Promise.all(
    Array.from({ length: 8 }, () =>
      request("/gamification/checkin", token, "POST")
    )
  );
  assert.equal(
    checkins.filter((r) => r.data?.alreadyCheckedIn === false).length,
    1
  );
  assert.ok(checkins.every((r) => r.status === 200));
  assert.equal(
    await XPEventModel.countDocuments({ userId, reason: "checkin" }),
    1
  );
  await UserGameProfileModel.updateOne({ userId }, { $set: { gems: 2 } });
  const freezes = await Promise.all(
    Array.from({ length: 5 }, () =>
      request("/gamification/freeze", token, "POST")
    )
  );
  assert.equal(freezes.filter((r) => r.status === 200).length, 1);
  const afterFreeze = await UserGameProfileModel.findOne({ userId });
  assert.equal(afterFreeze!.gems, 0);
  assert.equal(afterFreeze!.streakFreezes, 1);
  assert.equal(
    afterFreeze!.achievements.filter((a) => a.id === "wise_spender").length,
    1
  );
  const beforeXP = afterFreeze!.totalXP;
  await Promise.all(
    Array.from({ length: 8 }, () =>
      gamificationService.awardXP(userId, 1, "checkin")
    )
  );
  const afterXP = await UserGameProfileModel.findOne({ userId });
  assert.equal(afterXP!.totalXP, beforeXP + 8);
  const { LEVEL_THRESHOLDS } =
    await import("./modules/gamification/gamification.constants.js");
  assert.equal(
    afterXP!.level,
    LEVEL_THRESHOLDS.filter((value) => value <= afterXP!.totalXP).length
  );
  assert.equal(
    new Set(afterXP!.achievements.map((a) => a.id)).size,
    afterXP!.achievements.length
  );
  assert.equal(
    (await request("/habits?includeArchived=true", token)).data.length,
    2
  );
  assert.equal(
    (
      await request(`/habits/${id}/logs/${log.data.id}`, token, "PATCH", {
        date: "2099-01-01",
        value: 0
      })
    ).status,
    400
  );
  const action = await request("/habits", token, "POST", {
    title: "Reward regression",
    type: "action",
    color: "violet"
  });
  const beforeMiss = (await UserGameProfileModel.findOne({ userId }))!.totalXP;
  const missed = await request(
    `/habits/${action.data.id}/logs`,
    token,
    "POST",
    { date, status: "not_done" }
  );
  assert.equal(missed.status, 201);
  assert.equal(
    (await UserGameProfileModel.findOne({ userId }))!.totalXP,
    beforeMiss
  );
  const done = await request(
    `/habits/${action.data.id}/logs/${missed.data.id}`,
    token,
    "PATCH",
    { status: "done" }
  );
  assert.equal(done.status, 200);
  const beforeDelete = (await UserGameProfileModel.findOne({ userId }))!
    .totalXP;
  await Promise.all(
    Array.from({ length: 4 }, () =>
      request(
        `/habits/${action.data.id}/logs/${missed.data.id}`,
        token,
        "DELETE"
      )
    )
  );
  assert.equal(
    (await UserGameProfileModel.findOne({ userId }))!.totalXP,
    beforeDelete - XP_REWARDS.ACTION_COMPLETE
  );
  const recordOnly = await request("/habits", token, "POST", {
    title: "Undo skip regression",
    type: "measurable",
    unit: "pages",
    goalDirection: "record",
    color: "violet"
  });
  assert.equal(recordOnly.status, 201);
  const skippedRecord = await request(
    `/habits/${recordOnly.data.id}/logs`,
    token,
    "POST",
    { date, status: "skipped" }
  );
  assert.equal(skippedRecord.status, 201);
  assert.equal(skippedRecord.data.value, null);
  assert.equal(
    (
      await request(
        `/habits/${recordOnly.data.id}/logs/${skippedRecord.data.id}`,
        token,
        "DELETE"
      )
    ).status,
    204
  );
  assert.deepEqual(
    (await request(`/habits/${recordOnly.data.id}/logs`, token)).data,
    []
  );
  const challengeUser = await request("/auth/register", undefined, "POST", {
    email: "legendary-regression@example.test",
    password: "ArcTestPass123!"
  });
  const challengeToken = challengeUser.data.token;
  const challengeUserId = challengeUser.data.user.id;
  const Wednesday = new Date();
  Wednesday.setUTCDate(
    Wednesday.getUTCDate() - ((Wednesday.getUTCDay() + 4) % 7)
  );
  const challengeDate = Wednesday.toISOString().slice(0, 10);
  const { shift } = await import("./modules/habits/rules.js");
  const challengeTuesday = shift(challengeDate, -1);
  const challengeMonday = shift(challengeDate, -2);
  const weeklyChallenge = await request("/habits", challengeToken, "POST", {
    title: "Weekly target",
    type: "action",
    color: "violet",
    schedule: "weekly",
    timesPerWeek: 1
  });
  const dailyChallenge = await request("/habits", challengeToken, "POST", {
    title: "Daily target",
    type: "action",
    color: "violet"
  });
  const skippedChallenge = await request("/habits", challengeToken, "POST", {
    title: "Excused target",
    type: "action",
    color: "violet"
  });
  await HabitModel.collection.updateMany(
    {
      _id: {
        $in: [
          weeklyChallenge.data.id,
          dailyChallenge.data.id,
          skippedChallenge.data.id
        ].map((id: string) => new mongoose.Types.ObjectId(id))
      }
    },
    { $set: { createdAt: new Date(`${challengeMonday}T00:00:00.000Z`) } }
  );
  assert.equal(
    (
      await request(
        `/habits/${skippedChallenge.data.id}/logs`,
        challengeToken,
        "POST",
        { date: challengeDate, status: "skipped" }
      )
    ).status,
    201
  );
  assert.equal(
    (
      await request(
        `/habits/${weeklyChallenge.data.id}/logs`,
        challengeToken,
        "POST",
        { date: challengeTuesday, status: "done" }
      )
    ).status,
    201
  );
  assert.equal(
    (
      await request(
        `/habits/${dailyChallenge.data.id}/logs`,
        challengeToken,
        "POST",
        { date: challengeDate, status: "done" }
      )
    ).status,
    201
  );
  assert.equal(
    await XPEventModel.countDocuments({
      userId: challengeUserId,
      reason: "legendary_day",
      date: challengeDate
    }),
    1
  );
  const deniedOrigin = await fetch(base + "/health", {
    headers: { Origin: "https://localhost.attacker.example" }
  });
  assert.equal(deniedOrigin.headers.get("access-control-allow-origin"), null);
  assert.equal(deniedOrigin.headers.get("x-content-type-options"), "nosniff");
  const malformed = await fetch(base + "/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{"
  });
  assert.equal(malformed.status, 400);
  assert.equal(
    (
      await request("/gamification/push/subscribe", token, "POST", {
        endpoint: "http://127.0.0.1/",
        keys: { p256dh: "x", auth: "x" }
      })
    ).status,
    400
  );
  console.log(
    "Production regressions: concurrent rewards, purchases, delete, archived lists, future dates, CORS and malformed requests passed."
  );
  console.log(
    "Database integration: authentication, empty/populated data, isolation, numeric notes, duplicate prevention, concurrent workspace sync, skips, edits, archive preservation, export and timezone passed."
  );
} finally {
  server.close();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (database) await database.stop();
}
