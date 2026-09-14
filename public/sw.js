const CACHE_VERSION = 'dkmanager25-v1';
const APP_SCOPE = self.registration.scope;
const APP_SHELL_URL = new URL('', APP_SCOPE).toString();
const STATIC_ASSETS = [
  new URL('manifest.webmanifest', APP_SCOPE).toString(),
  new URL('icons/icon-192.png', APP_SCOPE).toString(),
  new URL('icons/icon-512.png', APP_SCOPE).toString(),
];
const isCacheableResponse = (response) => response && response.ok;
const putInCache = async (request, response) => {
  if (!isCacheableResponse(response)) {
    return response;
  }

  const cache = await caches.open(CACHE_VERSION);
  await cache.put(request, response.clone());
  return response;
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(async () => {
        try {
          const response = await fetch(APP_SHELL_URL, { cache: 'no-cache' });
          await putInCache(APP_SHELL_URL, response);
        } catch (error) {
          console.warn('App shell precache skipped:', error);
        }
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET' || !request.url.startsWith(self.location.origin)) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(async (response) => {
          await putInCache(request, response);
          await putInCache(APP_SHELL_URL, response);
          return response;
        })
        .catch(async () => {
          const cachedResponse = await caches.match(request);
          return cachedResponse || caches.match(APP_SHELL_URL);
        }),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const networkRequest = fetch(request)
        .then((response) => putInCache(request, response))
        .catch(() => cachedResponse);

      if (cachedResponse) {
        event.waitUntil(networkRequest.then(() => undefined));
        return cachedResponse;
      }

      return networkRequest;
    }),
  );
});
