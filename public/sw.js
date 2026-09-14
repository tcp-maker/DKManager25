const CACHE_VERSION = 'dkmanager25-v1';
const APP_SCOPE = self.registration.scope;
const APP_SCOPE_PATH = new URL(APP_SCOPE).pathname;
const APP_SHELL_PATH = APP_SCOPE_PATH;
const STATIC_ASSETS = [
  `${APP_SCOPE_PATH}manifest.webmanifest`,
  `${APP_SCOPE_PATH}icons/icon-192.png`,
  `${APP_SCOPE_PATH}icons/icon-512.png`,
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
      .then(async (cache) => {
        await cache.addAll(STATIC_ASSETS);
        try {
          await cache.add(APP_SHELL_PATH);
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
        .catch(() => caches.match(APP_SHELL_PATH)),
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
