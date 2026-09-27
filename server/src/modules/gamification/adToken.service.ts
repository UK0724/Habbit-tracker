import { randomUUID } from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { UsedAdTokenModel } from "./gamification.model.js";

const AD_TOKEN_SECRET = env.JWT_SECRET + ":ad-token";
const AD_TOKEN_EXPIRY = "5m";

/**
 * Signs and returns a short-lived JWT that authorises a single streak restore.
 * The token encodes the userId and purpose so it cannot be reused cross-user.
 */
export const issueAdToken = (userId: string): string => {
  return jwt.sign({ userId, purpose: "streak-restore" }, AD_TOKEN_SECRET, {
    jwtid: randomUUID(),
    expiresIn: AD_TOKEN_EXPIRY
  });
};

/**
 * Verifies the token's signature, checks it belongs to `userId`, and marks it
 * as consumed in the database so it cannot be replayed.
 * Returns `true` on success, `false` if invalid / already used / expired.
 */
export const verifyAndConsumeAdToken = async (
  token: string,
  userId: string
): Promise<boolean> => {
  let payload: { userId: string; purpose: string };

  try {
    payload = jwt.verify(token, AD_TOKEN_SECRET, { algorithms: ["HS256"] }) as {
      userId: string;
      purpose: string;
    };
  } catch {
    return false;
  }

  if (payload.userId !== userId || payload.purpose !== "streak-restore") {
    return false;
  }

  // Ensure one-time use via unique index on token
  try {
    await UsedAdTokenModel.create({ token, usedAt: new Date() });
  } catch (err: unknown) {
    // Duplicate key = already used
    if (
      err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code: number }).code === 11000
    ) {
      return false;
    }
    throw err;
  }

  return true;
};
