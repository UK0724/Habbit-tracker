import { jsx as _jsx } from "react/jsx-runtime";
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
        element: _jsx(AppLayout, {}),
        children: [
            {
                index: true,
                element: _jsx(HomePage, {})
            },
            {
                path: "habits/new",
                element: _jsx(CreateHabitPage, {})
            },
            {
                path: "habits/:id",
                element: _jsx(HabitDetailPage, {})
            },
            {
                path: "habits/:id/edit",
                element: _jsx(EditHabitPage, {})
            },
            {
                path: "*",
                element: _jsx(NotFoundPage, {})
            }
        ]
    }
]);
