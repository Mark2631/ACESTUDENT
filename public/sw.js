const CACHE_NAME = "ace-student-static-v2";
const PRECACHE = ["/offline.html", "/icon.svg", "/manifest.webmanifest", "/studio"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith("ace-student-") && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return;

  if (request.mode === "navigate") {
    // Studio contains only a public app shell; personal notebooks remain in device storage.
    if (url.pathname === "/studio") {
      event.respondWith(fetch(request).then(async (response) => {
        if (response.ok) { const copy = response.clone(); const cache = await caches.open(CACHE_NAME); await cache.put("/studio", copy); }
        return response;
      }).catch(async () => (await caches.match("/studio")) || (await caches.match("/offline.html"))));
      return;
    }
    event.respondWith(
      fetch(request).catch(async () => {
        const offline = await caches.match("/offline.html");
        return offline || new Response("You are offline. Reconnect and try again.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
    );
    return;
  }

  // Only immutable, hashed Next.js assets are cached. Auth, Supabase data,
  // user uploads, quiz attempts and personalised responses are never cached.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(request).then((cached) => cached || fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }))
    );
  }
});
