import { Router } from "express";

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
