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
          { path: "habits/new", element: <CreateHabitPage /> },
          { path: "habits/:id", element: <HabitDetailPage /> },
          { path: "habits/:id/edit", element: <EditHabitPage /> },
          { path: "*", element: <NotFoundPage /> }
        ]
      }
    ]
  }
]);
