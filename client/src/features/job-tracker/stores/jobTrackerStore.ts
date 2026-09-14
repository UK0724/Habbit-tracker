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
  UserNote
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
  saveError: string | null;
  retrySave: () => void;

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

// Matches the server-side seed in jobTracker.service.ts so the pre-load UI
// does not flash different numbers than the profile it is about to receive.
const DEFAULT_WEEKLY_GOALS: WeeklyGoals = {
  appsTarget: 10,
  appsCurrent: 0,
  referralsTarget: 5,
  referralsCurrent: 0,
  studyHoursTarget: 5,
  studyHoursCurrent: 0,
  linkedinTarget: 1,
  linkedinCurrent: 0
};

let saveChain = Promise.resolve();
let saveTimer: ReturnType<typeof setTimeout> | undefined;

// ponytail: every mutation PUTs the whole profile, so it is debounced rather
// than split into per-entity routes. Split it if the document gets large or
// two tabs start clobbering each other.
const queueSave = (
  state: JobTrackerState,
  set: (partial: Partial<JobTrackerState>) => void
) => {
  const token = useAuthStore.getState().token;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if(token !== useAuthStore.getState().token) return;
    saveChain = saveChain.catch(()=>{}).then(async()=>{
      if(token!==useAuthStore.getState().token)return;
      await jobTrackerStorage.saveProfile(state);
    })
      .then(() => set({ saveError: null }))
      .catch((err: unknown) =>
        set({
          saveError:
            err instanceof Error ? err.message : "Failed to save changes"
        })
      );
  }, 600);
};

export const useJobTrackerStore = create<JobTrackerState>((set, get) => ({
  applications: [],
  referrals: [],
  dailyTasks: [],
  weeklyGoals: DEFAULT_WEEKLY_GOALS,
  prepCategories: [],
  wishlist: [],
  resumes: [],
  resources: [],
  notes: [],
  streak: 0,
  saveError: null,
  retrySave: () => queueSave(get(),set),

  loadAllData: async () => {
    try {
      const data = await jobTrackerStorage.getProfile();
      if (data) {
        set({
          applications: data.applications || [],
          referrals: data.referrals || [],
          dailyTasks: data.dailyTasks || [],
          weeklyGoals: data.weeklyGoals || DEFAULT_WEEKLY_GOALS,
          prepCategories: data.prepCategories || [],
          wishlist: data.wishlist || [],
          resumes: data.resumes || [],
          resources: data.resources || [],
          notes: data.notes || [],
          streak: typeof data.streak === "number" ? data.streak : 0
        });
      }
    } catch (err) {
      set({saveError: err instanceof Error ? err.message : "Could not load job search. Retry before editing."});
    }
  },

  clearAllData: () => {
    // Resetting local Zustand state to defaults and saving to the server
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
      weeklyGoals: DEFAULT_WEEKLY_GOALS
    });
    queueSave(get(), set);
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
    queueSave(get(), set);
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
    queueSave(get(), set);
  },

  deleteApplication: (id) => {
    const updated = get().applications.filter((app) => app.id !== id);
    set({ applications: updated });
    queueSave(get(), set);
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
    queueSave(get(), set);
  },

  // Referrals
  addReferral: (refData) => {
    const id = `ref-${Date.now()}`;
    const newRef: Referral = { ...refData, id };
    const updated = [newRef, ...get().referrals];
    
    const goals = get().weeklyGoals;
    const updatedGoals = { ...goals, referralsCurrent: goals.referralsCurrent + 1 };

    set({ referrals: updated, weeklyGoals: updatedGoals });
    queueSave(get(), set);
  },

  updateReferral: (updatedRef) => {
    const updated = get().referrals.map((ref) =>
      ref.id === updatedRef.id ? updatedRef : ref
    );
    set({ referrals: updated });
    queueSave(get(), set);
  },

  deleteReferral: (id) => {
    const updated = get().referrals.filter((ref) => ref.id !== id);
    set({ referrals: updated });
    queueSave(get(), set);
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
    queueSave(get(), set);
  },

  toggleTask: (id) => {
    const updated = get().dailyTasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t
    );
    set({ dailyTasks: updated });
    queueSave(get(), set);
  },

  deleteTask: (id) => {
    const updated = get().dailyTasks.filter((t) => t.id !== id);
    set({ dailyTasks: updated });
    queueSave(get(), set);
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
    queueSave(get(), set);
  },

  updateStreak: (streak) => {
    set({ streak });
    queueSave(get(), set);
  },

  // Weekly Goals
  updateWeeklyGoals: (goals) => {
    const updated = { ...get().weeklyGoals, ...goals };
    set({ weeklyGoals: updated });
    queueSave(get(), set);
  },

  incrementGoalProgress: (key, amount = 1) => {
    const goals = get().weeklyGoals;
    const updated = {
      ...goals,
      [key]: Math.max(0, (goals[key] || 0) + amount)
    };
    set({ weeklyGoals: updated });
    queueSave(get(), set);
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
    queueSave(get(), set);
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
    queueSave(get(), set);
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
    queueSave(get(), set);
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
    queueSave(get(), set);
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
    queueSave(get(), set);
  },

  deletePrepCategory: (id) => {
    const updated = get().prepCategories.filter((cat) => cat.id !== id);
    set({ prepCategories: updated });
    queueSave(get(), set);
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
    queueSave(get(), set);
  },

  // Wishlist
  addWishlistCompany: (companyData) => {
    const id = `w-${Date.now()}`;
    const newCompany: WishlistCompany = { ...companyData, id };
    const updated = [newCompany, ...get().wishlist];
    set({ wishlist: updated });
    queueSave(get(), set);
  },

  updateWishlistCompany: (updatedCompany) => {
    const updated = get().wishlist.map((c) =>
      c.id === updatedCompany.id ? updatedCompany : c
    );
    set({ wishlist: updated });
    queueSave(get(), set);
  },

  deleteWishlistCompany: (id) => {
    const updated = get().wishlist.filter((c) => c.id !== id);
    set({ wishlist: updated });
    queueSave(get(), set);
  },

  // Resumes
  addResumeVersion: (resumeData) => {
    const id = `res-${Date.now()}`;
    const newResume: ResumeVersion = { ...resumeData, id };
    const updated = [newResume, ...get().resumes];
    set({ resumes: updated });
    queueSave(get(), set);
  },

  updateResumeVersion: (updatedResume) => {
    const updated = get().resumes.map((r) =>
      r.id === updatedResume.id ? updatedResume : r
    );
    set({ resumes: updated });
    queueSave(get(), set);
  },

  deleteResumeVersion: (id) => {
    const updated = get().resumes.filter((r) => r.id !== id);
    set({ resumes: updated });
    queueSave(get(), set);
  },

  // Resources
  addResource: (resData) => {
    const id = `res-bm-${Date.now()}`;
    const newRes: ResourceBookmark = { ...resData, id };
    const updated = [newRes, ...get().resources];
    set({ resources: updated });
    queueSave(get(), set);
  },

  deleteResource: (id) => {
    const updated = get().resources.filter((r) => r.id !== id);
    set({ resources: updated });
    queueSave(get(), set);
  },

  // Notes
  addNote: (noteData) => {
    const id = `note-${Date.now()}`;
    const newNote: UserNote = { ...noteData, id };
    const updated = [newNote, ...get().notes];
    set({ notes: updated });
    queueSave(get(), set);
    return id;
  },

  updateNote: (updatedNote) => {
    const updated = get().notes.map((n) =>
      n.id === updatedNote.id ? updatedNote : n
    );
    set({ notes: updated });
    queueSave(get(), set);
  },

  deleteNote: (id) => {
    const updated = get().notes.filter((n) => n.id !== id);
    set({ notes: updated });
    queueSave(get(), set);
  }
}));

useAuthStore.subscribe((state,previous)=>{if(state.token!==previous.token) { clearTimeout(saveTimer); useJobTrackerStore.setState(useJobTrackerStore.getInitialState(),true); }});
