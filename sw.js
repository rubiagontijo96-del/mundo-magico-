/* ═══════════════════════════════════════════
   MUNDO MÁGICO DAS CRIANÇAS — Service Worker
   Versão: 2.0
   Estratégia: Cache First — funciona 100% offline
═══════════════════════════════════════════ */

const CACHE_NAME = 'mundo-magico-v2';

const ASSETS = ['./','./index.html','./manifest.json'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (!event.request.url.startsWith('http')) return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) {
        /* Serve do cache e atualiza em background */
        fetch(event.request).then(res => {
          if (res && res.status === 200)
            caches.open(CACHE_NAME).then(c => c.put(event.request, res));
        }).catch(() => {});
        return cached;
      }
      /* Não está no cache — busca da rede e guarda */
      return fetch(event.request).then(res => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return res;
      }).catch(() => {
        if (event.request.destination === 'document')
          return caches.match('./index.html');
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
