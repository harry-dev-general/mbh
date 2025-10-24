/**
 * Service Worker for MBH Staff Portal Calendar
 * Provides offline support and caching for better performance
 */

const CACHE_NAME = 'mbh-calendar-v1';
const urlsToCache = [
  '/training/management-allocations.html',
  '/training/calendar-enhancements.js',
  '/training/calendar-enhancements.css',
  'https://unpkg.com/fullcalendar@6.1.19/index.global.min.css',
  'https://unpkg.com/fullcalendar@6.1.19/index.global.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache resources
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
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
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Parse URL
  const url = new URL(event.request.url);

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response before caching
          if (response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached API response if offline
          return caches.match(event.request).then(response => {
            if (response) {
              console.log('Serving cached API response:', url.pathname);
              return response;
            }
            // Return offline message for API calls
            return new Response(JSON.stringify({
              offline: true,
              message: 'You are currently offline. Data may be outdated.'
            }), {
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle static resources
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version or fetch from network
        return response || fetch(event.request).then(fetchResponse => {
          // Don't cache non-successful responses
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }

          // Clone the response
          const responseToCache = fetchResponse.clone();

          // Cache the fetched response
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });

          return fetchResponse;
        });
      })
      .catch(() => {
        // Only return offline page for management-allocations related requests
        if (event.request.destination === 'document' && 
            (url.pathname === '/training/management-allocations.html' || 
             url.pathname === '/training/management-allocations')) {
          return caches.match('/training/management-allocations.html');
        }
        // For other pages, just fail normally
        return new Response('Offline - Page not available', {
          status: 503,
          statusText: 'Service Unavailable',
          headers: new Headers({
            'Content-Type': 'text/plain'
          })
        });
      })
  );
});

// Background sync for pending updates
self.addEventListener('sync', event => {
  if (event.tag === 'sync-allocations') {
    event.waitUntil(syncAllocations());
  }
});

async function syncAllocations() {
  try {
    // Get pending updates from IndexedDB
    const pendingUpdates = await getPendingUpdates();
    
    for (const update of pendingUpdates) {
      try {
        const response = await fetch(update.url, {
          method: update.method,
          headers: update.headers,
          body: update.body
        });
        
        if (response.ok) {
          await removePendingUpdate(update.id);
        }
      } catch (error) {
        console.error('Failed to sync update:', error);
      }
    }
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getPendingUpdates() {
  // In a real implementation, this would read from IndexedDB
  return [];
}

async function removePendingUpdate(id) {
  // In a real implementation, this would remove from IndexedDB
  return;
}

// Listen for messages from the client
self.addEventListener('message', event => {
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
