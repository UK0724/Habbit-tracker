import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useHabits } from "../features/habits/hooks/useHabits";
import { useHomeDateStore } from "../features/habits/hooks/useHomeDateStore";
import { useSaveHabitLog } from "../features/logs/hooks/useHabitLogs";
import { apiRequest } from "../services/api";
import { Button } from "../components/ui/Button";
import { getTodayDateString, formatDateLabel } from "../shared/lib/date";
import { completed, dayState, rulesAt } from "../shared/lib/rules";
import type { HabitListItem, HabitLog, SaveHabitLogInput, CreateHabitInput } from "../shared/types/habit";
export const templates: Partial<CreateHabitInput>[] = [
  {title:"Reading",type:"measurable",unit:"pages",target:10}, {title:"Exercise",type:"action"},
  {title:"Water",type:"measurable",unit:"glasses",target:8}, {title:"Job Applications",type:"action",linkToJobTracker:true},
  {title:"DSA Practice",type:"action",linkToDSAPrep:true}, {title:"Expense Logging",type:"action",linkToExpenseTracker:true}
];
const DailyCard = ({habit,date,onSave,busy,saving}:{habit:HabitListItem;date:string;onSave:(h:HabitListItem,input:SaveHabitLogInput)=>Promise<void>;busy:boolean;saving:boolean}) => {
  const [value,setValue]=useState(habit.selectedDateLog?.value?.toString()??"");
  const [note,setNote]=useState(habit.selectedDateLog?.comment??"");
  const [error,setError]=useState("");
  const [notesOpen,setNotesOpen]=useState(false);
  const state=dayState(habit,habit.recentDays,date,getTodayDateString());
  const rule=rulesAt(habit,date);
  const save=async(input:SaveHabitLogInput)=>{setError("");try{await onSave(habit,{...input,comment:note});}catch(e){setError(e instanceof Error?e.message:"Could not save. Try again.");}};
  return <article className="surface-card p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3"><div><Link className="text-base font-semibold hover:text-accent" to={`/habits/${habit.id}`}>{habit.title}</Link><p className="mt-1 text-xs text-content-muted">{rule.schedule==="weekly"?`${rule.timesPerWeek} days per week`:rule.schedule==="weekdays"?"Selected weekdays":"Every day"}{habit.unit?` · ${habit.unit}`:""}</p></div><span className="rounded-full bg-surface-3 px-3 py-1 text-xs font-semibold capitalize">{state}</span></div>
    {habit.type!=="action"&&<p className="mt-3 text-xs text-content-2">{rule.goalDirection==="record"||rule.target==null?"Record any value":rule.goalDirection==="range"?`Daily range: ${rule.target}–${rule.targetMax}`:`Daily target: ${rule.goalDirection==="down"?"at most":"at least"} ${rule.target}`} {habit.unit}</p>}
    <form className="mt-4 flex flex-wrap gap-2" onSubmit={e=>{e.preventDefault();if(habit.type==="action"){void save({date,status:"done"});}else if(value.trim()&&Number.isFinite(Number(value))){void save({date,value:Number(value)});}else setError("Enter a valid number.");}}>
      {habit.type==="action"?<Button type="submit" disabled={busy || (habit.requireCompletionComment&&!note.trim())}>{saving?"Saving…":state==="completed"?"✓ Done":"Mark done"}</Button>:<><label className="sr-only" htmlFor={`value-${habit.id}`}>{habit.title} value in {habit.unit}</label><input id={`value-${habit.id}`} className="field-input min-w-0 flex-1" type="number" step="any" value={value} onChange={e=>setValue(e.target.value)} placeholder="Enter value"/><Button type="submit" disabled={busy}>{saving?"Saving…":"Save"}</Button><button type="button" className="rounded-xl border border-border-app px-3 text-sm" onClick={()=>setValue(String(Number(value||0)+1))}>+1</button></>}
      <Button type="button" variant="ghost" disabled={busy} onClick={()=>void save({date,status:"skipped"})}>Skip</Button>
      <button type="button" className="text-sm text-content-muted" aria-expanded={notesOpen} onClick={()=>setNotesOpen(!notesOpen)}>Note</button>
      {(notesOpen||habit.requireCompletionComment)&&<label className="w-full text-xs text-content-2">{habit.requireCompletionComment?"Completion note (required)":"Optional note"}<textarea maxLength={280} className="field-input mt-1" value={note} onChange={e=>setNote(e.target.value)}/></label>}
    </form>
    {error&&<p role="alert" className="mt-3 text-sm text-rose-500">{error} Your entry is still here; try saving again.</p>}
    <div className="mt-3 flex flex-wrap gap-3 text-xs text-accent">{habit.linkToExpenseTracker&&<Link to="/expenses">Open expenses ↗</Link>}{habit.linkToJobTracker&&<Link to="/job-tracker">Open job search ↗</Link>}{habit.linkToDSAPrep&&<Link to="/dsa-prep">Open DSA prep ↗</Link>}</div>
  </article>;
};
export const TodayPage = () => {
  const {selectedDate,setSelectedDate,shiftSelectedDate,resetSelectedDate}=useHomeDateStore();
  const query=useHabits(selectedDate); const mutation=useSaveHabitLog(); const cache=useQueryClient();
  const lock=useRef(false); const [busy,setBusy]=useState(false); const [message,setMessage]=useState("");
  const [undo,setUndo]=useState<{habitId:string;log:HabitLog;previous:HabitLog|null}|null>(null);
  const habits=query.data??[];
  const done=habits.filter(h=>completed(h,h.selectedDateLog??undefined)).length;
  const save=async(h:HabitListItem,input:SaveHabitLogInput)=>{if(lock.current)return;lock.current=true;setBusy(true);setMessage("");try{const log=await mutation.mutateAsync({habitId:h.id,logId:h.selectedDateLog?.id,input});setUndo({habitId:h.id,log,previous:h.selectedDateLog});setMessage("Saved");}finally{lock.current=false;setBusy(false);}};
  const undoSave=async()=>{if(!undo||lock.current)return;lock.current=true;setBusy(true);try{if(undo.previous)await mutation.mutateAsync({habitId:undo.habitId,logId:undo.log.id,input:{date:undo.previous.date,status:undo.previous.status,value:undo.previous.value,comment:undo.previous.comment??""}});else await apiRequest(`/habits/${undo.habitId}/logs/${undo.log.id}`,{method:"DELETE"});await cache.invalidateQueries();setUndo(null);setMessage("Change undone");}catch(e){setMessage(e instanceof Error?e.message:"Could not undo. Try again.");}finally{lock.current=false;setBusy(false);}};
  if(query.isLoading)return <p role="status">Loading your habits…</p>;
  if(query.isError)return <div role="alert">Could not load habits. <Button onClick={()=>void query.refetch()}>Retry</Button></div>;
  return <div className="space-y-6">
    <header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-widest text-accent">Make room for progress</p><h1 className="mt-2 font-display text-3xl font-bold">{habits.length?"Today":"Welcome to Arc"}</h1><p className="mt-2 text-sm text-content-muted">{habits.length?"A little attention to what matters to you.":"Bring your routines, goals, and everyday life into one place."}</p></div>{habits.length>0&&<Button asChild><Link to="/habits/new">+ New habit</Link></Button>}</header>
    {!habits.length?<section className="surface-card p-6 sm:p-8"><h2 className="text-xl font-semibold">Start with one small habit</h2><p className="mt-2 max-w-lg text-sm leading-6 text-content-2">Choose something you want to make time for. You can adjust it as you go.</p><Button asChild className="mt-5"><Link to="/habits/new">Create your first habit</Link></Button><p className="mb-3 mt-8 text-xs font-semibold uppercase tracking-widest text-content-muted">Or use a starter template</p><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{templates.map((t,i)=><Link key={t.title} to={`/habits/new?template=${i}`} className="flex items-center justify-between rounded-xl border border-border-app p-4 text-sm font-semibold hover:border-accent">{t.title} ↗</Link>)}</div></section>:<><section className="surface-card flex flex-wrap items-center justify-between gap-4 p-4"><div><strong>{done} completed</strong><span className="ml-3 text-sm text-content-muted">of {habits.length} habits</span></div><div className="flex items-center gap-2"><Button variant="ghost" aria-label="Previous date" disabled={busy} onClick={()=>shiftSelectedDate(-1)}>‹</Button><label className="sr-only" htmlFor="log-date">Log date</label><input id="log-date" type="date" max={getTodayDateString()} value={selectedDate} disabled={busy} onChange={e=>e.target.value&&setSelectedDate(e.target.value)} className="rounded-xl border border-border-app bg-surface p-2 text-sm"/><Button variant="ghost" aria-label="Next date" disabled={busy||selectedDate>=getTodayDateString()} onClick={()=>shiftSelectedDate(1)}>›</Button><Button variant="ghost" disabled={busy} onClick={resetSelectedDate}>Today</Button></div></section><p className="text-sm text-content-muted">{formatDateLabel(selectedDate)} · Skipping pauses a streak. Unfinished activities become missed only after their day or week ends.</p><div className="grid gap-4 xl:grid-cols-2">{habits.map(h=><DailyCard key={`${h.id}-${selectedDate}-${h.selectedDateLog?.updatedAt??"new"}`} habit={h} date={selectedDate} onSave={save} busy={busy} saving={mutation.isPending && mutation.variables?.habitId === h.id}/>)}</div></>}
    {message&&<div role="status" className="sticky bottom-4 flex items-center justify-between rounded-xl border border-accent/30 bg-surface p-4 shadow-lg"><span>{message}</span>{undo&&<Button variant="ghost" disabled={busy} onClick={()=>void undoSave()}>Undo</Button>}</div>}
    <section><h2 className="mb-3 text-sm font-semibold text-content-2">Your workspaces</h2><div className="grid gap-3 sm:grid-cols-3">{[["/expenses","Expenses","Know where your money goes"],["/job-tracker","Job Search","Keep your next move organized"],["/dsa-prep","DSA Prep","Practice, reflect, revisit"]].map(([to,title,description])=><Link key={to} to={to!} className="surface-card p-4 hover:border-accent"><p className="font-semibold">{title} ↗</p><p className="mt-1 text-xs text-content-muted">{description}</p></Link>)}</div><p className="mt-3 text-xs text-content-muted">Use every workspace independently. Habit connections are optional.</p></section>
  </div>;
};
