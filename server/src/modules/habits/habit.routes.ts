import { Router } from "express";

import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  archiveHabitController,
  createHabitController,
  deleteHabitController,
  getHabitController,
  getHabitStatsController,
  listArchivedHabitsController,
  listHabitsController,
  updateHabitController
} from "./habit.controller.js";
import {
  archiveHabitBodySchema,
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

habitRouter.get("/archived", listArchivedHabitsController);

habitRouter.patch(
  "/:id/archive",
  validateRequest({
    params: habitParamsSchema,
    body: archiveHabitBodySchema
  }),
  archiveHabitController
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
