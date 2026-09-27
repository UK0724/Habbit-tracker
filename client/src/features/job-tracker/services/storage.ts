import type {
  JobApplication,
  Referral,
  DailyTask,
  WeeklyGoals,
  PrepCategory,
  WishlistCompany,
  ResumeVersion,
  ResourceBookmark,
  UserNote
} from "../types";
import { apiRequest } from "../../../services/api";
type Profile = {
  applications: JobApplication[];
  referrals: Referral[];
  dailyTasks: DailyTask[];
  weeklyGoals: WeeklyGoals;
  prepCategories: PrepCategory[];
  wishlist: WishlistCompany[];
  resumes: ResumeVersion[];
  resources: ResourceBookmark[];
  notes: UserNote[];
  streak: number;
};

export const jobTrackerStorage = {
  // Fetch the entire profile (including applications, referrals, checklist, prep progress) from the server.
  // If the profile does not exist, the server will seed it automatically.
  getProfile: async (): Promise<Profile> => {
    return apiRequest<Profile>("/job-tracker");
  },

  // Save the updated profile to the server database.
  saveProfile: async (profileData: Profile): Promise<Profile> => {
    const {
      applications,
      referrals,
      dailyTasks,
      weeklyGoals,
      prepCategories,
      wishlist,
      resumes,
      resources,
      notes,
      streak
    } = profileData;

    return apiRequest<Profile>("/job-tracker", {
      method: "PUT",
      body: JSON.stringify({
        applications,
        referrals,
        dailyTasks,
        weeklyGoals,
        prepCategories,
        wishlist,
        resumes,
        resources,
        notes,
        streak
      })
    });
  }
};
