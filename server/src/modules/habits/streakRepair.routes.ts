import { Router } from "express";
import { z } from "zod";

import { requireAuth, type AuthRequest } from "../../middleware/requireAuth.js";
import { catchAsync } from "../../utils/catchAsync.js";
import { isValidDateString } from "../../utils/date.js";
import { repairHabitStreak } from "./streakRepair.service.js";

export const streakRepairRouter = Router();

streakRepairRouter.post(
  "/habits/:id/streak-repair",
  requireAuth,
  catchAsync(async (req, res) => {
    const id = z.string().regex(/^[a-f0-9]{24}$/i).parse(req.params.id);
    const { date } = z
      .object({ date: z.string().refine(isValidDateString, "Invalid date") })
      .strict()
      .parse(req.body);
    res.json({ data: await repairHabitStreak((req as AuthRequest).userId, id, date) });
  })
);
