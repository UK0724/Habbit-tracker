import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthStore } from "../stores/authStore";
import { getRedirectTarget } from "../shared/lib/redirect";

export const RedirectIfAuthed = () => {
  const token = useAuthStore((s) => s.token);
  const location = useLocation();

  if (token) {
    return <Navigate to={getRedirectTarget(location.state)} replace />;
  }

  return <Outlet />;
};
