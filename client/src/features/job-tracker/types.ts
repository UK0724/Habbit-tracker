import { z } from "zod";

// Job Application Status
export type ApplicationStatus =
  | "Wishlist"
  | "Applied"
  | "Referral Requested"
  | "HR Call"
  | "OA"
  | "Interview 1"
  | "Interview 2"
  | "Final Round"
  | "Offer"
  | "Rejected";

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  "Wishlist",
  "Applied",
  "Referral Requested",
  "HR Call",
  "OA",
  "Interview 1",
  "Interview 2",
  "Final Round",
  "Offer",
  "Rejected"
];

// Zod schemas for validation
export const JobApplicationSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role is required"),
  techStack: z.array(z.string()).min(1, "At least one technology is required"),
  jobUrl: z.string().url("Must be a valid URL").or(z.literal("")),
  salary: z.string().optional(),
  location: z.string().min(1, "Location is required"),
  appliedDate: z.string().min(1, "Applied date is required"),
  status: z.enum([
    "Wishlist",
    "Applied",
    "Referral Requested",
    "HR Call",
    "OA",
    "Interview 1",
    "Interview 2",
    "Final Round",
    "Offer",
    "Rejected"
  ] as const),
  followUpDate: z.string().optional(),
  notes: z.string().optional(),
  resumeVersionUsed: z.string().optional()
});

export type JobApplication = z.infer<typeof JobApplicationSchema> & { id: string };

export const ReferralSchema = z.object({
  id: z.string().optional(),
  company: z.string().min(1, "Company is required"),
  personName: z.string().min(1, "Contact person name is required"),
  linkedin: z.string().url("Must be a valid LinkedIn URL").or(z.literal("")),
  dateSent: z.string().min(1, "Date sent is required"),
  replied: z.boolean().default(false),
  followUpDate: z.string().min(1, "Follow-up date is required"),
  notes: z.string().optional()
});

export type Referral = z.infer<typeof ReferralSchema> & { id: string };

export const DailyTaskSchema = z.object({
  id: z.string(),
  dayOfWeek: z.enum([
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday"
  ]),
  text: z.string().min(1, "Task description is required"),
  completed: z.boolean().default(false),
  custom: z.boolean().default(false)
});

export type DailyTask = z.infer<typeof DailyTaskSchema>;

export const WeeklyGoalsSchema = z.object({
  appsTarget: z.number().default(40),
  appsCurrent: z.number().default(0),
  referralsTarget: z.number().default(20),
  referralsCurrent: z.number().default(0),
  studyHoursTarget: z.number().default(5),
  studyHoursCurrent: z.number().default(0),
  linkedinTarget: z.number().default(1),
  linkedinCurrent: z.number().default(0)
});

export type WeeklyGoals = z.infer<typeof WeeklyGoalsSchema>;

export const PrepTopicSchema = z.object({
  id: z.string(),
  name: z.string(),
  completed: z.boolean().default(false),
  notes: z.string().default(""),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  revisionCount: z.number().default(0)
});

export type PrepTopic = z.infer<typeof PrepTopicSchema>;

export const PrepCategorySchema = z.object({
  id: z.string(),
  name: z.string(),
  topics: z.array(PrepTopicSchema)
});

export type PrepCategory = z.infer<typeof PrepCategorySchema>;

export const WishlistCompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Company name is required"),
  careerPage: z.string().url("Must be a valid URL").or(z.literal("")),
  priority: z.enum(["Low", "Medium", "High"]),
  dreamCompany: z.boolean().default(false),
  referralAvailable: z.boolean().default(false),
  lastAppliedDate: z.string().optional()
});

export type WishlistCompany = z.infer<typeof WishlistCompanySchema> & { id: string };

export const ResumeVersionSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Resume version name is required"),
  fileUrl: z.string().optional(),
  dateCreated: z.string(),
  usageCount: z.number().default(0),
  successCount: z.number().default(0)
});

export type ResumeVersion = z.infer<typeof ResumeVersionSchema> & { id: string };

export const ResourceBookmarkSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  url: z.string().url("Must be a valid URL"),
  category: z.enum(["Job Links", "Leetcode", "Frontend", "Videos", "Articles"])
});

export type ResourceBookmark = z.infer<typeof ResourceBookmarkSchema> & { id: string };

export const UserNoteSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Title is required"),
  content: z.string().default(""),
  category: z.enum([
    "Interview Notes",
    "Questions",
    "Learning",
    "STAR Stories",
    "Recruiter Conversations"
  ]),
  dateUpdated: z.string()
});

export type UserNote = z.infer<typeof UserNoteSchema> & { id: string };
