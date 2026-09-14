import { Link } from "react-router-dom";
import { useHabits } from "../features/habits/hooks/useHabits";
import { ArchivedHabits } from "../features/habits/components/ArchivedHabits";
import { Button } from "../components/ui/Button";
import { getTodayDateString } from "../shared/lib/date";
export const HabitsPage = () => {
  const query=useHabits(getTodayDateString());
  return <div className="space-y-6"><header className="flex items-center justify-between"><h1 className="text-3xl font-bold">Habits</h1><Button asChild><Link to="/habits/new">New habit</Link></Button></header><p className="text-sm text-content-muted">Routines that fit your life. Edit or archive a habit while keeping its history.</p>{query.isLoading&&<p role="status">Loading habits…</p>}{query.isError&&<Button onClick={()=>void query.refetch()}>Could not load. Retry</Button>}<div className="grid gap-3 sm:grid-cols-2">{query.data?.map(h=><Link key={h.id} to={`/habits/${h.id}`} className="surface-card p-5"><h2 className="font-semibold">{h.title}</h2><p className="mt-2 text-sm text-content-muted">{h.description||`${h.type === "action"?"Action":"Measurable"} · ${h.schedule??"daily"}`}</p><span className="mt-3 block text-sm text-accent">View history and edit ↗</span></Link>)}</div>{query.data?.length===0&&<p>No active habits yet. Create one to start tracking.</p>}<details><summary className="cursor-pointer font-semibold">Archived habits</summary><ArchivedHabits/></details></div>;
};
