import { JobSearchProfileModel } from "./jobTracker.model.js";

// Clean initial data seeder for starting fresh
const getSeeds = (userId: string) => ({
  applications: [],
  referrals: [],
  dailyTasks: [],
  weeklyGoals: {
    appsTarget: 10,
    appsCurrent: 0,
    referralsTarget: 5,
    referralsCurrent: 0,
    studyHoursTarget: 5,
    studyHoursCurrent: 0,
    linkedinTarget: 1,
    linkedinCurrent: 0
  },
  prepCategories: [
    {
      id: `prep-react-${userId}`,
      name: "React",
      topics: [
        { id: "r1", name: "Hooks (useEffect, useCallback, useMemo)", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "r2", name: "Context API & State Management", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "r3", name: "Virtual DOM & Reconciliation", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 },
        { id: "r4", name: "Concurrent Features (Suspense, Transition)", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 },
        { id: "r5", name: "Custom Hooks & Composition", completed: false, notes: "", difficulty: "Easy", revisionCount: 0 }
      ]
    },
    {
      id: `prep-angular-${userId}`,
      name: "Angular",
      topics: [
        { id: "a1", name: "Signals & Reactive Primitive", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "a2", name: "Component Lifecycle Hooks", completed: false, notes: "", difficulty: "Easy", revisionCount: 0 },
        { id: "a3", name: "Dependency Injection & Hierarchical Injectors", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 },
        { id: "a4", name: "RxJS & Observables Operators", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 }
      ]
    },
    {
      id: `prep-js-${userId}`,
      name: "JavaScript",
      topics: [
        { id: "j1", name: "Closures & Lexical Scope", completed: false, notes: "", difficulty: "Easy", revisionCount: 0 },
        { id: "j2", name: "Event Loop, Microtasks & Macrotasks", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 },
        { id: "j3", name: "Promises & Async/Await", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "j4", name: "Prototypes & Inheritance Model", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 }
      ]
    },
    {
      id: `prep-ts-${userId}`,
      name: "TypeScript",
      topics: [
        { id: "t1", name: "Generics & Constraints", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "t2", name: "Advanced Utility Types (Omit, Mapped Types)", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 },
        { id: "t3", name: "Union, Intersection & Type Guards", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 }
      ]
    },
    {
      id: `prep-system-${userId}`,
      name: "Frontend System Design",
      topics: [
        { id: "s1", name: "State Management Architecture", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "s2", name: "Asset Loading & Performance (CDN, Bundling)", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 },
        { id: "s3", name: "API Communication Strategies", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 }
      ]
    },
    {
      id: `prep-behavioral-${userId}`,
      name: "Behavioral",
      topics: [
        { id: "b1", name: "STAR Method Structure", completed: false, notes: "", difficulty: "Easy", revisionCount: 0 },
        { id: "b2", name: "Conflict Resolution Stories", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 }
      ]
    },
    {
      id: `prep-coding-${userId}`,
      name: "Machine Coding",
      topics: [
        { id: "m1", name: "Debounce & Throttle Polyfills", completed: false, notes: "", difficulty: "Medium", revisionCount: 0 },
        { id: "m2", name: "Promise Polyfill & Async Utilities", completed: false, notes: "", difficulty: "Hard", revisionCount: 0 }
      ]
    }
  ],
  wishlist: [],
  resumes: [],
  resources: [],
  notes: [],
  streak: 0
});

export const jobTrackerService = {
  getProfileByUserId: async (userId: string) => {
    let profile = await JobSearchProfileModel.findOne({ userId });
    
    if (!profile) {
      const seeds = getSeeds(userId);
      profile = await JobSearchProfileModel.create({
        userId,
        ...seeds
      });
    }
    
    return profile;
  },

  updateProfileByUserId: async (userId: string, updateData: any) => {
    const { userId: _, createdAt: __, updatedAt: ___, ...allowedUpdates } = updateData;
    
    const profile = await JobSearchProfileModel.findOneAndUpdate(
      { userId },
      { $set: allowedUpdates },
      { new: true, runValidators: true }
    );
    
    return profile;
  }
};
