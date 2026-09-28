type FromState = { from?: { pathname?: string; search?: string; hash?: string } };

const PUBLIC_AUTH_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

/** Where to go after signing in: the page that sent the user to /login. */
export const getRedirectTarget = (state: unknown, fallback = "/habits") => {
  const from = (state as FromState | null)?.from;
  const pathname = from?.pathname;
  if (!pathname || !pathname.startsWith("/") || pathname.startsWith("//")) {
    return fallback;
  }
  if (PUBLIC_AUTH_PATHS.includes(pathname)) return fallback;
  return `${pathname}${from?.search ?? ""}${from?.hash ?? ""}`;
};
