import { HydratedDocument, Schema, Types, model } from "mongoose";

export interface SolvedProblem {
  problemId: number; // 1 to 500
  language: string;  // e.g. "python", "javascript"
  solvedAt: Date;
  revisionDueDate?: string;
  revisionDates?: string[];
  notes?: string;
}

export interface DsaPrepProfile {
  userId: Types.ObjectId;
  solvedProblems: SolvedProblem[];
  createdAt: Date;
  updatedAt: Date;
}

export type DsaPrepProfileDocument = HydratedDocument<DsaPrepProfile>;

const solvedProblemSchema = new Schema<SolvedProblem>({
  problemId: { type: Number, required: true },
  language: { type: String, required: true },
  solvedAt: { type: Date, default: Date.now },
  revisionDueDate: String,
  revisionDates: { type: [String], default: [] },
  notes: { type: String, default: "" }
}, { _id: false });

const dsaPrepProfileSchema = new Schema<DsaPrepProfile>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  solvedProblems: { type: [solvedProblemSchema], default: [] }
}, {
  timestamps: true,
  versionKey: false
});

export const DsaPrepProfileModel = model<DsaPrepProfile>("DsaPrepProfile", dsaPrepProfileSchema);

export interface DsaProblemDetail {
  id: number;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  section: string;
  subSection: string;
  pattern: string;
  description: string;
  naiveSolution: {
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: Record<string, string>;
  };
  optimizedSolution: {
    explanation: string;
    timeComplexity: string;
    spaceComplexity: string;
    code: Record<string, string>;
  };
}

const solutionSchema = new Schema({
  explanation: { type: String, required: true },
  timeComplexity: { type: String, required: true },
  spaceComplexity: { type: String, required: true },
  code: { type: Map, of: String, default: {} }
}, { _id: false });

const dsaProblemSchema = new Schema<DsaProblemDetail>({
  id: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  difficulty: { type: String, required: true },
  section: { type: String, required: true },
  subSection: { type: String, required: true },
  pattern: { type: String, required: true },
  description: { type: String, required: true },
  naiveSolution: { type: solutionSchema, required: true },
  optimizedSolution: { type: solutionSchema, required: true }
}, {
  timestamps: true,
  versionKey: false
});

export const DsaProblemModel = model<DsaProblemDetail>("DsaProblem", dsaProblemSchema);
