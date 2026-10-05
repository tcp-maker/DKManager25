import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../../public/sw.js', import.meta.url), 'utf8');
const origin = 'https://dkmanager.test';
const cacheName = 'dkmanager25-static-test-build';

const createWorker = () => {
  type Event = { request?: Request; respondWith?: (response: Promise<Response>) => void; waitUntil?: (work: Promise<unknown>) => void };
  const handlers: Record<string, (event: Event) => void> = {};
  const entries = new Map<string, Map<string, Response>>([[cacheName, new Map()]]);
  let networkResponse = new Response('new build');
  let offline = false;
  let requests = 0;
  const key = (request: Request | string) => typeof request === 'string' ? new URL(request, origin).href : request.url;
  const open = async (name: string) => {
    if (!entries.has(name)) entries.set(name, new Map());
    const cache = entries.get(name)!;
    return {
      match: async (request: Request | string) => cache.get(key(request))?.clone(),
      put: async (request: Request | string, response: Response) => { cache.set(key(request), response); },
    };
  };
  runInNewContext(source.replace('__BUILD_VERSION__', 'test-build'), {
    self: {
      location: { origin },
      addEventListener: (name: string, handler: (event: Event) => void) => { handlers[name] = handler; },
      clients: { claim: async () => undefined },
    },
    caches: {
      open,
      keys: async () => [...entries.keys()],
      delete: async (name: string) => entries.delete(name),
    },
    fetch: async () => {
      requests += 1;
      if (offline) throw new Error('Offline');
      return networkResponse.clone();
    },
    URL, Request, Response,
  });
  return {
    entries, open,
    setOffline: () => { offline = true; },
    setResponse: (response: Response) => { networkResponse = response; },
    getRequests: () => requests,
    fetch: async (path: string, navigation = false) => {
      const request = new Request(new URL(path, origin));
      if (navigation) Object.defineProperty(request, 'mode', { value: 'navigate' });
      let result: Promise<Response> | undefined;
      handlers.fetch({ request, respondWith: response => { result = response; } });
      return result!;
    },
    activate: async () => {
      let work: Promise<unknown> | undefined;
      handlers.activate({ waitUntil: promise => { work = promise; } });
      await work;
    },
  };
};

describe('service worker cache strategy', () => {
  it('refreshes cached navigations from the network and falls back offline', async () => {
    const worker = createWorker();
    const cache = await worker.open(cacheName);
    await cache.put('/', new Response('old build'));
    assert.equal(await (await worker.fetch('/', true)).text(), 'new build');
    worker.setOffline();
    assert.equal(await (await worker.fetch('/club', true)).text(), 'new build');
  });

  it('uses only the current asset cache and never returns HTML for a missing script', async () => {
    const worker = createWorker();
    const cache = await worker.open(cacheName);
    await cache.put('/assets/current.js', new Response('current asset'));
    await cache.put('/', new Response('HTML'));
    assert.equal(await (await worker.fetch('/assets/current.js')).text(), 'current asset');
    assert.equal(worker.getRequests(), 0);
    const oldCache = await worker.open('dkmanager25-static-old');
    await oldCache.put('/assets/new.js', new Response('stale asset'));
    worker.setResponse(new Response('missing', { status: 404 }));
    assert.equal((await worker.fetch('/assets/new.js')).status, 404);
    assert.equal(await cache.match('/assets/new.js'), undefined);
    worker.setOffline();
    assert.equal((await worker.fetch('/assets/missing.js')).type, 'error');
  });

  it('removes obsolete app caches without deleting unrelated caches', async () => {
    const worker = createWorker();
    await worker.open('dkmanager25-static-v1');
    await worker.open('unrelated-app');
    await worker.activate();
    assert.equal(worker.entries.has('dkmanager25-static-v1'), false);
    assert.equal(worker.entries.has(cacheName), true);
    assert.equal(worker.entries.has('unrelated-app'), true);
  });
});
