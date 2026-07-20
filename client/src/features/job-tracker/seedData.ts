import {
  JobApplication,
  Referral,
  DailyTask,
  WeeklyGoals,
  PrepCategory,
  WishlistCompany,
  ResumeVersion,
  ResourceBookmark,
  UserNote
} from "./types";

export const SEED_APPLICATIONS = (userId: string): JobApplication[] => [
  {
    id: `app-1-${userId}`,
    company: "Google",
    role: "Senior Frontend Engineer",
    techStack: ["React", "TypeScript", "System Design"],
    jobUrl: "https://careers.google.com/jobs/results/123456",
    salary: "₹45,00,000 - ₹55,00,000",
    location: "Bengaluru, India (Hybrid)",
    appliedDate: "2026-07-08",
    status: "HR Call",
    notes: "HR screen completed. Received positive feedback. Waiting for schedule of Interview 1 (Coding & DS).",
    resumeVersionUsed: "react-resume"
  },
  {
    id: `app-2-${userId}`,
    company: "Microsoft",
    role: "Software Engineer II (Frontend)",
    techStack: ["React", "TypeScript", "C#"],
    jobUrl: "https://careers.microsoft.com/jobs",
    salary: "₹38,00,000 - ₹44,00,000",
    location: "Hyderabad, India (Remote)",
    appliedDate: "2026-07-12",
    status: "Applied",
    notes: "Applied directly through referral by Jane Doe. Resume status: Under review.",
    resumeVersionUsed: "react-resume"
  },
  {
    id: `app-3-${userId}`,
    company: "Atlassian",
    role: "Senior Full Stack Engineer",
    techStack: ["React", "TypeScript", "Node.js", "Java"],
    jobUrl: "https://atlassian.com/careers",
    salary: "₹48,00,000 - ₹54,00,000",
    location: "Bengaluru, India (Hybrid)",
    appliedDate: "2026-06-25",
    status: "Offer",
    notes: "Received verbal offer! Total compensation details under negotiation. Team fit round went great.",
    resumeVersionUsed: "fullstack-resume"
  },
  {
    id: `app-4-${userId}`,
    company: "PhonePe",
    role: "UI Engineer",
    techStack: ["JavaScript", "React", "Webpack"],
    jobUrl: "https://phonepe.com/careers",
    salary: "₹35,00,000",
    location: "Bengaluru, India (On-site)",
    appliedDate: "2026-07-10",
    status: "OA",
    notes: "Online Assessment link received on HackerEarth. Test duration is 90 mins. Scheduled for this weekend.",
    resumeVersionUsed: "frontend-resume"
  },
  {
    id: `app-5-${userId}`,
    company: "Zoho",
    role: "Member Technical Staff - Frontend",
    techStack: ["JavaScript", "HTML", "CSS"],
    jobUrl: "https://zoho.com/careers",
    salary: "₹18,00,000",
    location: "Chennai, India (On-site)",
    appliedDate: "2026-07-05",
    status: "Interview 1",
    notes: "First technical round completed. Hand-written JavaScript tasks about closures and prototypes. Waiting for results.",
    resumeVersionUsed: "frontend-resume"
  },
  {
    id: `app-6-${userId}`,
    company: "Freshworks",
    role: "Lead Frontend Engineer",
    techStack: ["React", "Ember.js", "Node.js"],
    jobUrl: "https://freshworks.com/careers",
    salary: "₹36,00,000",
    location: "Chennai, India (Hybrid)",
    appliedDate: "2026-07-02",
    status: "Interview 2",
    notes: "System Design interview scheduled for July 17th. Need to review caching, CDN configuration and UI component performance.",
    resumeVersionUsed: "frontend-resume"
  },
  {
    id: `app-7-${userId}`,
    company: "Amazon",
    role: "Software Development Engineer II (Frontend)",
    techStack: ["React", "TypeScript", "Webpack"],
    jobUrl: "https://amazon.jobs",
    salary: "₹42,00,000 - ₹48,00,000",
    location: "Bengaluru, India (Hybrid)",
    appliedDate: "2026-06-20",
    status: "Final Round",
    notes: "Final loop completed on July 14th: 3 technical + 1 managerial. Strong focus on leadership principles.",
    resumeVersionUsed: "react-resume"
  },
  {
    id: `app-8-${userId}`,
    company: "Netflix",
    role: "Senior UI Engineer",
    techStack: ["React", "Node.js", "Rust"],
    jobUrl: "https://netflix.jobs",
    salary: "₹75,00,000",
    location: "Remote (USA/India)",
    appliedDate: "2026-06-15",
    status: "Rejected",
    notes: "Rejected after first technical round. Feedback: needed deeper expertise in low-level rendering optimizations and WebGL.",
    resumeVersionUsed: "react-resume"
  },
  {
    id: `app-9-${userId}`,
    company: "Stripe",
    role: "Frontend Engineer",
    techStack: ["React", "Ruby", "TypeScript"],
    jobUrl: "https://stripe.com/jobs",
    salary: "₹50,00,000",
    location: "Bengaluru (Hybrid)",
    appliedDate: "2026-07-14",
    status: "Referral Requested",
    notes: "Connected with an engineering lead on LinkedIn. Requested a referral for the Frontend Engineer position.",
    resumeVersionUsed: "react-resume"
  }
];

export const SEED_REFERRALS = (userId: string): Referral[] => [
  {
    id: `ref-1-${userId}`,
    company: "Google",
    personName: "Srivatsan Venkat",
    linkedin: "https://linkedin.com/in/srivatsan-google",
    dateSent: "2026-07-10",
    replied: true,
    followUpDate: "2026-07-18",
    notes: "Ex-colleague. Agreed to refer for Senior Frontend Engineer role in Cloud team. Referral submitted on July 11."
  },
  {
    id: `ref-2-${userId}`,
    company: "Microsoft",
    personName: "Jane Doe",
    linkedin: "https://linkedin.com/in/jane-doe-microsoft",
    dateSent: "2026-07-12",
    replied: true,
    followUpDate: "2026-07-16",
    notes: "College senior. Referred for SDE II. Received confirmation email from Microsoft Careers Portal."
  },
  {
    id: `ref-3-${userId}`,
    company: "Amazon",
    personName: "Bobby Miller",
    linkedin: "https://linkedin.com/in/bobby-miller-amazon",
    dateSent: "2026-07-14",
    replied: false,
    followUpDate: "2026-07-20",
    notes: "Cold outreach on LinkedIn. He accepted connection but has not read the referral message yet."
  }
];

export const PRELOADED_SCHEDULE = {
  Monday: [
    { id: "sched-m1", text: "React Interview Prep", completed: false },
    { id: "sched-m2", text: "Apply to React jobs", completed: false },
    { id: "sched-m3", text: "Send 3 referrals", completed: false }
  ],
  Tuesday: [
    { id: "sched-t1", text: "Angular Interview Prep", completed: true },
    { id: "sched-t2", text: "Apply to Angular jobs", completed: false },
    { id: "sched-t3", text: "Send 3 referrals", completed: true },
    { id: "sched-t4", text: "Study Angular Signals", completed: true },
    { id: "sched-t5", text: "Update Job Tracker", completed: true }
  ],
  Wednesday: [
    { id: "sched-w1", text: "JavaScript Revision", completed: false },
    { id: "sched-w2", text: "Apply to 5 jobs", completed: false },
    { id: "sched-w3", text: "Networking / LinkedIn outreach", completed: false }
  ],
  Thursday: [
    { id: "sched-th1", text: "Frontend System Design review", completed: false },
    { id: "sched-th2", text: "Apply to 5 jobs", completed: false },
    { id: "sched-th3", text: "Follow-up with recruiters", completed: false }
  ],
  Friday: [
    { id: "sched-f1", text: "Machine Coding Practice", completed: false },
    { id: "sched-f2", text: "Apply to 5 jobs", completed: false },
    { id: "sched-f3", text: "Work on Portfolio website", completed: false }
  ],
  Saturday: [
    { id: "sched-s1", text: "Resume updates", completed: false },
    { id: "sched-s2", text: "Mock Interview session", completed: false },
    { id: "sched-s3", text: "Draft LinkedIn post", completed: false }
  ],
  Sunday: [
    { id: "sched-su1", text: "Weekly Review & Retro", completed: false },
    { id: "sched-su2", text: "Formulate STAR Stories", completed: false },
    { id: "sched-su3", text: "Plan tasks for next week", completed: false }
  ]
};

export const SEED_DAILY_TASKS = (userId: string): DailyTask[] => {
  // Pre-load Tuesday tasks as a starting point (with some checked off)
  return [
    { id: `task-1-${userId}`, dayOfWeek: "Tuesday", text: "Apply to 5 jobs", completed: false, custom: false },
    { id: `task-2-${userId}`, dayOfWeek: "Tuesday", text: "Send 3 referrals", completed: true, custom: false },
    { id: `task-3-${userId}`, dayOfWeek: "Tuesday", text: "Study Angular Signals", completed: true, custom: false },
    { id: `task-4-${userId}`, dayOfWeek: "Tuesday", text: "Update Job Tracker", completed: false, custom: false }
  ];
};

export const DEFAULT_WEEKLY_GOALS = (): WeeklyGoals => ({
  appsTarget: 40,
  appsCurrent: 18,
  referralsTarget: 20,
  referralsCurrent: 7,
  studyHoursTarget: 5,
  studyHoursCurrent: 2.5,
  linkedinTarget: 1,
  linkedinCurrent: 0
});

export const PRELOADED_INTERVIEW_PREP = (userId: string): PrepCategory[] => [
  {
    id: `prep-react-${userId}`,
    name: "React",
    topics: [
      { id: "r1", name: "Hooks (useEffect, useCallback, useMemo)", completed: true, notes: "useEffect runs after paint. useCallback caches function instances, useMemo caches values. Always specify correct dependencies.", difficulty: "Medium", revisionCount: 3 },
      { id: "r2", name: "Context API & State Management", completed: true, notes: "React Context is for dependency injection, not full state management. Triggers re-renders on all consumers when values change. Combine with useReducer or use Zustand for heavy state.", difficulty: "Medium", revisionCount: 2 },
      { id: "r3", name: "Virtual DOM & Reconciliation", completed: false, notes: "React 16+ uses Fiber. Two phases: Render (reconciliation, pure, interruptible) and Commit (DOM mutations, synchronous). Diffing algorithm is O(N) using key and element type heuristics.", difficulty: "Hard", revisionCount: 1 },
      { id: "r4", name: "Concurrent Features (Suspense, Transition)", completed: false, notes: "useTransition lets you mark state updates as non-blocking. Suspense allows declarative loading states.", difficulty: "Hard", revisionCount: 0 },
      { id: "r5", name: "Custom Hooks & Composition", completed: true, notes: "Shares stateful logic, not state itself. Follow 'use' naming convention.", difficulty: "Easy", revisionCount: 4 }
    ]
  },
  {
    id: `prep-angular-${userId}`,
    name: "Angular",
    topics: [
      { id: "a1", name: "Signals & Reactive Primitive", completed: true, notes: "Angular v16 introduction. WritableSignals vs computed read-only. Bypasses Zone.js check-in cycles for granular change detection.", difficulty: "Medium", revisionCount: 2 },
      { id: "a2", name: "Component Lifecycle Hooks", completed: false, notes: "ngOnInit, ngOnChanges (triggers first), ngAfterViewInit, ngOnDestroy. Keep constructors clean, only inject dependencies.", difficulty: "Easy", revisionCount: 1 },
      { id: "a3", name: "Dependency Injection & Hierarchical Injectors", completed: false, notes: "ElementInjector -> ModuleInjector. ProvidedIn: 'root' makes it single, tree-shakeable. Use inject() function instead of constructor inject.", difficulty: "Hard", revisionCount: 0 },
      { id: "a4", name: "RxJS & Observables Operators", completed: false, notes: "switchMap (cancels previous), mergeMap (parallels), concatMap (sequential), exhaustMap (ignores). Always unsubscribe or use async pipe.", difficulty: "Hard", revisionCount: 1 }
    ]
  },
  {
    id: `prep-js-${userId}`,
    name: "JavaScript",
    topics: [
      { id: "j1", name: "Closures & Lexical Scope", completed: true, notes: "Function bundles with its lexical environment. Used for data encapsulation, private variables, memoization.", difficulty: "Easy", revisionCount: 5 },
      { id: "j2", name: "Event Loop, Microtasks & Macrotasks", completed: true, notes: "Single-threaded execution. Call stack -> Microtask Queue (Promises, queueMicrotask) -> Macrotask Queue (setTimeout, I/O). Microtask queue drains completely before next macrotask starts.", difficulty: "Hard", revisionCount: 4 },
      { id: "j3", name: "Promises & Async/Await", completed: true, notes: "Async/await is syntactic sugar over promises. Promises have states: Pending, Fulfilled, Rejected. Promise.all vs Promise.allSettled.", difficulty: "Medium", revisionCount: 3 },
      { id: "j4", name: "Prototypes & Inheritance Model", completed: false, notes: "Prototypal inheritance. Object.prototype is root. Prototype chain links __proto__ references.", difficulty: "Medium", revisionCount: 2 }
    ]
  },
  {
    id: `prep-ts-${userId}`,
    name: "TypeScript",
    topics: [
      { id: "t1", name: "Generics & Constraints", completed: true, notes: "Type parameters <T> allow reusable components. Use 'extends' key for constraints: <T extends object>.", difficulty: "Medium", revisionCount: 2 },
      { id: "t2", name: "Advanced Utility Types (Omit, Mapped Types)", completed: false, notes: "Record, Pick, Omit, Mapped types like {[K in keyof T]: string}. Keyof and Typeof operators.", difficulty: "Hard", revisionCount: 1 },
      { id: "t3", name: "Union, Intersection & Type Guards", completed: true, notes: "Discriminated unions with a literal 'type' field. Custom type guards using 'parameter is Type' syntax.", difficulty: "Medium", revisionCount: 3 }
    ]
  },
  {
    id: `prep-system-${userId}`,
    name: "Frontend System Design",
    topics: [
      { id: "s1", name: "State Management Architecture", completed: false, notes: "Differentiate Local state, Global state, Server cache, Form state. Understand single source of truth, unidirectional flow.", difficulty: "Medium", revisionCount: 1 },
      { id: "s2", name: "Asset Loading & Performance (CDN, Bundling)", completed: false, notes: "Critical Rendering Path. Code splitting, dynamic imports, async/defer scripts, preloading/prefetching assets.", difficulty: "Hard", revisionCount: 1 },
      { id: "s3", name: "API Communication Strategies", completed: false, notes: "REST vs GraphQL vs WebSockets. Polling, long-polling, Server-Sent Events (SSE). Client caching strategies.", difficulty: "Medium", revisionCount: 0 }
    ]
  },
  {
    id: `prep-behavioral-${userId}`,
    name: "Behavioral",
    topics: [
      { id: "b1", name: "STAR Method Structure", completed: false, notes: "Situation, Task, Action, Result. Keep results measurable (e.g. 'reduced load time by 40%').", difficulty: "Easy", revisionCount: 2 },
      { id: "b2", name: "Conflict Resolution Stories", completed: false, notes: "Focus on active listening, objective assessment, alignment on goals, and consensus without personal bias.", difficulty: "Medium", revisionCount: 1 }
    ]
  },
  {
    id: `prep-coding-${userId}`,
    name: "Machine Coding",
    topics: [
      { id: "m1", name: "Debounce & Throttle Polyfills", completed: true, notes: "Debounce delays action until quiet period. Throttle enforces periodic action (rate limit). Core implementations require closure & timer handles.", difficulty: "Medium", revisionCount: 6 },
      { id: "m2", name: "Promise Polyfill & Async Utilities", completed: false, notes: "Implement custom Promise constructor with state callbacks. Implement Promise.all / Promise.race.", difficulty: "Hard", revisionCount: 1 }
    ]
  }
];

export const SEED_WISHLIST = (userId: string): WishlistCompany[] => [
  { id: `w-1-${userId}`, name: "Razorpay", careerPage: "https://razorpay.com/jobs", priority: "High", dreamCompany: true, referralAvailable: true, lastAppliedDate: undefined },
  { id: `w-2-${userId}`, name: "Atlassian", careerPage: "https://atlassian.com/careers", priority: "High", dreamCompany: true, referralAvailable: true, lastAppliedDate: "2026-06-25" },
  { id: `w-3-${userId}`, name: "PhonePe", careerPage: "https://phonepe.com/careers", priority: "High", dreamCompany: false, referralAvailable: true, lastAppliedDate: "2026-07-10" },
  { id: `w-4-${userId}`, name: "Zoho", careerPage: "https://zoho.com/careers", priority: "Medium", dreamCompany: false, referralAvailable: false, lastAppliedDate: "2026-07-05" },
  { id: `w-5-${userId}`, name: "Freshworks", careerPage: "https://freshworks.com/careers", priority: "Medium", dreamCompany: false, referralAvailable: true, lastAppliedDate: "2026-07-02" },
  { id: `w-6-${userId}`, name: "Google", careerPage: "https://google.com/careers", priority: "High", dreamCompany: true, referralAvailable: true, lastAppliedDate: "2026-07-08" },
  { id: `w-7-${userId}`, name: "Microsoft", careerPage: "https://microsoft.com/careers", priority: "High", dreamCompany: true, referralAvailable: true, lastAppliedDate: "2026-07-12" },
  { id: `w-8-${userId}`, name: "Amazon", careerPage: "https://amazon.jobs", priority: "High", dreamCompany: false, referralAvailable: false, lastAppliedDate: "2026-06-20" }
];

export const SEED_RESUME_VERSIONS = (userId: string): ResumeVersion[] => [
  { id: `res-1-${userId}`, name: "Frontend Resume", fileUrl: undefined, dateCreated: "2026-06-01", usageCount: 15, successCount: 6 },
  { id: `res-2-${userId}`, name: "Angular Resume", fileUrl: undefined, dateCreated: "2026-06-15", usageCount: 4, successCount: 1 },
  { id: `res-3-${userId}`, name: "React Resume", fileUrl: undefined, dateCreated: "2026-06-10", usageCount: 22, successCount: 11 },
  { id: `res-4-${userId}`, name: "Full Stack Resume", fileUrl: undefined, dateCreated: "2026-06-20", usageCount: 10, successCount: 4 }
];

export const SEED_RESOURCE_BOOKMARKS = (userId: string): ResourceBookmark[] => [
  { id: `res-bm1-${userId}`, title: "Leetcode Top Interview 150", url: "https://leetcode.com/studyplan/top-interview-150", category: "Leetcode" },
  { id: `res-bm2-${userId}`, title: "Frontend Interview Handbook", url: "https://frontendinterviewhandbook.com", category: "Frontend" },
  { id: `res-bm3-${userId}`, title: "React Dev Official Docs", url: "https://react.dev", category: "Articles" },
  { id: `res-bm4-${userId}`, title: "BFE.dev - Big Frontend Dev challenges", url: "https://bfe.dev", category: "Frontend" },
  { id: `res-bm5-${userId}`, title: "Angular Signals Complete Guide - YouTube", url: "https://youtube.com/watch?v=signals-guide", category: "Videos" }
];

export const SEED_USER_NOTES = (userId: string): UserNote[] => [
  {
    id: `note-1-${userId}`,
    title: "STAR Story: Migrated Legacy Dashboard",
    category: "STAR Stories",
    dateUpdated: "2026-07-14",
    content: `# Migrated Legacy React Dashboard to Zustand & Vite

## Situation
The company dashboard was built in 2019 using Redux saga and Webpack. Bundle size was 8.2MB, local dev build took 45s, and state synchronization issues were causing intermittent checkout crashes.

## Task
Migrate the codebase to modern tooling, reduce bundle size by 50%, speed up dev boot under 5s, and implement a lightweight reactive store.

## Action
- Replaced Webpack with **Vite** and configured code-splitting.
- Replaced Redux saga with **Zustand** for global client states and **TanStack Query** for API states.
- Audited bundle size using \`rollup-plugin-visualizer\` and lazy-loaded modules.
- Refactored 12 API calls to queries and cached data, reducing server pressure.

## Result
- Bundle size reduced from **8.2MB to 2.4MB** (70.7% decrease).
- Dev startup time dropped from **45s to 1.8s**.
- Zero crashes in checkout state since migration.
- Core Web Vitals LCP improved by **1.4s**.`
  },
  {
    id: `note-2-${userId}`,
    title: "Typical Recruiter Call Questions & Answers",
    category: "Recruiter Conversations",
    dateUpdated: "2026-07-12",
    content: `# Recruiter Screener Prep

## Tell me about yourself?
"I'm a senior frontend engineer with 5 years of experience building responsive, highly animated, and performance-optimized React and Angular apps. Currently at HabitLabs, I lead UI components architecture, state management design, and build tool setups..."

## Notice Period?
My official notice period is 90 days, but I have negotiated an early release. I can join in **30 days** if we finalize the offer this week.

## Expectations?
Looking for roles that offer high ownership, senior/lead UI responsibilities, and total compensation in the range of ₹45-55 LPA depending on equity and bonuses.`
  }
];
