const CACHE_NAME = 'insureai-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Service Worker
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
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
    })
  );
  return self.clients.claim();
});

// Fetch Strategy: Network First, falling back to Cache
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response
        const responseClone = response.clone();
        
        // Cache the fetched response
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // If network fails, try cache
        return caches.match(event.request).then(response => {
          if (response) {
            return response;
          }
          // If not in cache, return offline page or error
          return new Response('Offline - Please check your connection', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Background Sync for offline actions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-policies') {
    event.waitUntil(syncPolicies());
  }
});

async function syncPolicies() {
  // This would sync any offline changes when connection is restored
  console.log('Syncing policies...');
  // Implementation would go here
}

// Push Notifications (for policy renewal reminders)
self.addEventListener('push', event => {
  const options = {
    body: event.data ? event.data.text() : 'Policy renewal reminder',
    icon: '/icon-192.png',
    badge: '/icon-72.png',
    vibrate: [200, 100, 200],
    tag: 'policy-reminder',
    actions: [
      { action: 'view', title: 'View Policy', icon: '/icon-72.png' },
      { action: 'dismiss', title: 'Dismiss', icon: '/icon-72.png' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('InsureAI Reminder', options)
  );
});

// Notification Click Handler
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'view') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});