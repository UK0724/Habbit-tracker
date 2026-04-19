import { createBrowserRouter } from "react-router-dom";

import { AppLayout } from "../app/AppLayout";
import { CreateHabitPage } from "../pages/CreateHabitPage";
import { EditHabitPage } from "../pages/EditHabitPage";
import { HabitDetailPage } from "../pages/HabitDetailPage";
import { HomePage } from "../pages/HomePage";
import { NotFoundPage } from "../pages/NotFoundPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "habits/new",
        element: <CreateHabitPage />
      },
      {
        path: "habits/:id",
        element: <HabitDetailPage />
      },
      {
        path: "habits/:id/edit",
        element: <EditHabitPage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
