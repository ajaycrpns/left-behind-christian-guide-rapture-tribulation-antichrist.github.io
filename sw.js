/*
 * Offline-First Service Worker for KJV Prophecy Tracker & 66-Book Bible
 * Caches the application shell and full 31,102-verse KJV dataset (kjv-verses.json)
 * so all 7 study modes work 100% offline after initial load.
 */
const CACHE_NAME = "kjv-prophecy-tracker-v2";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icon.svg",
  "./kjv-verses.json?v=31102-conc"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const asset of CORE_ASSETS) {
        try {
          await cache.add(asset);
        } catch (_) {
          // Continue installing even if an optional query variant fails
        }
      }
      await self.skipWaiting();
    })
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(oldKey => caches.delete(oldKey))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // For kjv-verses.json, serve immediately from cache if present, else fetch and cache
  if (url.pathname.endsWith("/kjv-verses.json") || url.pathname === "kjv-verses.json") {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached =
          (await cache.match(req)) ||
          (await cache.match("./kjv-verses.json?v=31102-conc")) ||
          (await cache.match("./kjv-verses.json"));
        if (cached) {
          return cached;
        }
        const netRes = await fetch(req);
        if (netRes && netRes.ok) {
          cache.put(req, netRes.clone());
        }
        return netRes;
      })
    );
    return;
  }

  // For HTML navigation & app shell: network-first with instant offline cache fallback,
  // or stale-while-revalidate for static assets
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req);
      const fetchPromise = fetch(req)
        .then(netRes => {
          if (netRes && netRes.ok) {
            cache.put(req, netRes.clone());
          }
          return netRes;
        })
        .catch(() => null);

      if (cached) {
        // Update in background while returning cached copy immediately
        event.waitUntil(fetchPromise);
        return cached;
      }

      const netRes = await fetchPromise;
      if (netRes) return netRes;

      if (req.mode === "navigate") {
        const fallbackHtml = (await cache.match("./index.html")) || (await cache.match("./"));
        if (fallbackHtml) return fallbackHtml;
      }
      return new Response("Offline — resource not cached", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8" }
      });
    })
  );
});

self.addEventListener("message", event => {
  const data = event.data || {};
  if (data.type === "CACHE_ALL_OFFLINE") {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async cache => {
        for (const asset of CORE_ASSETS) {
          const existing = await cache.match(asset);
          if (!existing) {
            try {
              await cache.add(asset);
            } catch (_) {}
          }
        }
        if (event.source && typeof event.source.postMessage === "function") {
          event.source.postMessage({ type: "OFFLINE_CACHE_READY", cacheName: CACHE_NAME });
        }
      })
    );
  }
});
