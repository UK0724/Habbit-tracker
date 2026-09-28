import nodemailer from "nodemailer";

import { clientOrigins, env } from "../../config/env.js";

let transport: nodemailer.Transporter | undefined;

export const appUrl = () => env.APP_URL ?? clientOrigins[0] ?? "http://localhost:5173";

/** Sends through SMTP when configured; otherwise logs that email is disabled (never the content). */
export const sendMail = async (message: { to: string; subject: string; text: string; html: string }) => {
  if (!env.SMTP_USER || !env.SMTP_PASS) {
    console.error("[mailer] SMTP is not configured; email not sent");
    return false;
  }
  transport ??= nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS }
  });
  await transport.sendMail({ from: env.MAIL_FROM ?? `Pulse <${env.SMTP_USER}>`, ...message });
  return true;
};
