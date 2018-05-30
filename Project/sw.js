self.addEventListener('install', function (event) {
    var urlsToCache = [
        // Mention URLS that need to be cached
        // It is required in order for the application to work offline
    ];

    event.waitUntil(
        caches.open(CACHES_NAME).then(function (cache) {
            return cache.addAll(urlsToCache);
            // Add all mentioned urls to the cache, so the app could work without the internet
        })
    );
});

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.match(event.request).then(function (response) {
            // Respond the data from the cache, if it was found there. Otherwise, fetch from the network.
            return response || fetch(event.request); 
        })
    );
});