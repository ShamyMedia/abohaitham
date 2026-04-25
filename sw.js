const CACHE_NAME = "menu-cache-v3";
const IMG_CACHE_LIMIT = 50;

self.addEventListener("install", () => {
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.filter(k => k !== CACHE_NAME)
                    .map(k => caches.delete(k))
            )
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", event => {
    /* ── menu.json: Stale-While-Revalidate (Non-Blocking) ── */
    if (event.request.url.includes("menu.json")) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                const networkFetch = fetch(event.request).then(res => {
                    return caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, res.clone());
                        return res;
                    });
                }).catch(() => {
                    // Fallback صامت لو مفيش نت
                    return new Response(
                        JSON.stringify({ categories: [] }),
                        { headers: { "Content-Type": "application/json" } }
                    );
                });

                /* يعرض المحفوظ فوراً إن وجد، بينما يستكمل التحديث في الخلفية */
                return cached || networkFetch;
            })
        );
        return;
    }

    /* ── باقي الأصول: Cache First + حد أقصى للصور ── */
    event.respondWith(
        caches.match(event.request).then(res => {
            return res || fetch(event.request).then(networkRes => {
                return caches.open(CACHE_NAME).then(async cache => {
                    cache.put(event.request, networkRes.clone());
                    /* منع تراكم الصور: احتفظ بآخر 50 فقط */
                    const isImage = event.request.url.match(/\.(webp|jpg|jpeg|png|gif|svg)/);
                    if (isImage) {
                        const keys = await cache.keys();
                        const imgKeys = keys.filter(k => k.url.match(/\.(webp|jpg|jpeg|png|gif|svg)/));
                        if (imgKeys.length > IMG_CACHE_LIMIT) {
                            await cache.delete(imgKeys[0]);
                        }
                    }
                    return networkRes;
                });
            });
        })
    );
});
