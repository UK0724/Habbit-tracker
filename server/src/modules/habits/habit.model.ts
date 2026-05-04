import { HydratedDocument, Schema, Types, model } from "mongoose";

export const HABIT_TYPES = ["action", "measurable"] as const;

export type HabitType = (typeof HABIT_TYPES)[number];

export interface Habit {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment: boolean;
  color: string;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitDocument = HydratedDocument<Habit>;

const habitSchema = new Schema<Habit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
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
    requireCompletionComment: {
      type: Boolean,
      default: false
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
