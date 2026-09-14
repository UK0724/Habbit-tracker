const fs = require('fs');
const read = p => fs.readFileSync(p,'utf8');
const write = (p,s) => fs.writeFileSync(p,s);
const edit = (p,fn) => write(p,fn(read(p)));
const fields = `  schedule?: "daily" | "weekdays" | "weekly";
  weekdays?: number[];
  timesPerWeek?: number;
  targetMax?: number | null;
  reminderTime?: string;
  ruleHistory?: (Rules & { effectiveDate: string })[];
`;
edit('server/src/modules/habits/habit.model.ts',s => 'import type { Rules } from "./rules.js";\n'+s.replace('["up", "down"]','["up", "down", "range", "record"]').replace('  target?: number;', '  target?: number | null;\n'+fields).replace('    target: {',`    schedule: { type: String, enum: ["daily", "weekdays", "weekly"], default: "daily" },
    weekdays: { type: [Number], default: [1,2,3,4,5] },
    timesPerWeek: { type: Number, default: 3 },
    targetMax: Number,
    reminderTime: String,
    ruleHistory: { type: [Schema.Types.Mixed], default: [] },
    target: {`));
const validation = `  schedule: z.enum(["daily", "weekdays", "weekly"]).optional(),
  weekdays: z.array(z.number().int().min(0).max(6)).min(1).max(7).optional(),
  timesPerWeek: z.number().int().min(1).max(7).optional(),
  targetMax: z.number().finite().nullable().optional(),
  reminderTime: z.string().regex(/^$|^([01]\\d|2[0-3]):[0-5]\\d$/).optional(),
`;
edit('server/src/modules/habits/habit.validation.ts',s => s.replace('  title:',validation+'  title:').replace('.positive("Target must be greater than zero")','.nullable()'));
edit('server/src/modules/habits/habit.service.ts',s => 'import { summarize, rulesAt, type Rules } from "./rules.js";\n'+s.replaceAll('  target?: number;','  target?: number | null;\n'+fields).replace('  id: habit._id.toString(),',`  schedule: habit.schedule ?? "daily",
  weekdays: habit.weekdays ?? [1,2,3,4,5],
  timesPerWeek: habit.timesPerWeek ?? 3,
  targetMax: habit.targetMax,
  reminderTime: habit.reminderTime,
  ruleHistory: habit.ruleHistory,
  id: habit._id.toString(),`).replaceAll('"done" | "not_done" | null','"done" | "not_done" | "skipped" | null').replace('      currentStreak,','      currentStreak: summarize(habit, logs, getTodayDateString(), 30).current,').replace('  habit.title = payload.title ?? habit.title;',`  const merged = { ...habit.toObject(), ...payload };
  if (merged.goalDirection === "range" && (merged.target == null || merged.targetMax == null || merged.targetMax < merged.target)) throw new AppError("Enter an ordered target range", 400);
  const effectiveDate = getTodayDateString();
  const snapshot = (value: Rules) => ({ schedule: value.schedule ?? "daily", weekdays: value.weekdays, timesPerWeek: value.timesPerWeek, goalDirection: value.goalDirection, target: value.target, targetMax: value.targetMax });
  habit.ruleHistory = [...(habit.ruleHistory?.length ? habit.ruleHistory : [{ ...snapshot(habit), effectiveDate: "0001-01-01" }]).filter(r => r.effectiveDate !== effectiveDate), { ...snapshot(merged), effectiveDate }];
  habit.schedule = payload.schedule ?? habit.schedule;
  habit.weekdays = payload.weekdays ?? habit.weekdays;
  habit.timesPerWeek = payload.timesPerWeek ?? habit.timesPerWeek;
  if ("targetMax" in payload) habit.targetMax = payload.targetMax;
  if ("reminderTime" in payload) habit.reminderTime = payload.reminderTime;
  habit.title = payload.title ?? habit.title;`).replace('payload.target ?? habit.target','"target" in payload ? payload.target : habit.target').replace('  const normalizedDescription =',`  if (payload.goalDirection === "range" && (payload.target == null || payload.targetMax == null || payload.targetMax < payload.target)) throw new AppError("Enter an ordered target range", 400);
  const normalizedDescription =`));
edit('server/src/modules/habitLogs/habitLog.model.ts',s=>s.replace('["done", "not_done"]','["done", "not_done", "skipped"]'));
edit('server/src/modules/habitLogs/habitLog.service.ts',s=>s.replace('"done" | "not_done" | null','"done" | "not_done" | "skipped" | null').replace('  if (habit.type === "action") {','  if (nextStatus === "skipped") return { date: nextDate, status: "skipped" as const, value: null, comment: nextComment };\n\n  if (habit.type === "action") {').replace('comment: nextStatus === "done" ? nextComment : undefined','comment: nextComment').replace('comment: undefined','comment: nextComment'));
edit('client/src/shared/types/habit.ts',s=>'import type { Rules } from "../lib/rules";\n'+s.replace('"done" | "not_done";','"done" | "not_done" | "skipped";').replace('"up" | "down";','"up" | "down" | "range" | "record";').replaceAll('  target?: number;','  target?: number | null;\n'+fields));
write('client/src/shared/lib/rules.ts',read('server/src/modules/habits/rules.ts'));
edit('client/src/features/habits/forms/habitFormSchema.ts',s=>s.replace('    title:',validation+'    title:').replace('["up", "down"]','["up", "down", "range", "record"]').replace('.positive("Target must be greater than zero")','.finite().nullable()'));
edit('client/src/features/habits/forms/HabitForm.tsx',s=>'import { Link } from "react-router-dom";\n'+s.replace('      title: defaultValues?.title',`      schedule: defaultValues?.schedule ?? "daily",
      weekdays: defaultValues?.weekdays ?? [1,2,3,4,5],
      timesPerWeek: defaultValues?.timesPerWeek ?? 3,
      targetMax: defaultValues?.targetMax,
      reminderTime: defaultValues?.reminderTime ?? "",
      linkToDSAPrep: defaultValues?.linkToDSAPrep ?? false,
      linkToExpenseTracker: defaultValues?.linkToExpenseTracker ?? false,
      title: defaultValues?.title`).replaceAll('type="button"\n                disabled={typeDisabled}','type="button"\n                aria-pressed={isActive}\n                disabled={typeDisabled}').replace('                    onClick={() =>\n                      setValue("goalDirection"','                    aria-pressed={isActive}\n                    onClick={() =>\n                      setValue("goalDirection"').replace('{ value: "down", label: "Lower is better", hint: "weight, screen time" }','{ value: "down", label: "Lower is better", hint: "screen time" },\n                  { value: "range", label: "Within a range", hint: "minimum to maximum" },\n                  { value: "record", label: "Record only", hint: "every entry counts" }').replace('We&apos;ll show your progress toward this.','Daily target: the saved value must meet this rule. Leave blank to count any recorded value.').replace('        <div className="space-y-3">','        <details className="space-y-3"><summary className="cursor-pointer font-semibold">Optional comments and workspace connections</summary><p className="field-hint">Workspaces are always available. Linking adds a shortcut from this habit; log your check-in once on Today.</p>').replace('        </div>\n      ) : null}\n\n      <div>\n        <label className="field-label" htmlFor="description">','        </details>\n      ) : null}\n\n      <div>\n        <label className="field-label" htmlFor="description">').replaceAll('The switcher and homepage card will only be visible when this habit exists.','Add a convenient shortcut to this workspace.').replace('      {/* Conditional config */}',`      <fieldset className="space-y-3"><legend className="field-label">Schedule</legend>
        <label className="field-label" htmlFor="schedule">Repeat</label><select id="schedule" className="field-input" {...register("schedule")}><option value="daily">Every day</option><option value="weekdays">Selected weekdays</option><option value="weekly">Times per week</option></select>
        {watch("schedule") === "weekdays" && <div className="flex flex-wrap gap-2">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map((day,index)=><button key={day} type="button" className="rounded-xl border border-border-app p-3 aria-pressed:bg-accent aria-pressed:text-white" aria-pressed={watch("weekdays")?.includes(index)} onClick={()=>{const days=watch("weekdays") ?? []; setValue("weekdays",days.includes(index)?days.filter(d=>d!==index):[...days,index],{shouldValidate:true});}}>{day}</button>)}</div>}
        {errors.weekdays && <p role="alert">Choose at least one weekday.</p>}
        {watch("schedule") === "weekly" && <label className="field-label">Days per week<Input type="number" min="1" max="7" {...register("timesPerWeek",{valueAsNumber:true})}/></label>}
        <p className="field-hint">Weeks run Monday–Sunday. One completion per date. Rest days and skipped days pause daily streaks; weekly streaks count completed weeks. Changes apply from today onward.</p>
      </fieldset>
      {selectedGoal === "range" && <label className="field-label">Upper target<Input type="number" step="any" {...register("targetMax",{setValueAs:v=>v===""?null:Number(v)})}/></label>}
      <details><summary className="cursor-pointer font-semibold">Reminder</summary><label className="field-label">Time<Input type="time" {...register("reminderTime")}/></label><p className="field-hint">Enable reminders in Settings. Reminders appear only while Arc is open on this device.</p></details>
      {/* Conditional config */}`).replace('        <Button type="submit"','        <Link to="/habits" className="text-sm font-semibold text-content-2">Cancel</Link>\n        <Button type="submit"').replace('? undefined\n        : Number(value)','? null\n        : Number(value)'));
edit('client/src/pages/EditHabitPage.tsx',s=>s.replace('            title: habitQuery.data.title,','            ...habitQuery.data,\n            title: habitQuery.data.title,'));
