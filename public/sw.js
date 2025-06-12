const CACHE_NAME = 'jennys-pudding-icons-v1';
const ICON_CACHE_NAME = 'category-icons-v1';

// Cache category icons specifically
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Cache category icons (base64 data URLs and external icon URLs)
  if (event.request.url.includes('data:image/') || 
      (url.pathname.includes('icon') && event.request.destination === 'image')) {
    
    event.respondWith(
      caches.open(ICON_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(response => {
          if (response) {
            return response;
          }
          
          return fetch(event.request).then(fetchResponse => {
            // Only cache successful responses
            if (fetchResponse.status === 200) {
              cache.put(event.request, fetchResponse.clone());
            }
            return fetchResponse;
          }).catch(() => {
            // Return a fallback icon if network fails
            return new Response(
              '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect width="64" height="64" fill="#b48a78" opacity="0.1" rx="16"/><text x="32" y="40" text-anchor="middle" font-size="24">🍮</text></svg>',
              { headers: { 'Content-Type': 'image/svg+xml' } }
            );
          });
        });
      })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== ICON_CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Install event
self.addEventListener('install', (event) => {
  self.skipWaiting();
}); 