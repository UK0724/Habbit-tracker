import { HydratedDocument, Schema, Types, model } from "mongoose";

export interface SolvedProblem {
  problemId: number; // 1 to 500
  language: string;  // e.g. "python", "javascript"
  solvedAt: Date;
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
