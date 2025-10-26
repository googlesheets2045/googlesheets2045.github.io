const CACHE_NAME = 'sandiwangi-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/sw.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // Jangan cache request ke Google Apps Script
  if (event.request.url.includes('script.google.com')) {
    return fetch(event.request);
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch new
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});