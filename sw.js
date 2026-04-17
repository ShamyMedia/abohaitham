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
        .catch(() => caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) return cachedResponse;
            // Native Offline Fallback if both fail
            if (event.request.headers.get('accept').includes('text/html') || url.pathname === '/') {
                return new Response(
                    `<!DOCTYPE html><html dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>غير متصل - أبو هيثم</title><style>body{font-family:'Segoe UI',sans-serif;text-align:center;padding:15vh 20px;color:#D32F2F;background:#fcfcfc;}</style></head><body><h2>🔴 عذراً، لا يوجد اتصال بالإنترنت</h2><p>لم تقم بزيارة هذه الصفحة مسبقاً ليتم تخزينها. يرجى تفعيل الشبكة والمحاولة.</p><button onclick="location.reload()" style="padding:10px 20px;font-weight:bold;margin-top:20px;background:#FFC107;border:none;border-radius:20px;">إعادة المحاولة</button></body></html>`,
                    { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
                );
            }
            return new Response('{"error": "offline"}', { headers: { 'Content-Type': 'application/json' } });
        }))
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
