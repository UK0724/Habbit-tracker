import { ReminderWatcher } from "../components/ReminderWatcher";
import { useEffect, useState } from "react";
import { NavLink, Outlet, Link } from "react-router-dom";
import { CalendarDays, CheckSquare, ChartNoAxesCombined, Wallet, BriefcaseBusiness, CodeXml, Settings, Menu, X } from "lucide-react";
import { BrandMark } from "../components/brand/BrandMark";
import { useAuthStore } from "../stores/authStore";
import { apiRequest } from "../services/api";
const items = [["/", "Today", CalendarDays], ["/habits", "Habits", CheckSquare], ["/insights", "Insights", ChartNoAxesCombined], ["/expenses", "Expenses", Wallet], ["/job-tracker", "Job Search", BriefcaseBusiness], ["/dsa-prep", "DSA Prep", CodeXml], ["/settings", "Settings", Settings]] as const;
export const AppLayout = () => {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const user = useAuthStore(s => s.user);
  useEffect(() => { apiRequest<{timezone:string}>("/preferences").then(p=>{localStorage.setItem("arc-timezone",p.timezone);setReady(true);}).catch(()=>setReady(true)); }, []);
  return <div className="min-h-screen text-content">
    <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-surface focus:p-4">Skip to content</a>
    <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border-app bg-surface px-4 py-3 lg:hidden"><Link to="/" className="flex items-center gap-2 font-display text-xl font-bold"><BrandMark className="h-8 w-8"/>Arc.</Link><button aria-label={open?"Close navigation":"Open navigation"} aria-expanded={open} aria-controls="primary-navigation" onClick={()=>setOpen(!open)} className="rounded-xl p-2">{open?<X/>:<Menu/>}</button></header>
    <aside className={`${open?"block":"hidden"} fixed inset-x-0 top-[65px] z-30 border-b border-border-app bg-surface p-4 lg:inset-y-0 lg:left-0 lg:right-auto lg:block lg:w-56 lg:border-b-0 lg:border-r lg:p-6`}>
      <Link to="/" className="mb-10 hidden items-center gap-3 font-display text-2xl font-bold lg:flex"><BrandMark className="h-9 w-9"/>Arc<span className="text-accent">.</span></Link>
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-content-muted">Your everyday space</p>
      <nav id="primary-navigation" aria-label="Main navigation" className="grid grid-cols-2 gap-1 lg:grid-cols-1">{items.map(([to,label,Icon])=><NavLink key={to} to={to} end={to==="/"} onClick={()=>setOpen(false)} className={({isActive})=>`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${isActive?"bg-accent/15 text-accent":"text-content-2 hover:bg-surface-2"}`}><Icon size={19}/>{label}</NavLink>)}</nav>
      <div className="mt-8 border-t border-border-app pt-4"><p className="truncate text-xs text-content-muted">{user?.email}</p><p className="mt-2 text-xs text-content-muted">Small steps. A fuller picture.</p></div>
    </aside>
    <main id="main" tabIndex={-1} className="min-w-0 px-4 py-6 sm:px-6 lg:ml-56 lg:px-8 lg:py-8"><div className="mx-auto max-w-6xl">{ready?<><ReminderWatcher/><Outlet/></>:<p role="status">Getting your workspace ready…</p>}</div></main>
  </div>;
};

