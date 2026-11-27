/* Campus Path service worker — offline-first app shell + data cache. */
const CACHE = "campus-path-v15";
const CORE = [
  "/",
  "/auth",
  "/student",
  "/teachers",
  "/cr",
  "/updates",
  "/settings",
  "/right-now",
  "/shop",
  "/shop/new",
  "/shop/wishlist",
  "/shop/requests",
  "/shop/inbox",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-maskable-192.png",
  "/brand/campus-path-icon.svg",
  "/rpi-campus-3d.jpg",
];

function notificationOptions(payload) {
  const urgent = payload.urgent === true;
  const tag = payload.tag || payload.id || `campus-path-${Date.now()}`;
  return {
    body: payload.body || "",
    icon: "/icons/icon-192.png",
    badge: "/icons/icon-192.png",
    tag,
    renotify: payload.renotify === true && Boolean(payload.tag),
    requireInteraction: urgent,
    vibrate: urgent ? [250, 120, 250, 120, 250] : [120, 60, 120],
    data: {
      url: payload.url || "/student",
      id: payload.id || "",
      type: payload.type || "",
      receivedAt: Date.now(),
    },
  };
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "SHOW_NOTIFICATION") {
    self.registration.showNotification(
      event.data.title || "Campus Path",
      notificationOptions(event.data),
    );
  }
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
  if (event.data?.type === "CLEAR_CACHE") {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
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
  // Tell open tabs so they can play the custom sound (background sound can't be changed).
  const broadcast = self.clients
    .matchAll({ type: "window", includeUncontrolled: true })
    .then((clients) => {
      for (const client of clients) client.postMessage({ type: "PUSH_RECEIVED", payload });
    })
    .catch(() => {});
  event.waitUntil(
    Promise.all([
      broadcast,
      self.registration.showNotification(title, notificationOptions(payload)),
    ]),
  );
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
  // Live notice fetches must never be served from the offline cache.
  if (url.pathname.startsWith("/api/")) return;

  const cacheOk = (res) => {
    if (res && res.ok && res.type === "basic") {
      const copy = res.clone();
      void caches.open(CACHE).then((c) => c.put(request, copy));
    }
    return res;
  };

  if (request.mode === "navigate") {
    // Network-first: a new deploy must never be hidden by an old cached shell.
    event.respondWith(
      fetch(request)
        .then(cacheOk)
        .catch(() => caches.match(request).then((hit) => hit || caches.match("/"))),
    );
    return;
  }

  // Static assets: stale-while-revalidate, but only cache successful responses.
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ||
        fetch(request)
          .then(cacheOk)
          .catch(() => Response.error()),
    ),
  );
});
