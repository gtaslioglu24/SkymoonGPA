/**
 * Offline support for a fully static app.
 *
 * Strategy, deliberately small — no build-time precache manifest to drift:
 *  - Navigations: network first, fall back to the cached shell. Campus Wi-Fi
 *    drops constantly; the calculator should still open.
 *  - /assets/* and /fonts/*: cache first. Filenames are content-hashed (or the
 *    fonts never change), so a cached hit is never stale.
 *  - Everything else: network, with a cached copy as the fallback.
 *
 * Only same-origin GETs are touched; nothing is ever cached from elsewhere.
 *
 * `__BUILD_ID__` is replaced at build time (see vite.config.ts). A fixed cache
 * name would outlive the bundle it was filled with: after a redeploy, returning
 * visitors could be served yesterday's cached shell, which references asset
 * filenames that no longer exist — a blank page for exactly the users who come
 * back most often. A per-build name means `activate` drops the old cache.
 */

const CACHE = 'skymoon-gpa-__BUILD_ID__';
const SHELL = '/index.html';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll([SHELL, '/', '/theme.js']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function isImmutable(url) {
  return url.pathname.startsWith('/assets/') || url.pathname.startsWith('/fonts/');
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(SHELL, copy));
          return res;
        })
        .catch(() => caches.match(SHELL).then((r) => r || Response.error())),
    );
    return;
  }

  if (isImmutable(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
    return;
  }

  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      })
      .catch(() => caches.match(request).then((r) => r || Response.error())),
  );
});
