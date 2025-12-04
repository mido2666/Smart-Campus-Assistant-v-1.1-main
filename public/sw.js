// Self-destructing Service Worker to clean up old caches and unregister
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.matchAll();
    }).then((clients) => {
      clients.forEach((client) => {
        client.postMessage({ type: 'SW_UNREGISTER' });
      });
      return self.registration.unregister();
    })
  );
});
