const CACHE_NAME = 'dkmanager25-static-__BUILD_VERSION__';
const BUILD_ASSETS = [];
const APP_SHELL = ['/', '/manifest.webmanifest', '/icon.svg', ...BUILD_ASSETS];

self.addEventListener('install', event => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL.map(url => new Request(url, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches
      .keys()
      .then(keys => Promise.all(keys.filter(key => key.startsWith('dkmanager25-static-') && key !== CACHE_NAME).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }

  const requestUrl = new URL(event.request.url);

  if (requestUrl.origin !== self.location.origin) {
    return;
  }

  const fetchAndCache = async () => {
    const response = await fetch(event.request, { cache: 'no-cache' });
    if (response.ok) {
      await caches.open(CACHE_NAME)
        .then(cache => cache.put(event.request, response.clone()))
        .catch(() => undefined);
    }
    return response;
  };

  if (event.request.mode === 'navigate') {
    event.respondWith(fetchAndCache().catch(async () => {
      const cache = await caches.open(CACHE_NAME);
      return await cache.match(event.request) || await cache.match('/') || Response.error();
    }));
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetchAndCache().catch(() => Response.error());
    })
  );
});
