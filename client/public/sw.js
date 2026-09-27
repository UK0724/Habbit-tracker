// Pulse service worker — offline app shell only. API/auth requests always hit
// the network so your data is never served stale.
const CACHE = "pulse-shell-v3";
const APP_SHELL = ["/", "/index.html", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key.startsWith("pulse-shell-") && key !== CACHE).map((key) => caches.delete(key)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.pathname === "/api" || url.pathname.startsWith("/api/") || request.headers.has("Authorization")) {
    return;
  }

  // Leave cross-origin requests (e.g. the API on Render, Google Fonts) alone.
  if (url.origin !== self.location.origin) {
    return;
  }

  // SPA navigations: try the network, fall back to the cached shell offline.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).then(async (response) => {
        if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
          const cache = await caches.open(CACHE);
          await cache.put("/index.html", response.clone()).catch(() => undefined);
        }
        return response;
      }).catch(async () => (await caches.match("/index.html")) || Response.error())
    );
    return;
  }

  // Only cache real static resources, never downloads or HTML returned for a
  // missing JavaScript chunk by an SPA host's catch-all redirect.
  const expectedType = {
    script: /(?:java|ecma)script/i,
    style: /text\/css/i,
    image: /image\//i,
    font: /font\/|application\/(?:font|octet-stream)/i,
    manifest: /json/i
  }[request.destination];
  if (!expectedType) return;
  const valid = (response) => response?.ok && expectedType.test(response.headers.get("content-type") || "");
  event.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      if (valid(cached)) return cached;
      if (cached) await cache.delete(request);
      try {
        const response = await fetch(request);
        if (!valid(response)) return Response.error();
        await cache.put(request, response.clone()).catch(() => undefined);
        return response;
      } catch { return Response.error(); }
    })
  );
});

// ─── Push Notifications ────────────────────────────────────────────────────────

self.addEventListener("push", (event) => {
  let data = {
    title: "Pulse Habit Tracker",
    body: "Time to check in and keep your streak alive! 🔥",
    url: "/"
  };

  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || "/icon.svg",
    badge: data.badge || "/icon.svg",
    tag: data.tag || "pulse-notification",
    data: {
      url: data.url || "/"
    }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            if ("navigate" in client) {
              client.navigate(targetUrl);
            }
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});
