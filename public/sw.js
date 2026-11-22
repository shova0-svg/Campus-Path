/* Campus Path service worker — offline-first app shell + data cache. */
const CACHE = "campus-path-v2";
const CORE = [
  "/",
  "/auth",
  "/student",
  "/teachers",
  "/right-now",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/brand/campus-path-icon.svg",
  "/rpi-campus-3d.jpg",
];

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(event.data.title || "Campus Path", {
      body: event.data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      data: { url: "/student" },
    });
  }
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch (_) {
    payload = { body: event.data?.text() || "" };
  }
  const title = payload.title || "Campus Path";
  const options = {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag: payload.tag || "campus-path-class",
    data: { url: payload.url || "/student" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/student";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => new URL(c.url).origin === self.location.origin);
      if (existing) return existing.focus().then(() => existing.navigate(url));
      return self.clients.openWindow(url);
    }),
  );
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Cache all at once; ignore individual failures (e.g. a missing route in dev).
      .then((cache) => Promise.allSettled(CORE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))),
        ),
      self.clients.claim(),
    ]),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  // Sign-in redirects must always reach the network.
  if (url.pathname.startsWith("/~oauth")) return;

  if (request.mode === "navigate") {
    // Cache-first for pages so the app opens instantly with data off.
    event.respondWith(
      caches.match(request).then((hit) => {
        if (hit) {
          // Refresh in the background for the next visit.
          void fetch(request)
            .then((res) => {
              if (res.ok) void caches.open(CACHE).then((c) => c.put(request, res.clone()));
            })
            .catch(() => {});
          return hit;
        }
        return fetch(request)
          .then((res) => {
            if (res.ok) void caches.open(CACHE).then((c) => c.put(request, res.clone()));
            return res;
          })
          .catch(() => caches.match("/"));
      }),
    );
    return;
  }

  // Static assets: cache-first, fill cache on first load.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            void caches.open(CACHE).then((cache) => cache.put(request, copy));
          }
          return response;
        }),
    ),
  );
});
