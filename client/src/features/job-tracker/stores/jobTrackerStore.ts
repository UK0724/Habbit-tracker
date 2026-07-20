import { create } from "zustand";
import { useAuthStore } from "../../../stores/authStore";
import { jobTrackerStorage } from "../services/storage";
import {
  JobApplication,
  Referral,
  DailyTask,
  WeeklyGoals,
  PrepCategory,
  PrepTopic,
  WishlistCompany,
  ResumeVersion,
  ResourceBookmark,
  UserNote,
  ApplicationStatus
} from "../types";
import { PRELOADED_SCHEDULE } from "../seedData";

interface JobTrackerState {
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

  // Actions
  loadAllData: () => Promise<void>;
  clearAllData: () => void;

  // Applications
  addApplication: (app: Omit<JobApplication, "id">) => void;
  updateApplication: (app: JobApplication) => void;
  deleteApplication: (id: string) => void;
  duplicateApplication: (id: string) => void;

  // Referrals
  addReferral: (ref: Omit<Referral, "id">) => void;
  updateReferral: (ref: Referral) => void;
  deleteReferral: (id: string) => void;

  // Daily Tasks
  addTask: (text: string, day: DailyTask["dayOfWeek"]) => void;
  toggleTask: (id: string) => void;
  deleteTask: (id: string) => void;
  preloadDayTasks: (day: DailyTask["dayOfWeek"]) => void;
  updateStreak: (streak: number) => void;

  // Weekly Goals
  updateWeeklyGoals: (goals: Partial<WeeklyGoals>) => void;
  incrementGoalProgress: (key: keyof WeeklyGoals, amount?: number) => void;

  // Interview Prep
  addPrepCategory: (name: string) => void;
  deletePrepCategory: (id: string) => void;
  addPrepTopic: (categoryId: string, topicName: string, difficulty: "Easy" | "Medium" | "Hard") => void;
  toggleTopic: (categoryId: string, topicId: string) => void;
  updateTopicNotes: (categoryId: string, topicId: string, notes: string) => void;
  incrementRevision: (categoryId: string, topicId: string) => void;
  setTopicDifficulty: (categoryId: string, topicId: string, difficulty: "Easy" | "Medium" | "Hard") => void;

  // Wishlist
  addWishlistCompany: (company: Omit<WishlistCompany, "id">) => void;
  updateWishlistCompany: (company: WishlistCompany) => void;
  deleteWishlistCompany: (id: string) => void;

  // Resumes
  addResumeVersion: (resume: Omit<ResumeVersion, "id">) => void;
  updateResumeVersion: (resume: ResumeVersion) => void;
  deleteResumeVersion: (id: string) => void;

  // Resources
  addResource: (res: Omit<ResourceBookmark, "id">) => void;
  deleteResource: (id: string) => void;

  // Notes
  addNote: (note: Omit<UserNote, "id">) => string;
  updateNote: (note: UserNote) => void;
  deleteNote: (id: string) => void;
}

export const useJobTrackerStore = create<JobTrackerState>((set, get) => ({
  applications: [],
  referrals: [],
  dailyTasks: [],
  weeklyGoals: {
    appsTarget: 40,
    appsCurrent: 18,
    referralsTarget: 20,
    referralsCurrent: 7,
    studyHoursTarget: 5,
    studyHoursCurrent: 2.5,
    linkedinTarget: 1,
    linkedinCurrent: 0
  },
  prepCategories: [],
  wishlist: [],
  resumes: [],
  resources: [],
  notes: [],
  streak: 8,

  loadAllData: async () => {
    try {
      const data = await jobTrackerStorage.getProfile();
      if (data) {
        set({
          applications: data.applications || [],
          referrals: data.referrals || [],
          dailyTasks: data.dailyTasks || [],
          weeklyGoals: data.weeklyGoals || {
            appsTarget: 40,
            appsCurrent: 18,
            referralsTarget: 20,
            referralsCurrent: 7,
            studyHoursTarget: 5,
            studyHoursCurrent: 2.5,
            linkedinTarget: 1,
            linkedinCurrent: 0
          },
          prepCategories: data.prepCategories || [],
          wishlist: data.wishlist || [],
          resumes: data.resumes || [],
          resources: data.resources || [],
          notes: data.notes || [],
          streak: typeof data.streak === "number" ? data.streak : 8
        });
      }
    } catch (err) {
      console.error("Failed to load Job Tracker data from backend:", err);
    }
  },

  clearAllData: () => {
    // Resetting local Zustand state to defaults and saving to the server
    const uid = useAuthStore.getState().user?.id ?? "guest";
    set({
      applications: [],
      referrals: [],
      dailyTasks: [],
      prepCategories: get().prepCategories.map((cat) => ({
        ...cat,
        topics: cat.topics.map((t) => ({
          ...t,
          completed: false,
          notes: "",
          revisionCount: 0
        }))
      })),
      wishlist: [],
      resumes: [],
      resources: [],
      notes: [],
      streak: 0,
      weeklyGoals: {
        appsTarget: 10,
        appsCurrent: 0,
        referralsTarget: 5,
        referralsCurrent: 0,
        studyHoursTarget: 5,
        studyHoursCurrent: 0,
        linkedinTarget: 1,
        linkedinCurrent: 0
      }
    });
    jobTrackerStorage.saveProfile(get());
  },

  // Applications
  addApplication: (appData) => {
    const id = `app-${Date.now()}`;
    const newApp: JobApplication = { ...appData, id };
    const updated = [newApp, ...get().applications];
    
    let goals = get().weeklyGoals;
    if (appData.status === "Applied") {
      goals = { ...goals, appsCurrent: goals.appsCurrent + 1 };
    }

    set({ applications: updated, weeklyGoals: goals });
    jobTrackerStorage.saveProfile(get());
  },

  updateApplication: (updatedApp) => {
    const prevStatus = get().applications.find(a => a.id === updatedApp.id)?.status;
    const updated = get().applications.map((app) =>
      app.id === updatedApp.id ? updatedApp : app
    );
    
    let goals = get().weeklyGoals;
    if (prevStatus !== "Applied" && updatedApp.status === "Applied") {
      goals = { ...goals, appsCurrent: goals.appsCurrent + 1 };
    }

    set({ applications: updated, weeklyGoals: goals });
    jobTrackerStorage.saveProfile(get());
  },

  deleteApplication: (id) => {
    const updated = get().applications.filter((app) => app.id !== id);
    set({ applications: updated });
    jobTrackerStorage.saveProfile(get());
  },

  duplicateApplication: (id) => {
    const original = get().applications.find((app) => app.id === id);
    if (!original) return;
    const duplicated: JobApplication = {
      ...original,
      id: `app-${Date.now()}`,
      company: `${original.company} (Copy)`,
      appliedDate: new Date().toISOString().split("T")[0] || ""
    };
    const updated = [duplicated, ...get().applications];
    set({ applications: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Referrals
  addReferral: (refData) => {
    const id = `ref-${Date.now()}`;
    const newRef: Referral = { ...refData, id };
    const updated = [newRef, ...get().referrals];
    
    const goals = get().weeklyGoals;
    const updatedGoals = { ...goals, referralsCurrent: goals.referralsCurrent + 1 };

    set({ referrals: updated, weeklyGoals: updatedGoals });
    jobTrackerStorage.saveProfile(get());
  },

  updateReferral: (updatedRef) => {
    const updated = get().referrals.map((ref) =>
      ref.id === updatedRef.id ? updatedRef : ref
    );
    set({ referrals: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deleteReferral: (id) => {
    const updated = get().referrals.filter((ref) => ref.id !== id);
    set({ referrals: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Daily Tasks
  addTask: (text, dayOfWeek) => {
    const newTask: DailyTask = {
      id: `task-${Date.now()}`,
      dayOfWeek,
      text,
      completed: false,
      custom: true
    };
    const updated = [...get().dailyTasks, newTask];
    set({ dailyTasks: updated });
    jobTrackerStorage.saveProfile(get());
  },

  toggleTask: (id) => {
    const updated = get().dailyTasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    set({ dailyTasks: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deleteTask: (id) => {
    const updated = get().dailyTasks.filter((t) => t.id !== id);
    set({ dailyTasks: updated });
    jobTrackerStorage.saveProfile(get());
  },

  preloadDayTasks: (day) => {
    const scheduleItems = PRELOADED_SCHEDULE[day] || [];
    const uid = useAuthStore.getState().user?.id ?? "guest";
    
    const nonDayTasks = get().dailyTasks.filter(t => t.dayOfWeek !== day);
    const newTasks: DailyTask[] = scheduleItems.map((item, idx) => ({
      id: `task-sched-${day}-${idx}-${uid}-${Date.now()}`,
      dayOfWeek: day,
      text: item.text,
      completed: item.completed,
      custom: false
    }));

    const updated = [...nonDayTasks, ...newTasks];
    set({ dailyTasks: updated });
    jobTrackerStorage.saveProfile(get());
  },

  updateStreak: (streak) => {
    set({ streak });
    jobTrackerStorage.saveProfile(get());
  },

  // Weekly Goals
  updateWeeklyGoals: (goals) => {
    const updated = { ...get().weeklyGoals, ...goals };
    set({ weeklyGoals: updated });
    jobTrackerStorage.saveProfile(get());
  },

  incrementGoalProgress: (key, amount = 1) => {
    const goals = get().weeklyGoals;
    const updated = {
      ...goals,
      [key]: Math.max(0, (goals[key] || 0) + amount)
    };
    set({ weeklyGoals: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Interview Prep
  toggleTopic: (categoryId, topicId) => {
    const updated = get().prepCategories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        topics: cat.topics.map((t) =>
          t.id === topicId ? { ...t, completed: !t.completed } : t
        )
      };
    });
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  updateTopicNotes: (categoryId, topicId, notes) => {
    const updated = get().prepCategories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        topics: cat.topics.map((t) => (t.id === topicId ? { ...t, notes } : t))
      };
    });
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  incrementRevision: (categoryId, topicId) => {
    const updated = get().prepCategories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        topics: cat.topics.map((t) =>
          t.id === topicId ? { ...t, revisionCount: t.revisionCount + 1 } : t
        )
      };
    });
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  setTopicDifficulty: (categoryId, topicId, difficulty) => {
    const updated = get().prepCategories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        topics: cat.topics.map((t) =>
          t.id === topicId ? { ...t, difficulty } : t
        )
      };
    });
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  addPrepCategory: (name) => {
    const id = `prep-${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;
    const newCategory: PrepCategory = {
      id,
      name,
      topics: []
    };
    const updated = [...get().prepCategories, newCategory];
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deletePrepCategory: (id) => {
    const updated = get().prepCategories.filter((cat) => cat.id !== id);
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  addPrepTopic: (categoryId, topicName, difficulty) => {
    const newTopic: PrepTopic = {
      id: `topic-${Date.now()}`,
      name: topicName,
      completed: false,
      notes: "",
      difficulty,
      revisionCount: 0
    };
    const updated = get().prepCategories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      return {
        ...cat,
        topics: [...cat.topics, newTopic]
      };
    });
    set({ prepCategories: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Wishlist
  addWishlistCompany: (companyData) => {
    const id = `w-${Date.now()}`;
    const newCompany: WishlistCompany = { ...companyData, id };
    const updated = [newCompany, ...get().wishlist];
    set({ wishlist: updated });
    jobTrackerStorage.saveProfile(get());
  },

  updateWishlistCompany: (updatedCompany) => {
    const updated = get().wishlist.map((c) =>
      c.id === updatedCompany.id ? updatedCompany : c
    );
    set({ wishlist: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deleteWishlistCompany: (id) => {
    const updated = get().wishlist.filter((c) => c.id !== id);
    set({ wishlist: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Resumes
  addResumeVersion: (resumeData) => {
    const id = `res-${Date.now()}`;
    const newResume: ResumeVersion = { ...resumeData, id };
    const updated = [newResume, ...get().resumes];
    set({ resumes: updated });
    jobTrackerStorage.saveProfile(get());
  },

  updateResumeVersion: (updatedResume) => {
    const updated = get().resumes.map((r) =>
      r.id === updatedResume.id ? updatedResume : r
    );
    set({ resumes: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deleteResumeVersion: (id) => {
    const updated = get().resumes.filter((r) => r.id !== id);
    set({ resumes: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Resources
  addResource: (resData) => {
    const id = `res-bm-${Date.now()}`;
    const newRes: ResourceBookmark = { ...resData, id };
    const updated = [newRes, ...get().resources];
    set({ resources: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deleteResource: (id) => {
    const updated = get().resources.filter((r) => r.id !== id);
    set({ resources: updated });
    jobTrackerStorage.saveProfile(get());
  },

  // Notes
  addNote: (noteData) => {
    const id = `note-${Date.now()}`;
    const newNote: UserNote = { ...noteData, id };
    const updated = [newNote, ...get().notes];
    set({ notes: updated });
    jobTrackerStorage.saveProfile(get());
    return id;
  },

  updateNote: (updatedNote) => {
    const updated = get().notes.map((n) =>
      n.id === updatedNote.id ? updatedNote : n
    );
    set({ notes: updated });
    jobTrackerStorage.saveProfile(get());
  },

  deleteNote: (id) => {
    const updated = get().notes.filter((n) => n.id !== id);
    set({ notes: updated });
    jobTrackerStorage.saveProfile(get());
  }
}));
