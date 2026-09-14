const SEATING_CACHE = 'isbusy-seating-v1';

// Service worker for PWA installability and high-speed offline seating charts.
// Live class status and friends data always bypass the cache to guarantee real-time data.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Cache-first strategy exclusively for static seating arrangement photos
  if (url.pathname.startsWith('/seating/') && /\.(jpg|jpeg|png|webp)$/i.test(url.pathname)) {
    event.respondWith(
      caches.open(SEATING_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);
        if (cached) {
          return cached;
        }
        try {
          const networkResponse = await fetch(event.request);
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        } catch {
          return cached || Response.error();
        }
      })
    );
    return;
  }

  // All other requests fall through to normal network handling
});
