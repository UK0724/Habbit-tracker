import { HydratedDocument, Schema, model } from "mongoose";

export interface User {
  timezone?: string;
  email: string;
  passwordHash: string;
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
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = model<User>("User", userSchema);
