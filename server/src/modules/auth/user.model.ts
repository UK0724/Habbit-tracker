import { HydratedDocument, Schema, model } from "mongoose";

export interface User {
  timezone?: string;
  email: string;
  passwordHash: string;
  /** SHA-256 of the emailed reset token; the raw token is never stored. */
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  /** Small profile photo as a data URL (resized on the device, <= ~64 KB). */
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<User>;

const userSchema = new Schema<User>(
  {
    timezone: { type: String },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    resetTokenHash: { type: String, index: true, sparse: true },
    resetTokenExpiresAt: Date,
    // Never loaded by default: only the avatar endpoint reads it.
    avatar: { type: String, select: false }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = model<User>("User", userSchema);
