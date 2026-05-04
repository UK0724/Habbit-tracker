import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { cn } from "../shared/lib/utils";
import { useAuthStore } from "../stores/authStore";

const navLinkClassName = ({ isActive }: { isActive: boolean }) =>
  cn(
    "rounded-full px-4 py-2 text-sm font-semibold transition",
    isActive
      ? "bg-white text-slate-950 shadow-sm"
      : "text-slate-600 hover:text-slate-950"
  );

export const AppLayout = () => {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const handleLogout = () => {
    clearAuth();
    queryClient.clear();
    navigate("/login");
  };

  return (
    <div className="min-h-screen text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 pb-12 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-3 z-20 mb-6 rounded-3xl border border-white/80 bg-white/90 px-4 py-3 shadow-panel backdrop-blur xl:px-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <Link to="/" className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-lg font-extrabold text-white shadow-sm">
                H
              </span>
              <div>
                <p className="font-display text-lg font-bold tracking-tight text-slate-950">
                  Habit Tracker
                </p>
                <p className="text-xs text-slate-500">
                  Daily logging for actions and numbers
                </p>
              </div>
            </Link>

            <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
              <nav className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                <NavLink to="/" end className={navLinkClassName}>
                  Daily Log
                </NavLink>
                <NavLink to="/habits/new" className={navLinkClassName}>
                  New Habit
                </NavLink>
              </nav>

              <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
                <span className="hidden max-w-[140px] truncate text-xs font-medium text-slate-500 sm:block">
                  {user?.email}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="rounded-full px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
                >
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
