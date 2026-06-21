// Service Worker for Leon-lab PWA
// self.__WB_MANIFEST is replaced by workbox-build with the precache manifest array
// Using global assignment to prevent rollup from tree-shaking this reference
self._wbManifest = self.__WB_MANIFEST;

const CACHE_NAME = 'leon-lab-v2';

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET' || !url.protocol.startsWith('http')) return;

  // Firebase / Google APIs → network only
  if (url.hostname.includes('googleapis.com') || url.hostname.includes('firebaseapp.com')) {
    return;
  }

  if (url.origin === self.location.origin) {
    // HTML (index.html / navigation) → network first, fallback to cache
    if (event.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/') {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            return response;
          })
          .catch(() => caches.match(event.request))
      );
      return;
    }

    // JS / CSS / images (content-hashed) → stale-while-revalidate
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(cached => {
          const fetchPromise = fetch(event.request).then(response => {
            if (response.ok) cache.put(event.request, response.clone());
            return response;
          });
          return cached || fetchPromise;
        })
      )
    );
  }
});
