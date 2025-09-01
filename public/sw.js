// Service Worker for caching and offline support
const CACHE_NAME = 'astra-v1';
const STATIC_CACHE = 'astra-static-v1';
const DYNAMIC_CACHE = 'astra-dynamic-v1';
const DOWNLOAD_CACHE = 'astra-downloads-v1';
const MANIFEST_CACHE = 'astra-manifests-v1';

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

  // Handle HLS segments and manifests
  if (isHLSRequest(url)) {
    event.respondWith(handleHLSRequest(request));
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
  const { data, ports } = event;
  
  if (data && data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (data && data.type === 'CACHE_VIDEO') {
    handleCacheVideo(data, ports[0]);
  } else if (data && data.type === 'UNCACHE_VIDEO') {
    handleUncacheVideo(data, ports[0]);
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

// HLS and Download Management Functions

// Check if request is for HLS content
function isHLSRequest(url) {
  return url.pathname.endsWith('.m3u8') || 
         url.pathname.endsWith('.ts') ||
         url.pathname.includes('/hls/') ||
         url.searchParams.has('m3u8');
}

// Handle HLS requests with caching logic
async function handleHLSRequest(request) {
  const url = new URL(request.url);
  
  // Check if this video is marked for offline caching
  const videoId = extractVideoIdFromHLS(url);
  const isCached = videoId ? await isVideoMarkedForCaching(videoId) : false;
  
  if (isCached) {
    // Try cache first for downloaded content
    return cacheFirstStrategy(request, DOWNLOAD_CACHE);
  } else {
    // Network first for streaming content
    return networkFirstStrategy(request, DYNAMIC_CACHE);
  }
}

// Extract video ID from HLS URL
function extractVideoIdFromHLS(url) {
  // Try to extract video ID from URL patterns
  const patterns = [
    /\/videos\/([^\/]+)\/hls/,
    /videoId=([^&]+)/,
    /\/hls\/([^\/]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.pathname.match(pattern) || url.search.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Check if video is marked for offline caching
async function isVideoMarkedForCaching(videoId) {
  try {
    const cache = await caches.open(MANIFEST_CACHE);
    const request = new Request(`/cached-video-metadata?videoId=${videoId}`);
    const response = await cache.match(request);
    return !!response;
  } catch (error) {
    return false;
  }
}

// Handle video caching request
async function handleCacheVideo(data, port) {
  const { videoId, hlsUrl } = data;
  
  try {
    console.log(`Starting cache for video ${videoId}`);
    
    // Fetch the master manifest
    const manifestResponse = await fetch(hlsUrl);
    if (!manifestResponse.ok) {
      throw new Error('Failed to fetch manifest');
    }
    
    const manifestText = await manifestResponse.text();
    const manifestCache = await caches.open(MANIFEST_CACHE);
    const downloadCache = await caches.open(DOWNLOAD_CACHE);
    
    // Cache the manifest
    await manifestCache.put(hlsUrl, new Response(manifestText));
    
    // Parse manifest and cache segments
    const segmentUrls = parseHLSManifest(manifestText, hlsUrl);
    let cachedSegments = 0;
    
    // Cache segments with progress reporting
    for (let i = 0; i < segmentUrls.length; i++) {
      const segmentUrl = segmentUrls[i];
      
      try {
        const segmentResponse = await fetch(segmentUrl);
        if (segmentResponse.ok) {
          await downloadCache.put(segmentUrl, segmentResponse);
          cachedSegments++;
          
          // Report progress
          const progress = Math.round((cachedSegments / segmentUrls.length) * 100);
          self.clients.matchAll().then(clients => {
            clients.forEach(client => {
              client.postMessage({
                type: 'DOWNLOAD_PROGRESS',
                progress: {
                  videoId,
                  progress,
                  status: progress === 100 ? 'completed' : 'downloading'
                }
              });
            });
          });
        }
      } catch (error) {
        console.error(`Failed to cache segment ${segmentUrl}:`, error);
      }
    }
    
    // Store metadata
    const metadata = {
      videoId,
      hlsUrl,
      cachedAt: new Date().toISOString(),
      segmentCount: segmentUrls.length,
      cachedSegments
    };
    
    const metadataRequest = new Request(`/cached-video-metadata?videoId=${videoId}`);
    await manifestCache.put(metadataRequest, new Response(JSON.stringify(metadata)));
    
    port.postMessage({ success: true });
    console.log(`Successfully cached video ${videoId}`);
    
  } catch (error) {
    console.error(`Failed to cache video ${videoId}:`, error);
    port.postMessage({ success: false, error: error.message });
    
    // Report failure
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'DOWNLOAD_PROGRESS',
          progress: {
            videoId,
            progress: 0,
            status: 'failed'
          }
        });
      });
    });
  }
}

// Handle video uncaching request
async function handleUncacheVideo(data, port) {
  const { videoId } = data;
  
  try {
    console.log(`Removing cache for video ${videoId}`);
    
    const manifestCache = await caches.open(MANIFEST_CACHE);
    const downloadCache = await caches.open(DOWNLOAD_CACHE);
    
    // Get metadata to find all cached URLs
    const metadataRequest = new Request(`/cached-video-metadata?videoId=${videoId}`);
    const metadataResponse = await manifestCache.match(metadataRequest);
    
    if (metadataResponse) {
      const metadata = await metadataResponse.json();
      
      // Remove manifest
      await downloadCache.delete(metadata.hlsUrl);
      
      // Remove all segments (this is a simplified approach)
      const allRequests = await downloadCache.keys();
      for (const request of allRequests) {
        const url = new URL(request.url);
        if (extractVideoIdFromHLS(url) === videoId) {
          await downloadCache.delete(request);
        }
      }
      
      // Remove metadata
      await manifestCache.delete(metadataRequest);
    }
    
    port.postMessage({ success: true });
    console.log(`Successfully removed cache for video ${videoId}`);
    
  } catch (error) {
    console.error(`Failed to remove cache for video ${videoId}:`, error);
    port.postMessage({ success: false, error: error.message });
  }
}

// Parse HLS manifest to extract segment URLs
function parseHLSManifest(manifestText, baseUrl) {
  const lines = manifestText.split('\n');
  const segmentUrls = [];
  const baseUrlObj = new URL(baseUrl);
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Skip comments and empty lines
    if (trimmedLine.startsWith('#') || !trimmedLine) {
      continue;
    }
    
    // Handle relative URLs
    if (trimmedLine.startsWith('http')) {
      segmentUrls.push(trimmedLine);
    } else {
      // Resolve relative URL
      const segmentUrl = new URL(trimmedLine, baseUrlObj.href);
      segmentUrls.push(segmentUrl.href);
    }
  }
  
  return segmentUrls;
}