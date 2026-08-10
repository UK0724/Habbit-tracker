import { Router } from "express";
import { requireAuth } from "../../middleware/requireAuth.js";
import { validateRequest } from "../../middleware/validateRequest.js";
import {
  getDsaProfileController,
  getAllProblemsController,
  getProblemByIdController,
  markProblemSolvedController,
  unmarkProblemSolvedController
} from "./dsaPrep.controller.js";
import {
  markSolvedBodySchema,
  problemParamsSchema,
  unmarkSolvedBodySchema
} from "./dsaPrep.validation.js";

export const dsaPrepRouter = Router();

dsaPrepRouter.use(requireAuth);

dsaPrepRouter.get("/", getDsaProfileController);

dsaPrepRouter.get("/problems", getAllProblemsController);

dsaPrepRouter.get(
  "/problems/:id",
  validateRequest({ params: problemParamsSchema }),
  getProblemByIdController
);

dsaPrepRouter.post(
  "/solve",
  validateRequest({ body: markSolvedBodySchema }),
  markProblemSolvedController
);

dsaPrepRouter.post(
  "/unsolve",
  validateRequest({ body: unmarkSolvedBodySchema }),
  unmarkProblemSolvedController
);
