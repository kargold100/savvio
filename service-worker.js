/* ===========================================================
   Savvio — service worker
   Caches the app shell so it opens instantly (and works fully
   offline) after the first visit. Uses a stale-while-revalidate
   pattern: serve from cache immediately, refresh in the
   background. POST requests (Apps Script sync/login calls) are
   never touched — only cached GETs.
   =========================================================== */

const CACHE_NAME = "savvio-cache-v2";

const APP_SHELL = [
  "./",
  "./index.html",
  "./css/style.css",
  "./js/app.js",
  "./js/cloud.js",
  "./js/storage.js",
  "./data/tips.js",
  "./data/quiz.js",
  "./data/lessons.js",
  "./data/challenges.js",
  "./data/games.js",
  "./assets/logo.svg",
  "./manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return; // let POSTs (cloud sync/login) go straight to the network, untouched

  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === "basic") {
            const copy = res.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
