import { z } from "zod";

// The client owns ids for every subdocument, so these are client-generated
// strings rather than ObjectIds. Fields are only bounded, not required --
// the whole profile is round-tripped on every save, so tightening these
// would reject documents that already exist.
const clientId = z.string().trim().min(1).max(120);
const text = (max: number) => z.string().trim().max(max);
const difficulty = z.enum(["Easy", "Medium", "Hard"]);

const applicationSchema = z.object({
  id: clientId,
  company: text(160),
  role: text(160),
  techStack: z.array(text(60)).max(50).default([]),
  jobUrl: text(2000).default(""),
  salary: text(60).default(""),
  location: text(160).default(""),
  appliedDate: text(20).default(""),
  status: text(40),
  notes: text(5000).default(""),
  resumeVersionUsed: text(160).default("")
});

const referralSchema = z.object({
  id: clientId,
  company: text(160),
  personName: text(160),
  linkedin: text(2000).default(""),
  dateSent: text(20).default(""),
  replied: z.boolean().default(false),
  followUpDate: text(20).default(""),
  notes: text(5000).default("")
});

const dailyTaskSchema = z.object({
  id: clientId,
  dayOfWeek: text(20),
  text: text(500),
  completed: z.boolean().default(false),
  custom: z.boolean().default(false)
});

const weeklyGoalsSchema = z.object({
  appsTarget: z.number().finite().nonnegative(),
  appsCurrent: z.number().finite().nonnegative(),
  referralsTarget: z.number().finite().nonnegative(),
  referralsCurrent: z.number().finite().nonnegative(),
  studyHoursTarget: z.number().finite().nonnegative(),
  studyHoursCurrent: z.number().finite().nonnegative(),
  linkedinTarget: z.number().finite().nonnegative(),
  linkedinCurrent: z.number().finite().nonnegative()
});

const prepTopicSchema = z.object({
  id: clientId,
  name: text(200),
  completed: z.boolean().default(false),
  notes: text(10000).default(""),
  difficulty,
  revisionCount: z.number().int().nonnegative().default(0)
});

const prepCategorySchema = z.object({
  id: clientId,
  name: text(120),
  topics: z.array(prepTopicSchema).max(500).default([])
});

const wishlistCompanySchema = z.object({
  id: clientId,
  name: text(160),
  careerPage: text(2000).default(""),
  priority: text(40),
  dreamCompany: z.boolean().default(false),
  referralAvailable: z.boolean().default(false),
  lastAppliedDate: text(20).default("")
});

const resumeVersionSchema = z.object({
  id: clientId,
  name: text(160),
  fileUrl: text(2000).default(""),
  dateCreated: text(20).default(""),
  usageCount: z.number().int().nonnegative().default(0),
  successCount: z.number().int().nonnegative().default(0)
});

const resourceBookmarkSchema = z.object({
  id: clientId,
  title: text(200),
  url: text(2000),
  category: text(60)
});

const userNoteSchema = z.object({
  id: clientId,
  title: text(200),
  content: text(50000).default(""),
  category: text(60),
  dateUpdated: text(40).default("")
});

// strict() matters here: the service $sets this body straight onto the
// profile document, so unknown keys must not survive.
export const updateProfileBodySchema = z
  .object({
    applications: z.array(applicationSchema).max(2000).optional(),
    referrals: z.array(referralSchema).max(2000).optional(),
    dailyTasks: z.array(dailyTaskSchema).max(2000).optional(),
    weeklyGoals: weeklyGoalsSchema.optional(),
    prepCategories: z.array(prepCategorySchema).max(200).optional(),
    wishlist: z.array(wishlistCompanySchema).max(1000).optional(),
    resumes: z.array(resumeVersionSchema).max(200).optional(),
    resources: z.array(resourceBookmarkSchema).max(1000).optional(),
    notes: z.array(userNoteSchema).max(2000).optional(),
    streak: z.number().int().nonnegative().optional()
  })
  .strict();

export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

// The stored document always has every field; only the update body is partial.
export type ProfileData = Required<UpdateProfileBody>;
