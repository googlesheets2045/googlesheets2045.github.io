const CACHE_NAME = 'mufid-motor-cache-v2';
const STATIC_CACHE = 'mufid-static-v2';
const DYNAMIC_CACHE = 'mufid-dynamic-v2';

// Critical resources untuk cache immediate
const CRITICAL_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

// Static resources untuk cache on install
const STATIC_URLS = [
  '/images/icon-192x192.png',
  '/images/icon-512x512.png'
];

// Install event - Cache critical resources immediately
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  self.skipWaiting(); // Aktifkan segera
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then(cache => {
        console.log('Caching critical resources');
        return cache.addAll(CRITICAL_URLS);
      })
      .then(() => {
        console.log('All critical resources cached');
      })
      .catch(err => {
        console.log('Cache installation failed:', err);
      })
  );
});

// Activate event - Clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  return self.clients.claim();
});

// Fetch event - Optimized caching strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  const requestUrl = new URL(event.request.url);
  
  // Handle same-origin requests with Cache First strategy
  if (requestUrl.origin === location.origin) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached version if found
          if (response) {
            return response;
          }

          // Clone the request because it's a one-time use stream
          const fetchRequest = event.request.clone();

          return fetch(fetchRequest).then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a one-time use stream
            const responseToCache = response.clone();

            caches.open(DYNAMIC_CACHE).then(cache => {
              cache.put(event.request, responseToCache);
            });

            return response;
          });
        })
        .catch(() => {
          // Fallback untuk halaman utama
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        })
    );
  } else {
    // Handle external requests (Google Apps Script) dengan Network First strategy
    if (requestUrl.href.includes('script.google.com')) {
      event.respondWith(
        fetch(event.request)
          .then(response => {
            // Cache successful responses untuk external resources
            if (response.status === 200) {
              const responseClone = response.clone();
              caches.open(DYNAMIC_CACHE).then(cache => {
                cache.put(event.request, responseClone);
              });
            }
            return response;
          })
          .catch(() => {
            // Fallback ke cached version jika ada
            return caches.match(event.request);
          })
      );
    }
  }
});

// Background sync untuk offline functionality
self.addEventListener('sync', event => {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    // Implement background sync logic here jika diperlukan
  }
});
