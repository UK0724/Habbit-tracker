import { HydratedDocument, Schema, Types, model } from "mongoose";

import type { ProfileData } from "./jobTracker.validation.js";

// Subdocuments definitions

const jobApplicationSchema = new Schema({
  id: { type: String, required: true },
  company: { type: String, required: true },
  role: { type: String, required: true },
  techStack: { type: [String], required: true },
  jobUrl: { type: String, default: "" },
  salary: { type: String, default: "" },
  location: { type: String, required: true },
  appliedDate: { type: String, required: true },
  status: { type: String, required: true },
  notes: { type: String, default: "" },
  resumeVersionUsed: { type: String, default: "" }
}, { _id: false });

const referralSchema = new Schema({
  id: { type: String, required: true },
  company: { type: String, required: true },
  personName: { type: String, required: true },
  linkedin: { type: String, default: "" },
  dateSent: { type: String, required: true },
  replied: { type: Boolean, default: false },
  followUpDate: { type: String, required: true },
  notes: { type: String, default: "" }
}, { _id: false });

const dailyTaskSchema = new Schema({
  id: { type: String, required: true },
  dayOfWeek: { type: String, required: true },
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  custom: { type: Boolean, default: false }
}, { _id: false });

const weeklyGoalsSchema = new Schema({
  appsTarget: { type: Number, default: 40 },
  appsCurrent: { type: Number, default: 0 },
  referralsTarget: { type: Number, default: 20 },
  referralsCurrent: { type: Number, default: 0 },
  studyHoursTarget: { type: Number, default: 5 },
  studyHoursCurrent: { type: Number, default: 0 },
  linkedinTarget: { type: Number, default: 1 },
  linkedinCurrent: { type: Number, default: 0 }
}, { _id: false });

const prepTopicSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  completed: { type: Boolean, default: false },
  notes: { type: String, default: "" },
  difficulty: { type: String, required: true },
  revisionCount: { type: Number, default: 0 }
}, { _id: false });

const prepCategorySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  topics: { type: [prepTopicSchema], default: [] }
}, { _id: false });

const wishlistCompanySchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  careerPage: { type: String, default: "" },
  priority: { type: String, required: true },
  dreamCompany: { type: Boolean, default: false },
  referralAvailable: { type: Boolean, default: false },
  lastAppliedDate: { type: String, default: "" }
}, { _id: false });

const resumeVersionSchema = new Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  fileUrl: { type: String, default: "" },
  dateCreated: { type: String, required: true },
  usageCount: { type: Number, default: 0 },
  successCount: { type: Number, default: 0 }
}, { _id: false });

const resourceBookmarkSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  url: { type: String, required: true },
  category: { type: String, required: true }
}, { _id: false });

const userNoteSchema = new Schema({
  id: { type: String, required: true },
  title: { type: String, required: true },
  content: { type: String, default: "" },
  category: { type: String, required: true },
  dateUpdated: { type: String, required: true }
}, { _id: false });

// Top Level Interface

// Shapes come from the request schema so the model and the validator cannot
// drift apart.
export interface JobSearchProfile extends ProfileData {
  userId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type JobSearchProfileDocument = HydratedDocument<JobSearchProfile>;

const jobSearchProfileSchema = new Schema<JobSearchProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    applications: [jobApplicationSchema],
    referrals: [referralSchema],
    dailyTasks: [dailyTaskSchema],
    weeklyGoals: { type: weeklyGoalsSchema, default: () => ({}) },
    prepCategories: [prepCategorySchema],
    wishlist: [wishlistCompanySchema],
    resumes: [resumeVersionSchema],
    resources: [resourceBookmarkSchema],
    notes: [userNoteSchema],
    streak: { type: Number, default: 8 }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

export const JobSearchProfileModel = model<JobSearchProfile>(
  "JobSearchProfile",
  jobSearchProfileSchema
);
