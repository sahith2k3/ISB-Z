// Minimal service worker whose sole job is to make the app installable as a
// PWA. It intentionally does not cache anything — this app's data (live
// class status, friend lists) must always come from the network, so an
// offline app-shell cache would risk showing stale "who's free" info.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', () => {
  // No-op: fall through to normal network handling for every request.
});
