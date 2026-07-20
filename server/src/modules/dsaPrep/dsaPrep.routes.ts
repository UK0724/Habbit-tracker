import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import {
  getDsaProfileController,
  markProblemSolvedController,
  unmarkProblemSolvedController
} from "./dsaPrep.controller.js";

export const dsaPrepRouter = Router();

dsaPrepRouter.get("/", requireAuth, getDsaProfileController);
dsaPrepRouter.post("/solve", requireAuth, markProblemSolvedController);
dsaPrepRouter.post("/unsolve", requireAuth, unmarkProblemSolvedController);
