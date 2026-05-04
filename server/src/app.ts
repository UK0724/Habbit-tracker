import cors from "cors";
import express from "express";
import morgan from "morgan";

import { clientOrigins } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFound.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { habitRouter } from "./modules/habits/habit.routes.js";
import { habitLogRouter } from "./modules/habitLogs/habitLog.routes.js";

export const app = express();

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
app.use(morgan("dev"));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/habits", habitRouter);
app.use("/api", habitLogRouter);

app.use(notFoundHandler);
app.use(errorHandler);
