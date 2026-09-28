import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";

import { AppError } from "../../utils/appError.js";
import { appUrl, sendMail } from "./mailer.js";
import { UserModel } from "./user.model.js";

const RESET_TTL_MS = 30 * 60 * 1000;
const hashToken = (token: string) => createHash("sha256").update(token).digest("hex");

/** Always resolves the same way, so the response never reveals whether an email is registered. */
export const requestPasswordReset = async (email: string) => {
  const user = await UserModel.findOne({ email: email.toLowerCase() });
  if (!user) return;
  const token = randomBytes(32).toString("base64url");
  user.resetTokenHash = hashToken(token);
  user.resetTokenExpiresAt = new Date(Date.now() + RESET_TTL_MS);
  await user.save();
  const link = `${appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  try {
    await sendMail({
      to: user.email,
      subject: "Reset your Pulse password",
      text: `Someone asked to reset the password for your Pulse account.\n\nChoose a new password here (valid for 30 minutes):\n${link}\n\nIf you didn't ask for this, you can ignore this email.`,
      html: `<p>Someone asked to reset the password for your Pulse account.</p><p><a href="${link}">Choose a new password</a> (valid for 30 minutes).</p><p>If you didn't ask for this, you can ignore this email.</p>`
    });
  } catch {
    // Never surface SMTP details to the caller; the user can simply retry.
    console.error("[passwordReset] Could not send reset email");
  }
};

export const resetPassword = async (token: string, password: string) => {
  const user = await UserModel.findOneAndUpdate(
    { resetTokenHash: hashToken(token), resetTokenExpiresAt: { $gt: new Date() } },
    { $unset: { resetTokenHash: 1, resetTokenExpiresAt: 1 } }
  );
  if (!user) throw new AppError("This reset link is invalid or has expired.", 400);
  await UserModel.updateOne(
    { _id: user._id },
    { $set: { passwordHash: await bcrypt.hash(password, 12) } }
  );
};
