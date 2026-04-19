const CACHE_NAME = "menu-cache-v2";

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
    if (event.request.url.includes("menu.json")) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request).then(res => {
            return res || fetch(event.request).then(networkRes => {
                return caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, networkRes.clone());
                    return networkRes;
                });
            });
        })
    );
});
