import { trackingRouter } from "./modules/habits/tracking.routes.js";
import cors from "cors";
import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";

import { clientOrigins, env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { accountRouter } from "./modules/auth/account.routes.js";
import { avatarRouter } from "./modules/auth/avatar.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { passwordResetRouter } from "./modules/auth/passwordReset.routes.js";
import { habitRouter } from "./modules/habits/habit.routes.js";
import { streakRepairRouter } from "./modules/habits/streakRepair.routes.js";
import { habitLogRouter } from "./modules/habitLogs/habitLog.routes.js";
import { expenseRouter } from "./modules/expenses/expense.routes.js";
import { gamificationRouter } from "./modules/gamification/gamification.routes.js";

export const app = express();
app.disable("x-powered-by");
app.set("trust proxy", env.TRUST_PROXY_HOPS);
app.use(helmet());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || clientOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    }
  })
);
app.use(express.json());
app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));
app.use("/api", (_request, response, next) => {
  response.setHeader("Cache-Control", "no-store");
  next();
});

app.get("/api/health", (_request, response) => {
  const healthy = mongoose.connection.readyState === 1;
  response
    .status(healthy ? 200 : 503)
    .json({ status: healthy ? "ok" : "unavailable" });
});

app.use("/api/auth", authRouter);
app.use("/api/auth", passwordResetRouter);
app.use("/api/account/avatar", avatarRouter);
app.use("/api/account", accountRouter);
app.use("/api", trackingRouter);
app.use("/api", streakRepairRouter);
app.use("/api/habits", habitRouter);
app.use("/api/expenses", expenseRouter);
app.use("/api/gamification", gamificationRouter);
app.use("/api", habitLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);
