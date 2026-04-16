// ===================================================
// Service Worker - Abu Haitham Menu
// Engine: Jamstack / Cache Optimization
// ===================================================

const CACHE_NAME = 'menu-v2';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/styles/layout.css',
  '/styles/menu.css',
  '/styles/mobile.css',
  '/scripts/app.js',
  '/scripts/cart.js',
  '/scripts/whatsapp.js'
];

// ===================================================
// Install: Pre-cache Essential Files
// ===================================================
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

// ===================================================
// Activate: Clean Old Caches Automatically
// ===================================================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// ===================================================
// Fetch Strategies
// ===================================================
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // 1. HTML + JSON -> Network First, Fallback to Cache
  if (url.pathname.endsWith('.html') || url.pathname.endsWith('.json') || url.pathname === '/') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 2. CSS + JS -> Stale-While-Revalidate
  if (event.request.destination === 'style' || event.request.destination === 'script') {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          return networkResponse;
        }).catch(() => {}); // silent fail for network errors
        
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // 3. Images -> Cache First
  if (event.request.destination === 'image') {
    event.respondWith(
      caches.match(event.request).then((cached) => {
        if (cached) return cached;
        return fetch(event.request).then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          return response;
        }).catch(() => {}); // silent fail
      })
    );
    return;
  }
});
