import { Link, NavLink, Outlet } from "react-router-dom";

import { cn } from "../shared/lib/utils";

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-slate-900 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
  );

export const AppLayout = () => (
  <div className="min-h-screen bg-slate-100 text-slate-900">
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-[28px] border border-slate-200 bg-white px-4 py-4 shadow-sm xl:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center justify-between gap-3">
            <Link to="/" className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-lg font-extrabold text-white">
                H
              </span>
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-slate-950">
                  Habit Tracker
                </p>
                <p className="text-sm text-slate-500">
                  Simple daily logging for actions and numbers
                </p>
              </div>
            </Link>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <NavLink to="/" end className={navLinkClassName}>
              Daily Log
            </NavLink>
            <NavLink to="/habits/new" className={navLinkClassName}>
              New Habit
            </NavLink>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  </div>
);
