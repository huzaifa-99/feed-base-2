const PRECACHE = [
    "./",
    "./index.html",
    "./style.css",
    "./manifest.webmanifest",
    "./robots.txt",
    "./sitemap.xml",
    "./assets/icons/icon-192.png",
    "./assets/icons/icon-512.png",
    "./assets/icons/icon-maskable-512.png",
    "./assets/icons/apple-touch-icon.png",
    "./assets/images/binaryConversion.png",
    "./assets/fonts/Inconsolata-normal-latin.woff2",
    "./assets/fonts/Inconsolata-normal-latin-ext.woff2",
    "./assets/fonts/Inconsolata-normal-vietnamese.woff2",
    "./js/main.js",
    "./js/game.js",
    "./js/ui.js",
    "./js/modes.js",
    "./js/appearance.js",
    "./js/constants.js",
    "./js/utils.js",
    "./js/sound.js",
    "./js/particles.js",
    "./js/game-component.js",
    "./js/draw.js",
];

const CACHE_NAME = "feed-base-2-v4";

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;
    if (request.method !== "GET") return;

    event.respondWith(
        caches.match(request).then((cached) => {
            const networked = fetch(request)
                .then((response) => {
                    if (response && response.ok) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
                    }
                    return response;
                })
                .catch(() => cached);

            return cached || networked;
        })
    );
});
