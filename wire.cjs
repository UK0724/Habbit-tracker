const fs=require('fs'); const edit=(p,f)=>fs.writeFileSync(p,f(fs.readFileSync(p,'utf8')));
edit('server/src/modules/habits/tracking.routes.ts',s=>s.replaceAll('JobTrackerProfileModel','JobSearchProfileModel'));
edit('server/src/app.ts',s=>'import { trackingRouter } from "./modules/habits/tracking.routes.js";\n'+s.replace('app.use("/api/auth", authRouter);','app.use("/api/auth", authRouter);\napp.use("/api", trackingRouter);'));
edit('server/src/modules/auth/user.model.ts',s=>s.replace('  email: string;','  timezone?: string;\n  email: string;').replace('    email: {','    timezone: { type: String },\n    email: {'));
edit('client/src/router/index.tsx',s=>'import { TodayPage } from "../pages/TodayPage";\nimport { HabitsPage } from "../pages/HabitsPage";\nimport { InsightsPage } from "../pages/InsightsPage";\n'+s.replace('import { HomePage } from "../pages/HomePage";','').replace('{ index: true, element: <HomePage /> },','{ index: true, element: <TodayPage /> },\n          { path: "habits", element: <HabitsPage /> },\n          { path: "insights", element: <InsightsPage /> },'));
edit('client/src/pages/CreateHabitPage.tsx',s=>'import { templates } from "./TodayPage";\nimport { useSearchParams } from "react-router-dom";\n'+s.replace('  const navigate = useNavigate();','  const navigate = useNavigate();\n  const [params] = useSearchParams();\n  const template = params.has("template") ? templates[Number(params.get("template"))] : undefined;').replace('          submitLabel="Create habit"','          defaultValues={template as Partial<HabitFormValues>}\n          submitLabel="Create habit"').replace('Add a focused action habit or a measurable metric with a clean foundation you can extend later.','Choose a small action or a number you want to track.'));
edit('client/src/shared/lib/date.ts',s=>s.replace('  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;','  const zone = localStorage.getItem("arc-timezone") || Intl.DateTimeFormat().resolvedOptions().timeZone;\n  return new Intl.DateTimeFormat("en-CA", {timeZone:zone,year:"numeric",month:"2-digit",day:"2-digit"}).format(date);'));
edit('client/src/features/habits/components/DailyLogTable.tsx',s=>s.replace('  done: "Done",','  skipped: "Skipped",\n  done: "Done",'));
edit('client/src/app/styles.css',s=>s+`\n/* Shared accessible surfaces */
@layer base {
  body { background-image: none; }
  :root { --text-subtle: 100 116 139; }
  :root[data-theme="dark"] { --text-subtle: 156 163 183; --bg: 14 15 21; --surface: 23 24 33; --surface-2: 29 30 41; --surface-3: 37 38 51; --border: 49 50 65; }
  :focus-visible { outline: 2px solid rgb(var(--accent)); outline-offset: 3px; }
  button, a, input, select, textarea { touch-action: manipulation; }
  @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration: .01ms !important; transition-duration: .01ms !important; scroll-behavior: auto !important; } }
}
@layer components { .field-input { @apply w-full rounded-xl border border-border-app bg-surface px-3 py-2 text-sm text-content; } }
`);
