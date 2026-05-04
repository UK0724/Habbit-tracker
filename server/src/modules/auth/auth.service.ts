import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import { env } from "../../config/env.js";
import { AppError } from "../../utils/appError.js";
import { UserModel } from "./user.model.js";

export type AuthResponse = {
  token: string;
  user: {
    id: string;
    email: string;
  };
};

const signToken = (userId: string): string =>
  jwt.sign({ sub: userId }, env.JWT_SECRET, { expiresIn: "30d" });

export const register = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const existing = await UserModel.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await UserModel.create({ email: email.toLowerCase(), passwordHash });

  return {
    token: signToken(user._id.toString()),
    user: { id: user._id.toString(), email: user.email }
  };
};

export const login = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AppError("Invalid email or password", 401);
  }

  return {
    token: signToken(user._id.toString()),
    user: { id: user._id.toString(), email: user.email }
  };
};

export const getMe = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new AppError("User not found", 404);
  }
  return { id: user._id.toString(), email: user.email };
};
