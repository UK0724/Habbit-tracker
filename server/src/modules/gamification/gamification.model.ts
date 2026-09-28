import { HydratedDocument, Schema, Types, model } from "mongoose";

// ─── UserGameProfile ─────────────────────────────────────────────────────────

export interface AchievementUnlock {
  id: string;
  unlockedAt: string; // YYYY-MM-DD
}

export interface UserGameProfile {
  userId: Types.ObjectId;
  totalXP: number;
  level: number;
  gems: number;
  loginStreak: number;
  longestStreak: number;
  lastLoginDate: string | null; // YYYY-MM-DD
  streakFreezes: number;
  achievements: AchievementUnlock[];
  perfectDates: string[];
  /** Streak length lost at the last break; restorable with gems until brokenAt + 24h. */
  brokenStreak: number | null;
  brokenAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type UserGameProfileDocument = HydratedDocument<UserGameProfile>;

const userGameProfileSchema = new Schema<UserGameProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    totalXP: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    gems: { type: Number, default: 0 },
    loginStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastLoginDate: { type: String, default: null },
    streakFreezes: { type: Number, default: 0 },
    perfectDates: { type: [String], default: [] },
    brokenStreak: { type: Number, default: null },
    brokenAt: { type: Date, default: null },
    achievements: {
      type: [
        {
          id: { type: String, required: true },
          unlockedAt: { type: String, required: true }
        }
      ],
      default: []
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userGameProfileSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: String(_id) };
  }
});

export const UserGameProfileModel = model<UserGameProfile>(
  "UserGameProfile",
  userGameProfileSchema
);

// ─── XPEvent ─────────────────────────────────────────────────────────────────

export const XP_REASONS = [
  "action_complete",
  "measurable_hit",
  "measurable_logged",
  "action_reverted",
  "measurable_reverted",
  "habit_deleted",
  "legendary_day",
  "streak_bonus",
  "achievement_bonus",
  "checkin"
] as const;

export type XPReason = (typeof XP_REASONS)[number];

export interface XPEvent {
  userId: Types.ObjectId;
  habitId?: Types.ObjectId;
  date: string; // YYYY-MM-DD
  amount: number;
  reason: XPReason;
  createdAt: Date;
}

export type XPEventDocument = HydratedDocument<XPEvent>;

const xpEventSchema = new Schema<XPEvent>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    habitId: { type: Schema.Types.ObjectId, ref: "Habit" },
    date: { type: String, required: true },
    amount: { type: Number, required: true },
    reason: { type: String, enum: XP_REASONS, required: true }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

xpEventSchema.index({ userId: 1, date: 1 });

xpEventSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: String(_id) };
  }
});

export const XPEventModel = model<XPEvent>("XPEvent", xpEventSchema);

// ─── PushSubscription ─────────────────────────────────────────────────────────

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface PushSubscriptionDoc {
  userId: Types.ObjectId;
  endpoint: string;
  keys: PushSubscriptionKeys;
  userAgent: string;
  createdAt: Date;
}

export type PushSubscriptionDocument = HydratedDocument<PushSubscriptionDoc>;

const pushSubscriptionSchema = new Schema<PushSubscriptionDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true }
    },
    userAgent: { type: String, default: "" }
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
    versionKey: false
  }
);

pushSubscriptionSchema.index({ userId: 1, endpoint: 1 }, { unique: true });

pushSubscriptionSchema.set("toJSON", {
  virtuals: true,
  transform: (_doc, ret) => {
    const { _id, ...rest } = ret;
    return { ...rest, id: String(_id) };
  }
});

export const PushSubscriptionModel = model<PushSubscriptionDoc>(
  "PushSubscription",
  pushSubscriptionSchema
);
