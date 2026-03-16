const CACHE_VERSION = '2026-03-16-02';
const CACHE_NAME = 'go-galaxy-' + CACHE_VERSION;
const PRECACHE = ['./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const isHTML = e.request.destination === 'document' ||
    new URL(e.request.url).pathname.endsWith('.html');
  if (isHTML) {
    e.respondWith(fetch(e.request)
      .then(r => { caches.open(CACHE_NAME).then(c => c.put(e.request, r.clone())); return r; })
      .catch(() => caches.match(e.request)));
  } else {
    e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).then(nr => {
      caches.open(CACHE_NAME).then(c => c.put(e.request, nr.clone())); return nr;
    })));
  }
});
