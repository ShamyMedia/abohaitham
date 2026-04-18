const CACHE = "menu-v3";

self.addEventListener("install", e=>{
    e.waitUntil(
        caches.open(CACHE).then(c=>c.addAll([
            "index.html",
            "styles/layout.css",
            "styles/menu.css",
            "styles/mobile.css",
            "scripts/app.js",
            "scripts/cart.js",
            "scripts/whatsapp.js"
        ]))
    );
});

self.addEventListener("fetch", e=>{
    e.respondWith(
        fetch(e.request).catch(()=>caches.match(e.request))
    );
});