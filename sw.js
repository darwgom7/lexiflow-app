/* LexiFlow service worker: keeps the app itself available offline.
   Saved audio lives in IndexedDB, not here. Bump VERSION on every release. */
const VERSION = 'lexiflow-2.17.0';
const SHARE = 'lexiflow-share';
const SHELL = ['./', './index.html', './speech-sdk.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION && k !== SHARE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  /* Shared from another app: keep any screenshots in a cache, then open the app with the text
     in the address (the page reads ?title&text&url, and ?shots=N for the pictures). */
  if (req.method === 'POST' && new URL(req.url).pathname.endsWith('/share-target')) {
    e.respondWith((async () => {
      const q = new URLSearchParams();
      try {
        const fd = await req.formData();
        const files = fd.getAll('images').filter(f => f && typeof f !== 'string' && f.size);
        const c = await caches.open(SHARE);
        await Promise.all((await c.keys()).map(k => c.delete(k)));
        await Promise.all(files.map((f, i) => c.put('./__share/' + i, new Response(f, {headers: {
          'content-type': f.type || 'image/png', 'x-name': encodeURIComponent(f.name || ''),
          'x-modified': String(f.lastModified || 0)}}))));
        for (const k of ['title', 'text', 'url']) { const v = fd.get(k); if (typeof v === 'string' && v) q.set(k, v); }
        if (files.length) q.set('shots', String(files.length));
      } catch (err) {}
      return Response.redirect(new URL('./?' + q, self.registration.scope).href, 303);
    })());
    return;
  }
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
