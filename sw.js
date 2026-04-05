// Service Worker для кеширования и оффлайн функциональности
const CACHE_NAME = 'kosmos-shop-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles.css',
    '/script.js',
    '/data.js'
];

// Установка SW и кеширование файлов
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(urlsToCache).catch(err => {
                console.log('Caching error:', err);
            });
        })
    );
    self.skipWaiting();
});

// Активация SW и очистка старых кешей
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Обработка запросов с стратегией "Network first, fallback to cache"
self.addEventListener('fetch', event => {
    // Пропускаем запросы не-GET
    if (event.request.method !== 'GET') return;
    
    event.respondWith(
        fetch(event.request)
            .then(response => {
                // Кешируем успешные ответы
                if (response && response.status === 200 && response.type === 'basic') {
                    const responseToCache = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return response;
            })
            .catch(() => {
                // Если сеть не доступна, используем кеш
                return caches.match(event.request);
            })
    );
});
