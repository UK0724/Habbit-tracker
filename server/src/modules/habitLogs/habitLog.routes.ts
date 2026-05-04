import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createHabitLogController,
  getTodayLogsController,
  listHabitLogsController,
  updateHabitLogController
} from "./habitLog.controller.js";
import {
  createHabitLogBodySchema,
  habitLogListQuerySchema,
  habitLogParamsSchema,
  habitLogUpdateParamsSchema,
  updateHabitLogBodySchema
} from "./habitLog.validation.js";

export const habitLogRouter = Router();

habitLogRouter.use(requireAuth);

habitLogRouter.get("/logs/today", getTodayLogsController);

habitLogRouter.get(
  "/habits/:id/logs",
  validateRequest({
    params: habitLogParamsSchema,
    query: habitLogListQuerySchema
  }),
  listHabitLogsController
);

habitLogRouter.post(
  "/habits/:id/logs",
  validateRequest({
    params: habitLogParamsSchema,
    body: createHabitLogBodySchema
  }),
  createHabitLogController
);

habitLogRouter.patch(
  "/habits/:id/logs/:logId",
  validateRequest({
    params: habitLogUpdateParamsSchema,
    body: updateHabitLogBodySchema
  }),
  updateHabitLogController
);
