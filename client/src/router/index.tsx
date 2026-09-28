import { lazy, Suspense } from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";
import { RouteErrorPage } from "../components/RouteErrorPage";
import { NewHabitRoute } from "../features/habits/components/NewHabitRoute";

const HabitsPage = lazy(() =>
  import("../pages/HabitsPage").then((module) => ({
    default: module.HabitsPage
  }))
);
const InsightsPage = lazy(() =>
  import("../pages/InsightsPage").then((module) => ({
    default: module.InsightsPage
  }))
);
const AchievementsPage = lazy(() =>
  import("../pages/AchievementsPage").then((module) => ({
    default: module.AchievementsPage
  }))
);
const ProfilePage = lazy(() =>
  import("../pages/ProfilePage").then((module) => ({
    default: module.ProfilePage
  }))
);

const AppLayout = lazy(() =>
  import("../app/AppLayout").then((module) => ({ default: module.AppLayout }))
);
import { RedirectIfAuthed } from "../components/RedirectIfAuthed";
import { RequireAuth } from "../components/RequireAuth";
const EditHabitPage = lazy(() =>
  import("../pages/EditHabitPage").then((module) => ({
    default: module.EditHabitPage
  }))
);
const HabitDetailPage = lazy(() =>
  import("../pages/HabitDetailPage").then((module) => ({
    default: module.HabitDetailPage
  }))
);

const LoginPage = lazy(() =>
  import("../pages/LoginPage").then((module) => ({ default: module.LoginPage }))
);
const NotFoundPage = lazy(() =>
  import("../pages/NotFoundPage").then((module) => ({
    default: module.NotFoundPage
  }))
);
const RegisterPage = lazy(() =>
  import("../pages/RegisterPage").then((module) => ({
    default: module.RegisterPage
  }))
);
const SettingsPage = lazy(() =>
  import("../pages/SettingsPage").then((module) => ({
    default: module.SettingsPage
  }))
);

// Expense Tracker imports
import { ExpenseLayout } from "../features/expenses/components/ExpenseLayout";
const ExpenseDashboardPage = lazy(() =>
  import("../features/expenses/pages/ExpenseDashboardPage").then((module) => ({
    default: module.ExpenseDashboardPage
  }))
);

const PrivacyPage = lazy(() =>
  import("../pages/LegalPages").then((module) => ({ default: module.PrivacyPage }))
);
const DeleteAccountInfoPage = lazy(() =>
  import("../pages/LegalPages").then((module) => ({
    default: module.DeleteAccountInfoPage
  }))
);
const ForgotPasswordPage = lazy(() =>
  import("../pages/ForgotPasswordPage").then((module) => ({
    default: module.ForgotPasswordPage
  }))
);
const ResetPasswordPage = lazy(() =>
  import("../pages/ResetPasswordPage").then((module) => ({
    default: module.ResetPasswordPage
  }))
);

export const router = createBrowserRouter([
  {
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense fallback={<div role="status" className="p-6">Loading…</div>}>
        <Outlet />
      </Suspense>
    ),
    children: [
      { path: "/privacy", element: <PrivacyPage /> },
      { path: "/delete-account", element: <DeleteAccountInfoPage /> },
      { path: "/forgot-password", element: <ForgotPasswordPage /> },
      { path: "/reset-password", element: <ResetPasswordPage /> }
    ]
  },
  {
    errorElement: <RouteErrorPage />,
    element: (
      <Suspense
        fallback={
          <div role="status" className="p-6">
            Loading…
          </div>
        }
      >
        <RedirectIfAuthed />
      </Suspense>
    ),
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/register", element: <RegisterPage /> }
    ]
  },
  {
    element: <RequireAuth />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        path: "/",
        element: (
          <Suspense
            fallback={
              <div role="status" className="p-6 text-content">
                Loading…
              </div>
            }
          >
            <AppLayout />
          </Suspense>
        ),
        children: [
          { index: true, element: <Navigate to="/habits" replace /> },
          { path: "habits", element: <HabitsPage /> },
          { path: "insights", element: <InsightsPage /> },
          { path: "achievements", element: <AchievementsPage /> },
          { path: "profile", element: <ProfilePage /> },
          { path: "settings", element: <SettingsPage /> },
          { path: "habits/new", element: <NewHabitRoute /> },
          { path: "habits/:id", element: <HabitDetailPage /> },
          { path: "habits/:id/edit", element: <EditHabitPage /> },
          // Nested Expense Tracker Routes
          {
            path: "expenses",
            element: <ExpenseLayout />,
            children: [{ index: true, element: <ExpenseDashboardPage /> }]
          },
          { path: "*", element: <NotFoundPage /> }
        ]
      }
    ]
  }
]);
