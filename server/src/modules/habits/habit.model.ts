import { HydratedDocument, Schema, Types, model } from "mongoose";

export const HABIT_TYPES = ["action", "measurable", "expense"] as const;

export type HabitType = (typeof HABIT_TYPES)[number];

export const GOAL_DIRECTIONS = ["up", "down"] as const;

export type GoalDirection = (typeof GOAL_DIRECTIONS)[number];

export interface Habit {
  userId: Types.ObjectId;
  title: string;
  description?: string;
  type: HabitType;
  unit?: string;
  requireCompletionComment: boolean;
  color: string;
  archived: boolean;
  linkToJobTracker?: boolean;
  linkToDSAPrep?: boolean;
  linkToExpenseTracker?: boolean;
  /** For measurable/expense: is a higher or lower value "better". */
  goalDirection: GoalDirection;
  /** Optional target value (e.g. target weight, monthly budget). */
  target?: number;
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
    },
    archived: {
      type: Boolean,
      default: false
    },
    linkToJobTracker: {
      type: Boolean,
      default: false
    },
    linkToDSAPrep: {
      type: Boolean,
      default: false
    },
    linkToExpenseTracker: {
      type: Boolean,
      default: false
    },
    goalDirection: {
      type: String,
      enum: GOAL_DIRECTIONS,
      default: "up"
    },
    target: {
      type: Number
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const HabitModel = model<Habit>("Habit", habitSchema);
