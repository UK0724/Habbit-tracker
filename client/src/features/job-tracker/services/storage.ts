import { apiRequest } from "../../../services/api";

export const jobTrackerStorage = {
  // Fetch the entire profile (including applications, referrals, checklist, prep progress) from the server.
  // If the profile does not exist, the server will seed it automatically.
  getProfile: async (): Promise<any> => {
    return apiRequest<any>("/job-tracker");
  },

  // Save the updated profile to the server database.
  saveProfile: async (profileData: any): Promise<any> => {
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

    return apiRequest<any>("/job-tracker", {
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
