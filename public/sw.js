const SEATING_CACHE = 'isbusy-seating-v5';

// Service worker for PWA installability and high-speed offline seating charts.
// Live class status and friends data always bypass the cache to guarantee real-time data.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Purge all old caches to immediately clear stale seating photos
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== SEATING_CACHE) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first strategy for seating photos: always fetch fresh from network if online,
  // falling back to local cache if offline or on network failure.
  if (url.pathname.startsWith('/seating/') && /\.(jpg|jpeg|png|webp)$/i.test(url.pathname)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(SEATING_CACHE).then((cache) => cache.put(event.request, clone));
          } else if (networkResponse && networkResponse.status === 404) {
            caches.open(SEATING_CACHE).then((cache) => cache.delete(event.request));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(event.request);
          return cached || Response.error();
        })
    );
    return;
  }

  // All other requests fall through to normal network handling
});
