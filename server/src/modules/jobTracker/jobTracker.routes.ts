import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  getProfileController,
  updateProfileController
} from "./jobTracker.controller.js";

export const jobTrackerRouter = Router();

jobTrackerRouter.get("/", requireAuth, getProfileController);
jobTrackerRouter.put("/", requireAuth, updateProfileController);
