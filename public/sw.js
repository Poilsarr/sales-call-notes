/**
 * Gauge service worker.
 *
 * Strategy: precache the app shell so the install button shows up
 * in Chrome (requires SW + manifest + start_url responds 200).
 * Network-first for navigation requests so updates roll out
 * without forcing the user to clear cache.
 *
 * Scope: public assets only. We do NOT cache /api/* responses —
 * those are auth-gated and freshness matters more than speed.
 *
 * Versioning: bump VERSION on every deploy that changes cached
 * shell contents. The cache name embeds the version, so the
 * activate handler nukes any old `gauge-shell-*` and
 * `callnotepro-shell-*` caches automatically. Bumping from v1
 * to v2 was required after the CallNote Pro → Gauge rebrand
 * to force users whose browsers were still controlling with
 * the old service worker to pick up the new code on next load.
 */

const VERSION = "v2";
const CACHE = `gauge-shell-${VERSION}`;
const SHELL = [
  "/",
  "/offline",
  "/manifest.json",
  "/icon-192.png",
  "/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET, cross-origin, and /api/* (auth + freshness matter)
  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // Network-first for navigations, fall back to cache, then /offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          return res;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match("/offline"))
        )
    );
    return;
  }

  // Stale-while-revalidate for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy)).catch(() => {});
          }
          return res;
        })
        .catch(() => cached);
      return cached || fetchPromise;
    })
  );
});