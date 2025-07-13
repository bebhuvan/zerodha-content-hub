const CACHE_VERSION = 'zerodha-content-v2';
const STATIC_CACHE_NAME = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE_NAME = `${CACHE_VERSION}-dynamic`;

// Cache expiration times (in milliseconds)
const CACHE_EXPIRATION = {
  api: 5 * 60 * 1000,        // 5 minutes for API calls
  static: 7 * 24 * 60 * 60 * 1000, // 7 days for static assets
  dynamic: 24 * 60 * 60 * 1000     // 1 day for other dynamic content
};

// URLs that should always use network-first strategy
const NETWORK_FIRST_URLS = [
  '/api/',
  '/content.json',
  '/feed.xml',
  '/sitemap.xml',
  '/data/'
];

// Static assets to pre-cache
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.svg'
];

// Check if URL should use network-first strategy
function shouldUseNetworkFirst(url) {
  return NETWORK_FIRST_URLS.some(pattern => url.pathname.includes(pattern));
}

// Clean old caches
async function cleanOldCaches() {
  const cacheNames = await caches.keys();
  const currentCaches = [STATIC_CACHE_NAME, DYNAMIC_CACHE_NAME];
  
  return Promise.all(
    cacheNames
      .filter(cacheName => !currentCaches.includes(cacheName))
      .map(cacheName => caches.delete(cacheName))
  );
}

// Check if cached response is expired
function isCacheExpired(response, maxAge) {
  const fetchDate = response.headers.get('sw-fetch-date');
  if (!fetchDate) return true;
  
  const age = Date.now() - new Date(fetchDate).getTime();
  return age > maxAge;
}

// Clone response and add fetch date header
function addFetchDate(response) {
  const headers = new Headers(response.headers);
  headers.set('sw-fetch-date', new Date().toISOString());
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
}

// Network-first strategy with fallback to cache
async function networkFirst(request, cacheName, maxAge) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = addFetchDate(networkResponse.clone());
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Return cached response even if expired (better than nothing)
      return cachedResponse;
    }
    
    // Return offline fallback for navigation requests
    if (request.mode === 'navigate') {
      const cache = await caches.open(STATIC_CACHE_NAME);
      return cache.match('/');
    }
    
    throw error;
  }
}

// Cache-first strategy with expiration check
async function cacheFirst(request, cacheName, maxAge) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse && !isCacheExpired(cachedResponse, maxAge)) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      const responseToCache = addFetchDate(networkResponse.clone());
      cache.put(request, responseToCache);
    }
    
    return networkResponse;
  } catch (error) {
    if (cachedResponse) {
      // Return expired cache if network fails
      return cachedResponse;
    }
    throw error;
  }
}

// Install event - pre-cache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    cleanOldCaches()
      .then(() => self.clients.claim())
  );
});

// Fetch event - handle requests with appropriate strategy
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-HTTP(S) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }
  
  // Skip cross-origin requests
  if (url.origin !== self.location.origin) {
    return;
  }
  
  event.respondWith(
    (async () => {
      // Network-first for API and dynamic content
      if (shouldUseNetworkFirst(url)) {
        return networkFirst(request, DYNAMIC_CACHE_NAME, CACHE_EXPIRATION.api);
      }
      
      // Cache-first for static assets
      if (request.destination === 'image' || 
          request.destination === 'style' || 
          request.destination === 'script' ||
          request.destination === 'font') {
        return cacheFirst(request, STATIC_CACHE_NAME, CACHE_EXPIRATION.static);
      }
      
      // Network-first for HTML pages
      if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
        return networkFirst(request, DYNAMIC_CACHE_NAME, CACHE_EXPIRATION.dynamic);
      }
      
      // Default to network-first for everything else
      return networkFirst(request, DYNAMIC_CACHE_NAME, CACHE_EXPIRATION.dynamic);
    })()
  );
});

// Handle messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then(cacheNames => Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        ))
        .then(() => event.ports[0].postMessage({ success: true }))
    );
  }
});