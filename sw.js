// The version of the cache. A new version triggers the install event.
const CACHE_NAME = 'tic-tracker-cache-v8';

// The URLs that should be cached for the app to work offline.
const URLS_TO_CACHE = [
  '/',
  'index.html',
  'index.css',
  'index.js',
  'state.js',
  'views.js',
  'components.js',
  'charts.js',
  'manifest.json',
  'icon-192x192.svg',
  'icon-512x512.svg',
  'maskable-icon.svg',
  'screenshot-mobile.svg',
  'screenshot-desktop.svg',
  'https://cdn.tailwindcss.com',
  'https://d3js.org/d3.v7.min.js',
  'https://esm.run/@google/genai'
];

// Install event: opens a cache and adds the app shell files to it.
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(URLS_TO_CACHE);
      })
      .then(() => self.skipWaiting()) // Force the waiting service worker to become the active service worker.
  );
});

// Fetch event: serves requests from the cache first (cache-first strategy).
// If the request is not in the cache, it fetches it from the network,
// caches the response for future offline use, and then returns it.
self.addEventListener('fetch', event => {
  // We only want to handle GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from the cache
        if (response) {
          return response;
        }

        // Not in cache - fetch from the network
        return fetch(event.request).then(
          networkResponse => {
            // Check if we received a valid response
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            
            // We can't cache certain types of responses (e.g., from chrome-extension://).
            if (networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                return networkResponse;
            }

            // Clone the response because it's a stream and can be consumed only once.
            const responseToCache = networkResponse.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                // Add the new response to the cache for future offline use.
                cache.put(event.request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
          // The fetch failed, likely due to being offline.
          console.warn(`Service worker fetch failed for ${event.request.url}:`, error);
          // Return an error response so the browser knows the fetch failed.
          return new Response(null, {
            status: 404,
            statusText: "Service Worker could not fetch resource offline."
          });
        });
      })
  );
});


// Activate event: cleans up old, unused caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all open clients.
  );
});