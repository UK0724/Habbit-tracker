import { connectDatabase, disconnectDatabase } from "./config/database.js";
import { HabitModel } from "./modules/habits/habit.model.js";
import { HabitLogModel } from "./modules/habitLogs/habitLog.model.js";
import { addDaysToDateString, getTodayDateString } from "./utils/date.js";

const seed = async () => {
  await connectDatabase();

  await HabitLogModel.deleteMany({});
  await HabitModel.deleteMany({});

  const seededHabits = await HabitModel.create([
    {
      title: "Quit sugar",
      type: "action",
      color: "violet",
      description: "Stay mindful about added sugar each day."
    },
    {
      title: "Weight",
      type: "measurable",
      unit: "kg",
      color: "blue",
      description: "Track morning weigh-ins for steady progress."
    },
    {
      title: "Expenses",
      type: "measurable",
      unit: "₹",
      color: "emerald",
      description: "Log daily spending to stay on budget."
    }
  ]);

  const quitSugar = seededHabits[0]!;
  const weight = seededHabits[1]!;
  const expenses = seededHabits[2]!;

  const today = getTodayDateString();
  const yesterday = addDaysToDateString(today, -1);
  const twoDaysAgo = addDaysToDateString(today, -2);
  const threeDaysAgo = addDaysToDateString(today, -3);

  await HabitLogModel.create([
    {
      habitId: quitSugar._id,
      date: today,
      status: "done",
      value: null
    },
    {
      habitId: quitSugar._id,
      date: yesterday,
      status: "done",
      value: null
    },
    {
      habitId: quitSugar._id,
      date: twoDaysAgo,
      status: "not_done",
      value: null
    },
    {
      habitId: quitSugar._id,
      date: threeDaysAgo,
      status: "done",
      value: null
    },
    {
      habitId: weight._id,
      date: today,
      status: null,
      value: 78.4
    },
    {
      habitId: weight._id,
      date: yesterday,
      status: null,
      value: 79.1
    },
    {
      habitId: weight._id,
      date: twoDaysAgo,
      status: null,
      value: 79.4
    },
    {
      habitId: expenses._id,
      date: today,
      status: null,
      value: 450
    },
    {
      habitId: expenses._id,
      date: yesterday,
      status: null,
      value: 320
    },
    {
      habitId: expenses._id,
      date: twoDaysAgo,
      status: null,
      value: 500
    }
  ]);

  console.log("Seed data created successfully.");
};

void seed()
  .catch((error) => {
    console.error("Failed to seed database", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase();
  });
