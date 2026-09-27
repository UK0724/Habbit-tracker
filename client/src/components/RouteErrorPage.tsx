import { isRouteErrorResponse, useRouteError } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

/** Kept in the entry bundle so a missing lazy chunk cannot break recovery. */
export const RouteErrorPage = () => {
  const error = useRouteError();
  const [reloading, setReloading] = useState(false);
  const message = error instanceof Error ? error.message : "";
  const isAssetError = /dynamically imported|module script|MIME type|loading chunk|importing a module|preload/i.test(message);
  const offline = !navigator.onLine;
  const notFound = isRouteErrorResponse(error) && error.status === 404;
  const reload = async () => {
    setReloading(true);
    if (isAssetError) {
      // WebKit can reuse a failed module response even across a normal reload.
      // Replace only the failed app asset and HTML cache entries, never auth data.
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 5000);
      try {
        const urls = (message.match(/https?:\/\/[^\s"'<>]+/g) ?? []).map((value) => new URL(value));
        const failed = urls.find((url) => url.origin === location.origin && url.pathname.startsWith("/assets/"));
        if (failed && "caches" in window) {
          try {
            await Promise.all((await caches.keys()).filter((name) => name.startsWith("pulse-shell-")).map(async (name) => {
              await (await caches.open(name)).delete(failed.href);
            }));
          } catch { /* Cache storage may be unavailable in private browsing. */ }
        }
        await Promise.allSettled([location.href, ...(failed ? [failed.href] : [])].map((url) =>
          fetch(url, { cache: "reload", signal: controller.signal }).then((response) => response.arrayBuffer())
        ));
      } catch { /* Reload remains available if the connection is unavailable. */ }
      finally { window.clearTimeout(timeout); }
    }
    window.location.reload();
  };
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-surface p-6 text-content">
      <section className="w-full max-w-md space-y-4" aria-labelledby="recovery-title">
        <p className="text-sm font-semibold text-accent">Pulse</p>
        <h1 id="recovery-title" className="text-2xl font-bold">
          {offline ? "You’re offline" : isAssetError ? "Refresh to continue" : notFound ? "Page not found" : "This page couldn’t load"}
        </h1>
        <p className="text-sm leading-relaxed text-content-2">
          {offline ? "Check your connection, then try again." : isAssetError
            ? "Pulse may have been updated while this page was open. Reload to get the latest version."
            : "Try reloading this page, or return to your habits."}
        </p>
        <p className="text-xs text-content-muted">Your saved data is safe. Reloading may clear unsaved changes.</p>
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={reloading} onClick={() => void reload()}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-semibold text-accent-fg">
            <RefreshCw size={16} aria-hidden /> {reloading ? "Reloading…" : "Reload page"}
          </button>
          <a href="/" className="inline-flex min-h-11 items-center rounded-xl border border-border-app px-4 font-semibold">Go to habits</a>
        </div>
      </section>
    </main>
  );
};
