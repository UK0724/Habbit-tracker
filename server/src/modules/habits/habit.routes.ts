import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  createHabitController,
  deleteHabitController,
  getHabitController,
  getHabitStatsController,
  listHabitsController,
  updateHabitController
} from "./habit.controller.js";
import {
  createHabitBodySchema,
  habitParamsSchema,
  listHabitsQuerySchema,
  updateHabitBodySchema
} from "./habit.validation.js";

export const habitRouter = Router();

habitRouter.use(requireAuth);

habitRouter.get(
  "/",
  validateRequest({
    query: listHabitsQuerySchema
  }),
  listHabitsController
);

habitRouter.post(
  "/",
  validateRequest({
    body: createHabitBodySchema
  }),
  createHabitController
);

habitRouter.get(
  "/:id/stats",
  validateRequest({
    params: habitParamsSchema
  }),
  getHabitStatsController
);

habitRouter.get(
  "/:id",
  validateRequest({
    params: habitParamsSchema
  }),
  getHabitController
);

habitRouter.patch(
  "/:id",
  validateRequest({
    params: habitParamsSchema,
    body: updateHabitBodySchema
  }),
  updateHabitController
);

habitRouter.delete(
  "/:id",
  validateRequest({
    params: habitParamsSchema
  }),
  deleteHabitController
);
