// Go Galaxy — Service Worker
// No hardcoded version. HTML always served fresh from network.
// Assets (icons, manifest) served cache-first with network fallback.
// On every SW update (file change detected by browser), all old caches are wiped.

const CACHE_NAME = 'go-galaxy-assets';

// Files to cache for offline asset support (NOT index.html — that's always fresh)
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  // Pre-cache static assets; skip waiting so new SW activates immediately
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Wipe any caches that aren't our current asset cache
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document'
    || url.pathname === '/'
    || url.pathname.endsWith('.html');

  if (isHTML) {
    // Network-first for HTML: always get the freshest version.
    // Fall back to cache only if completely offline.
    e.respondWith(
      fetch(e.request, { cache: 'no-store' })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Cache-first for static assets (icons, manifest)
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        return response;
      });
    })
  );
});
