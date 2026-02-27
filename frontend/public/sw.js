// Service Worker pour Indebel PWA
const CACHE_NAME = 'indebel-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.png',
  '/logo.png',
  '/images/1.png',
  '/images/2.png'
];

// Installation du service worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installation...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache ouvert');
        return cache.addAll(urlsToCache);
      })
      .catch((error) => {
        console.error('[Service Worker] Erreur lors de la mise en cache:', error);
      })
  );
  self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activation...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Stratégie de cache: Network First avec fallback sur cache
self.addEventListener('fetch', (event) => {
  // Ignorer les requêtes non-GET
  if (event.request.method !== 'GET') {
    return;
  }

  // Ignorer les requêtes non-HTTP/HTTPS (chrome-extension, etc.)
  const requestUrl = new URL(event.request.url);
  if (!requestUrl.protocol.startsWith('http')) {
    return;
  }

  // Ignorer les requêtes API et les modules Vite en développement
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('node_modules/.vite/') ||
      event.request.url.includes('?v=')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la réponse car elle ne peut être lue qu'une fois
        const responseToCache = response.clone();
        
        // Met en cache la nouvelle réponse
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Si le réseau échoue, essayer de récupérer depuis le cache
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          
          // Si pas dans le cache, retourner une page offline
          if (event.request.destination === 'document') {
            return caches.match('/index.html');
          }
        });
      })
  );
});

// Écouter les messages du client
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
