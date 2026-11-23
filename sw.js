/**
 * Service Worker - Dante Dash (Offline-First Cache) v2.2
 */
const CACHE_NAME = "dante-dash-v2.2";
const ASSETS_TO_CACHE = [
    "./",
    "./index.html",
    "./manifest.json",
    "./src/styles/reset.css",
    "./src/styles/main.css",
    "./src/scripts/engine.js",
    "./src/scripts/audio/synth.js",
    "./src/scripts/core/scoreEngine.js",
    "./src/scripts/core/spawnEngine.js",
    "./src/scripts/core/gameState.js",
    "./src/img/player.png",
    "./src/img/enemy-fighting.gif",
    "./src/img/enemy-dancing.gif",
    "./src/img/wall.png",
    "./src/img/favicon.jpg",
    "./src/audios/trilha-metal__denis-martino.m4a"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || fetch(event.request);
        })
    );
});
