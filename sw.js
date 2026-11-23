/* LexiFlow service worker: keeps the app itself available offline.
   Saved audio lives in IndexedDB, not here. Bump VERSION on every release. */
const VERSION = 'lexiflow-2.14.3';
const SHELL = ['./', './index.html', './speech-sdk.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    /* The page: newest version when online, saved copy when offline. */
    /* no-cache: ask the server every time (cheap when nothing changed), so a new release shows
       on the next open instead of after the browser's 10-minute HTTP cache runs out. */
    e.respondWith(fetch(req.url, {cache: 'no-cache', credentials: 'same-origin'}).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./index.html', copy));
      return res;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  e.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
