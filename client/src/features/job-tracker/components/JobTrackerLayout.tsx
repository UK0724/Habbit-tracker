import { useEffect, useState, useRef } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../../stores/authStore";
import { useJobTrackerStore } from "../stores/jobTrackerStore";
import { useHabits } from "../../habits/hooks/useHabits";
import {
  LayoutDashboard,
  Briefcase,
  Users,
  CheckSquare,
  BookOpen,
  Building2,
  FileText,
  FileSpreadsheet,
  Calendar,
  Compass,
  BarChart3,
  Search,
  Bell,
  Sparkles,
  Command,
  HelpCircle,
  Menu,
  X,
  Keyboard,
  ArrowLeft
} from "lucide-react";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const JobTrackerLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  
  const loadAllData = useJobTrackerStore((s) => s.loadAllData);
  const clearAllData = useJobTrackerStore((s) => s.clearAllData);
  const referrals = useJobTrackerStore((s) => s.referrals);
  const applications = useJobTrackerStore((s) => s.applications);
  const saveError = useJobTrackerStore((s) => s.saveError);

  const todayStr = new Date().toISOString().split("T")[0] || "";
  const { data: habits } = useHabits(todayStr);
  const linkedHabit = habits?.find((h) => h.linkToJobTracker);
  const activeStreak = linkedHabit
    ? linkedHabit.stats.type === "action"
      ? linkedHabit.stats.currentStreak
      : 0
    : 0;

  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const paletteRef = useRef<HTMLDivElement>(null);
  const paletteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, user]);

  const menuItems: SidebarItem[] = [
    { name: "Back to Habits", path: "/", icon: ArrowLeft },
    { name: "Dashboard", path: "/job-tracker", icon: LayoutDashboard },
    { name: "Applications", path: "/job-tracker/applications", icon: Briefcase },
    { name: "Referrals", path: "/job-tracker/referrals", icon: Users },
    { name: "Daily Planner", path: "/job-tracker/planner", icon: CheckSquare },
    { name: "Interview Prep", path: "/job-tracker/prep", icon: BookOpen },
    { name: "Company Wishlist", path: "/job-tracker/wishlist", icon: Building2 },
    { name: "Notes & STAR", path: "/job-tracker/notes", icon: FileText },
    { name: "Resumes", path: "/job-tracker/resumes", icon: FileSpreadsheet },
    { name: "Calendar", path: "/job-tracker/calendar", icon: Calendar },
    { name: "Resources", path: "/job-tracker/resources", icon: Compass },
    { name: "Analytics", path: "/job-tracker/analytics", icon: BarChart3 }
  ];

  // Automated warnings / Notifications
  const alerts: string[] = [];
  referrals.forEach(ref => {
    if (!ref.replied && ref.followUpDate <= todayStr) {
      alerts.push(`Follow up with ${ref.personName} at ${ref.company}`);
    }
  });
  applications.forEach(app => {
    if (app.status === "Interview 1" || app.status === "Interview 2" || app.status === "Final Round") {
      alerts.push(`Prep for upcoming interview with ${app.company}`);
    }
  });

  // Hotkey hooks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+K or Cmd+K toggles palette
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((prev) => !prev);
      }
      
      // Escape closes overlays
      if (e.key === "Escape") {
        setPaletteOpen(false);
        setShortcutsOpen(false);
      }

      // Quick Nav commands when not typing in form fields
      const activeEl = document.activeElement?.tagName;
      if (activeEl !== "INPUT" && activeEl !== "TEXTAREA" && !paletteOpen) {
        if (e.key === "?") {
          e.preventDefault();
          setShortcutsOpen((prev) => !prev);
        }
        
        // Command sequence: g + key
        // We use a small sequence window or check key combinations
        // Since we are standard, let's capture single key options or basic combos
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [paletteOpen]);

  // Command palette search options
  const paletteCommands = [
    { category: "Navigation", label: "Go to Dashboard", action: () => navigate("/job-tracker") },
    { category: "Navigation", label: "Go to Applications (Kanban/List)", action: () => navigate("/job-tracker/applications") },
    { category: "Navigation", label: "Go to Referral Tracker", action: () => navigate("/job-tracker/referrals") },
    { category: "Navigation", label: "Go to Daily Planner", action: () => navigate("/job-tracker/planner") },
    { category: "Navigation", label: "Go to Interview Prep checklist", action: () => navigate("/job-tracker/prep") },
    { category: "Navigation", label: "Go to Wishlist Companies", action: () => navigate("/job-tracker/wishlist") },
    { category: "Navigation", label: "Go to Notes & STAR stories", action: () => navigate("/job-tracker/notes") },
    { category: "Navigation", label: "Go to Resume Versions", action: () => navigate("/job-tracker/resumes") },
    { category: "Navigation", label: "Go to Calendar Grid", action: () => navigate("/job-tracker/calendar") },
    { category: "Navigation", label: "Go to Resources Bookmarks", action: () => navigate("/job-tracker/resources") },
    { category: "Navigation", label: "Go to Analytics & Funnels", action: () => navigate("/job-tracker/analytics") },
    { category: "Quick Actions", label: "Add New Job Application", action: () => navigate("/job-tracker/applications?action=new") },
    { category: "Quick Actions", label: "Add New Referral", action: () => navigate("/job-tracker/referrals?action=new") },
    { category: "Quick Actions", label: "Write a New Markdown Note", action: () => navigate("/job-tracker/notes?action=new") },
    { category: "System Actions", label: "Reset All Tracker Data (Start Fresh)", action: () => {
        if (confirm("Are you sure you want to delete all job search applications, referrals, wishlist items, notes, resumes, and start fresh? This action is permanent.")) {
          clearAllData();
        }
      }
    },
    { category: "General", label: "View Keyboard Shortcuts", action: () => setShortcutsOpen(true) }
  ];

  const filteredCommands = paletteCommands.filter((cmd) =>
    cmd.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cmd.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    if (paletteOpen) {
      setSearchTerm("");
      setSelectedIndex(0);
      setTimeout(() => paletteInputRef.current?.focus(), 50);
    }
  }, [paletteOpen]);

  const handlePaletteKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filteredCommands.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        setPaletteOpen(false);
      }
    }
  };

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12
      ? "Good Morning"
      : currentHour < 17
      ? "Good Afternoon"
      : "Good Evening";
  const nameLabel = user?.email?.split("@")[0] || "Uday";
  const capitalizedName = nameLabel.charAt(0).toUpperCase() + nameLabel.slice(1);

  return (
    <div className="relative flex min-h-[calc(100vh-80px)] flex-col gap-6 lg:flex-row">
      {/* Shortcuts modal */}
      {shortcutsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md border border-border-app bg-surface p-6 shadow-panel rounded-2xl animate-pop-in">
            <div className="flex items-center justify-between border-b border-border-app pb-3">
              <h3 className="font-display text-lg font-bold flex items-center gap-2">
                <Keyboard className="h-5 w-5 text-accent" />
                Keyboard Shortcuts
              </h3>
              <button
                onClick={() => setShortcutsOpen(false)}
                className="rounded-lg p-1.5 hover:bg-surface-3 transition text-content-muted hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div className="flex justify-between text-sm py-1.5 border-b border-border-app/40">
                <span className="text-content-2">Open Command Palette</span>
                <kbd className="rounded bg-surface-3 px-2 py-0.5 text-xs font-semibold border border-border-app shadow-sm">Ctrl + K</kbd>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b border-border-app/40">
                <span className="text-content-2">View Shortcuts</span>
                <kbd className="rounded bg-surface-3 px-2 py-0.5 text-xs font-semibold border border-border-app shadow-sm">?</kbd>
              </div>
              <div className="flex justify-between text-sm py-1.5 border-b border-border-app/40">
                <span className="text-content-2">Close Modal / Palette</span>
                <kbd className="rounded bg-surface-3 px-2 py-0.5 text-xs font-semibold border border-border-app shadow-sm">Esc</kbd>
              </div>
            </div>
            <div className="mt-6 text-center text-xs text-content-muted">
              Press <kbd className="rounded bg-surface-3 px-1.5 py-0.5 border">Ctrl+K</kbd> to execute actions directly.
            </div>
          </div>
        </div>
      )}

      {/* Command Palette Modal */}
      {paletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-4 pt-[15vh] backdrop-blur-sm">
          <div
            ref={paletteRef}
            className="w-full max-w-lg overflow-hidden border border-border-app bg-surface shadow-2xl rounded-2xl animate-pop-in flex flex-col max-h-[60vh]"
          >
            <div className="flex items-center gap-3 border-b border-border-app px-4 py-3.5">
              <Search className="h-5 w-5 text-content-muted" />
              <input
                ref={paletteInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={palettePaletteKeyDown => handlePaletteKeyDown(palettePaletteKeyDown)}
                placeholder="Search command palette..."
                className="w-full bg-transparent text-content placeholder-content-muted outline-none text-base"
              />
              <span className="rounded bg-surface-3 border border-border-app px-1.5 py-0.5 text-[10px] font-semibold text-content-muted">ESC</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
              {filteredCommands.length > 0 ? (
                <div>
                  {/* Group items by category */}
                  {Array.from(new Set(filteredCommands.map(c => c.category))).map(cat => (
                    <div key={cat}>
                      <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-accent/90 mt-2 first:mt-0">
                        {cat}
                      </div>
                      {filteredCommands
                        .filter(c => c.category === cat)
                        .map((cmd) => {
                          const globalIdx = filteredCommands.indexOf(cmd);
                          return (
                            <button
                              key={cmd.label}
                              onClick={() => {
                                cmd.action();
                                setPaletteOpen(false);
                              }}
                              className={`flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                                globalIdx === selectedIndex
                                  ? "bg-accent text-accent-fg shadow-sm"
                                  : "text-content-2 hover:bg-surface-2 hover:text-content"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <Command className="h-4 w-4 opacity-75" />
                                {cmd.label}
                              </span>
                              {globalIdx === selectedIndex && (
                                <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded font-mono">Enter</span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-content-muted">
                  No matching commands found.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {saveError && (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-600 shadow-lg">
          Changes could not be saved: {saveError}
        </div>
      )}

      {/* Desktop Sidebar Navigation */}
      <aside className="hidden w-64 shrink-0 flex-col gap-4 lg:flex">
        <div className="surface-card flex flex-col gap-1 p-3">
          <div className="px-3 py-3 border-b border-border-app/50 mb-2">
            <p className="text-[11px] font-bold uppercase tracking-widest text-accent flex items-center gap-1">
              <Sparkles className="h-3 w-3 animate-soft-bounce" />
              Job Switch Tracker
            </p>
            <p className="text-sm font-bold text-content mt-1.5 truncate">
              {greeting}, {capitalizedName} 👋
            </p>
            <div className="mt-3 flex items-center justify-between rounded-xl bg-surface-2 p-2.5 border border-border-app/40">
              <span className="text-xs text-content-muted font-semibold">Streak</span>
              <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
                🔥 {activeStreak} Days
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {menuItems.map((item) => {
              const active = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    active
                      ? "bg-accent text-accent-fg shadow-sm"
                      : "text-content-2 hover:bg-surface-3 hover:text-content"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Info panel */}
        <div className="surface-card p-4 text-xs text-content-muted space-y-3">
          <div className="flex items-center justify-between text-content font-semibold border-b border-border-app/40 pb-2">
            <span className="flex items-center gap-1.5"><HelpCircle className="h-3.5 w-3.5 text-accent" /> Info &amp; Help</span>
            <button
              onClick={() => setShortcutsOpen(true)}
              className="text-[10px] text-accent hover:underline flex items-center gap-0.5"
            >
              <Keyboard className="h-3 w-3" /> Hotkeys
            </button>
          </div>
          <p className="leading-relaxed">
            Data is securely saved in your browser's local cache per account.
          </p>
          <div className="rounded-lg bg-surface-2 p-2 text-[10px] leading-relaxed border border-border-app/40 text-content-2">
            Use <kbd className="rounded border bg-surface-3 px-1 text-[9px] font-mono">Ctrl+K</kbd> to search options or navigation commands anywhere.
          </div>
        </div>
      </aside>

      {/* Mobile Top Navigation */}
      <div className="flex items-center justify-between rounded-2xl border border-border-app bg-surface p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span className="text-lg font-extrabold text-content flex items-center gap-1.5">
            <Sparkles className="h-5 w-5 text-accent animate-soft-bounce" />
            Switch
          </span>
          <span className="rounded bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-600 ring-1 ring-amber-500/30">
            🔥 {activeStreak}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPaletteOpen(true)}
            aria-label="Open command palette"
            className="rounded-xl border border-border-app bg-surface-2 p-2 text-content-2 hover:bg-surface-3"
          >
            <Command className="h-5 w-5" />
          </button>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-expanded={mobileOpen}
            aria-label="Toggle menu"
            className="rounded-xl border border-border-app bg-surface-2 p-2 text-content-2 hover:bg-surface-3"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 pt-20 backdrop-blur-sm lg:hidden">
          <div className="surface-card mx-4 flex flex-col gap-1 p-3 animate-pop-in">
            <div className="border-b border-border-app/50 pb-3 mb-2 px-3 flex justify-between items-center">
              <div>
                <p className="text-xs font-bold text-accent">Job Search Tracker</p>
                <p className="text-sm font-bold mt-0.5">Welcome, {capitalizedName}!</p>
              </div>
              <button
                onClick={() => setShortcutsOpen(true)}
                className="text-xs text-accent hover:underline flex items-center gap-1"
              >
                <Keyboard className="h-3.5 w-3.5" /> Shortcuts
              </button>
            </div>
            <nav className="space-y-0.5 max-h-[60vh] overflow-y-auto">
              {menuItems.map((item) => {
                const active = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                      active
                        ? "bg-accent text-accent-fg"
                        : "text-content-2 hover:bg-surface-3"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <button
              onClick={() => {
                setMobileOpen(false);
                setPaletteOpen(true);
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-surface-2 border border-border-app py-2.5 text-sm font-bold text-content-2 hover:bg-surface-3 hover:text-content"
            >
              <Search className="h-4 w-4" />
              Command Palette (Ctrl+K)
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 space-y-6 min-w-0">
        {/* Notifications and warning banner if any */}
        {alerts.length > 0 && (
          <div className="surface-card bg-accent/5 border-l-4 border-l-accent p-4 animate-fade-in flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="flex items-start gap-2.5">
              <Bell className="h-5 w-5 text-accent shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-sm font-bold text-content">Active Follow-ups & Reminders</p>
                <div className="mt-1 space-y-0.5 text-xs text-content-2">
                  {alerts.slice(0, 2).map((a, idx) => <p key={idx}>• {a}</p>)}
                  {alerts.length > 2 && <p>• And {alerts.length - 2} other reminders...</p>}
                </div>
              </div>
            </div>
            <button
              onClick={() => navigate("/job-tracker/referrals")}
              className="text-xs font-bold text-accent hover:underline shrink-0"
            >
              Resolve Reminders &rarr;
            </button>
          </div>
        )}

        {/* Dynamic Nested Routes */}
        <Outlet />
      </main>
    </div>
  );
};
