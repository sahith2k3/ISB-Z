const CACHE_VERSION = 'isbusy-images-v9';
const STATIC_CACHE = 'isbusy-static-v9';
const IMAGE_CACHE = 'isbusy-images-v9';

// Essential static icons and branding to pre-cache on install
const PRECACHE_ASSETS = [
  '/favicon.png',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/logo.png',
  '/manifest.webmanifest',
];

// Helper to determine if a request is for an image
function isImageRequest(request, url) {
  if (request.method !== 'GET') return false;
  if (request.destination === 'image') return true;
  if (url.pathname.startsWith('/seating/')) return true;
  if (url.pathname.startsWith('/api/seating/image')) return true;
  if (/\.(jpg|jpeg|png|webp|svg|ico|gif|avif)(\?.*)?$/i.test(url.pathname)) return true;
  return false;
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Pre-caching non-fatal warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const currentCaches = [STATIC_CACHE, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (!currentCaches.includes(key)) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. Image caching: Cache-First strategy
  // If in cache, return immediately (0ms latency, zero repeated network requests).
  // If not in cache, fetch from network, save to IMAGE_CACHE, and return.
  if (isImageRequest(event.request, url)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(IMAGE_CACHE).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        }).catch(() => {
          // If offline and not in cache, try matching without query params
          return caches.match(url.pathname);
        });
      })
    );
    return;
  }

  // 2. All dynamic API endpoints (/api/students, /api/seating, etc.) and pages
  // pass through to network to ensure 100% fresh real-time data.
});
