import { HydratedDocument, Schema, model } from "mongoose";

export const HABIT_TYPES = ["action", "measurable"] as const;

export type HabitType = (typeof HABIT_TYPES)[number];

export interface Habit {
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitDocument = HydratedDocument<Habit>;

const habitSchema = new Schema<Habit>(
  {
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    type: {
      type: String,
      enum: HABIT_TYPES,
      required: true
    },
    unit: {
      type: String,
      trim: true
    },
    color: {
      type: String,
      required: true,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const HabitModel = model<Habit>("Habit", habitSchema);
