import { HydratedDocument, Schema, Types, model } from "mongoose";

export const ACTION_STATUSES = ["done", "not_done"] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number];

export interface HabitLog {
  habitId: Types.ObjectId;
  date: string;
  status: ActionStatus | null;
  value: number | null;
  comment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type HabitLogDocument = HydratedDocument<HabitLog>;

const habitLogSchema = new Schema<HabitLog>(
  {
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true
    },
    date: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ACTION_STATUSES,
      default: null
    },
    value: {
      type: Number,
      default: null
    },
    comment: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

habitLogSchema.index({ habitId: 1, date: 1 }, { unique: true });

export const HabitLogModel = model<HabitLog>("HabitLog", habitLogSchema);
