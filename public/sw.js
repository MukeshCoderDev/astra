// Service Worker for caching and offline support
const CACHE_NAME = 'astra-v1';
const STATIC_CACHE = 'astra-static-v1';
const DYNAMIC_CACHE = 'astra-dynamic-v1';

// Assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/logo.svg',
];

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/videos/,
  /\/api\/creators/,
  /\/api\/search/,
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Handle different types of requests
  if (request.destination === 'document') {
    // HTML documents - network first, fallback to cache
    event.respondWith(networkFirstStrategy(request));
  } else if (request.destination === 'image') {
    // Images - cache first, fallback to network
    event.respondWith(cacheFirstStrategy(request));
  } else if (isAPIRequest(url)) {
    // API requests - network first with cache fallback
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
  } else if (isStaticAsset(url)) {
    // Static assets - cache first
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    // Everything else - network first
    event.respondWith(networkFirstStrategy(request));
  }
});

// Network first strategy
async function networkFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed, trying cache:', error);
    
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for HTML documents
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache first strategy
async function cacheFirstStrategy(request, cacheName = DYNAMIC_CACHE) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Network failed for cache-first request:', error);
    throw error;
  }
}

// Check if request is for API
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
}

// Check if request is for static asset
function isStaticAsset(url) {
  return url.pathname.startsWith('/static/') || 
         url.pathname.endsWith('.js') ||
         url.pathname.endsWith('.css') ||
         url.pathname.endsWith('.woff2') ||
         url.pathname.endsWith('.woff');
}

// Background sync for failed requests
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Performing background sync...');
  // Implement background sync logic here
  // e.g., retry failed uploads, sync offline actions
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: '/logo.svg',
    badge: '/logo.svg',
    data: data.data,
    actions: data.actions || [],
    requireInteraction: data.requireInteraction || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'open') {
    event.waitUntil(
      clients.openWindow(data.url || '/')
    );
  }
});

// Message handling from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (if supported)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'content-sync') {
    event.waitUntil(syncContent());
  }
});

async function syncContent() {
  console.log('Syncing content in background...');
  // Implement periodic content sync
}