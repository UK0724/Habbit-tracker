import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../app/AppLayout";
import { RedirectIfAuthed } from "../components/RedirectIfAuthed";
import { RequireAuth } from "../components/RequireAuth";
import { CreateHabitPage } from "../pages/CreateHabitPage";
import { EditHabitPage } from "../pages/EditHabitPage";
import { HabitDetailPage } from "../pages/HabitDetailPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage } from "../pages/LoginPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { RegisterPage } from "../pages/RegisterPage";
import { SettingsPage } from "../pages/SettingsPage";

// Job Tracker imports
import { JobTrackerLayout } from "../features/job-tracker/components/JobTrackerLayout";
import { DashboardPage } from "../features/job-tracker/pages/DashboardPage";
import { ApplicationsPage } from "../features/job-tracker/pages/ApplicationsPage";
import { ReferralsPage } from "../features/job-tracker/pages/ReferralsPage";
import { PlannerPage } from "../features/job-tracker/pages/PlannerPage";
import { InterviewPrepPage } from "../features/job-tracker/pages/InterviewPrepPage";
import { WishlistPage } from "../features/job-tracker/pages/WishlistPage";
import { NotesPage } from "../features/job-tracker/pages/NotesPage";
import { ResumesPage } from "../features/job-tracker/pages/ResumesPage";
import { CalendarPage } from "../features/job-tracker/pages/CalendarPage";
import { ResourcesPage } from "../features/job-tracker/pages/ResourcesPage";
import { AnalyticsPage } from "../features/job-tracker/pages/AnalyticsPage";

export const router = createBrowserRouter([
  {
    element: <RedirectIfAuthed />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> }
    ]
  },
  {
    element: <RequireAuth />,
    children: [
      {
        path: "/",
        element: <AppLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "habits/new", element: <CreateHabitPage /> },
          { path: "habits/:id", element: <HabitDetailPage /> },
          { path: "habits/:id/edit", element: <EditHabitPage /> },
          // Nested Job Tracker Routes
          {
            path: "job-tracker",
            element: <JobTrackerLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: "applications", element: <ApplicationsPage /> },
              { path: "referrals", element: <ReferralsPage /> },
              { path: "planner", element: <PlannerPage /> },
              { path: "prep", element: <InterviewPrepPage /> },
              { path: "wishlist", element: <WishlistPage /> },
              { path: "notes", element: <NotesPage /> },
              { path: "resumes", element: <ResumesPage /> },
              { path: "calendar", element: <CalendarPage /> },
              { path: "resources", element: <ResourcesPage /> },
              { path: "analytics", element: <AnalyticsPage /> }
            ]
          },
          { path: "*", element: <NotFoundPage /> }
        ]
      }
    ]
  }
]);

