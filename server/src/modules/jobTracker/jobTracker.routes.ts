import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  getProfileController,
  updateProfileController
} from "./jobTracker.controller.js";
import { updateProfileBodySchema } from "./jobTracker.validation.js";

export const jobTrackerRouter = Router();

jobTrackerRouter.use(requireAuth);

jobTrackerRouter.get("/", getProfileController);

jobTrackerRouter.put(
  "/",
  validateRequest({ body: updateProfileBodySchema }),
  updateProfileController
);
