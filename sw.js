// Service Worker — Nguyễn Văn Hảo Blog
const CACHE_NAME = 'nvh-blog-v1';
const ASSETS_TO_CACHE = [
    '/',
    '/index.html',
    '/blog',
    '/gioi-thieu',
    '/lien-he',
    '/css/main.css',
    '/css/style.css',
    '/css/animations.css',
    '/js/main.js',
    '/js/tracking.js',
    '/manifest.json'
];

// Install — cache core assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
    self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
        )
    );
    self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        fetch(event.request)
            .then((response) => {
                const clone = response.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
