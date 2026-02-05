// Service Worker for Piece Rate Tracker
// Provides offline support and caching for PWA functionality

const CACHE_NAME = 'piece-rate-tracker-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';

// Resources to cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// Install event - cache resources
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Caching app shell');
        return cache.addAll(PRECACHE_URLS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(cacheName => {
              return cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE;
            })
            .map(cacheName => {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            })
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', event => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    // For CDN resources, try cache first
    if (event.request.url.includes('unpkg.com') || 
        event.request.url.includes('googleapis.com')) {
      event.respondWith(
        caches.match(event.request)
          .then(response => response || fetch(event.request))
      );
    }
    return;
  }

  // For same-origin requests, network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseToCache = response.clone();
        
        // Cache successful responses
        if (response.status === 200) {
          caches.open(RUNTIME_CACHE)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // If not in cache and network failed, return offline page
            if (event.request.mode === 'navigate') {
              return caches.match('/index.html');
            }
            
            return new Response('Offline', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
      })
  );
});

// Background sync for offline scans
self.addEventListener('sync', event => {
  if (event.tag === 'sync-scans') {
    event.waitUntil(syncScans());
  }
});

async function syncScans() {
  try {
    // Get queued scans from IndexedDB or localStorage
    // This would integrate with your Google Sheets API
    console.log('Background sync: Syncing offline scans...');
    
    // In production, implement actual sync logic here
    // Example:
    // const scans = await getQueuedScans();
    // await Promise.all(scans.map(scan => uploadScan(scan)));
    
    return Promise.resolve();
  } catch (error) {
    console.error('Background sync failed:', error);
    return Promise.reject(error);
  }
}

// Push notification support (future feature)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('Piece Rate Tracker', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('Service Worker loaded');
