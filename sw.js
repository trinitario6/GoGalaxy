// Go Galaxy — Service Worker
// Clears all old caches on activate. HTML served network-first. Assets cache-first.
const CACHE = 'go-galaxy-v1';
const ASSETS = ['./index.html', './manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  // Delete every cache that isn't our current one
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  const isHTML = e.request.destination === 'document' || url.pathname.endsWith('.html');
  if (isHTML) {
    // Network-first: always try to get fresh HTML, fall back to cache if offline
    e.respondWith(
      fetch(e.request)
        .then(r => {
          const copy = r.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
          return r;
        })
        .catch(() => caches.match(e.request))
    );
  } else {
    // Cache-first for assets
    e.respondWith(
      caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
        caches.open(CACHE).then(c => c.put(e.request, nr.clone()));
        return nr;
      }))
    );
  }
});
