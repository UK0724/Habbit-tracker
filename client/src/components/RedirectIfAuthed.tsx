import { Navigate, Outlet } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";

export const RedirectIfAuthed = () => {
  const token = useAuthStore((s) => s.token);

  if (token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
