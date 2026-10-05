import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import { Capacitor } from '@capacitor/core';

const storageDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalIsNative = Capacitor.isNativePlatform;
const runtime = Capacitor as typeof Capacitor & {
  PluginHeaders: Array<{ name: string; methods: Array<{ name: string; rtype: string }> }>;
  nativePromise: (plugin: string, method: string, options: { key: string; value?: string }) => Promise<unknown>;
};
const originalHeaders = runtime.PluginHeaders;
const originalNativePromise = runtime.nativePromise;
let native = false;
let browserValue: string | null = null;
let nativeValue: string | null = null;
const calls: string[] = [];
let storage: typeof import('../platform/storage');
let releaseWrite: (() => void) | undefined;
let failBrowserWrite = false;

before(async () => {
  Capacitor.isNativePlatform = () => native;
  runtime.PluginHeaders = [{
    name: 'Preferences',
    methods: ['get', 'set', 'remove'].map(name => ({ name, rtype: 'promise' })),
  }];
  runtime.nativePromise = async (plugin, method, options) => {
    assert.equal(plugin, 'Preferences');
    assert.equal(options.key, 'dkmanager25_gamestate');
    calls.push(method);
    if (method === 'get') return { value: nativeValue };
    if (method === 'set') {
      if (releaseWrite) await new Promise<void>(resolve => { releaseWrite = resolve; });
      nativeValue = options.value!;
    }
    if (method === 'remove') nativeValue = null;
    return {};
  };
  Object.defineProperty(globalThis, 'localStorage', {
    configurable: true,
    value: {
      getItem: () => browserValue,
      setItem: (_key: string, value: string) => {
        if (failBrowserWrite) {
          failBrowserWrite = false;
          throw new Error('Storage full');
        }
        browserValue = value;
      },
      removeItem: () => { browserValue = null; },
    },
  });
  storage = await import('../platform/storage');
});

after(() => {
  Capacitor.isNativePlatform = originalIsNative;
  runtime.PluginHeaders = originalHeaders;
  runtime.nativePromise = originalNativePromise;
  if (storageDescriptor) Object.defineProperty(globalThis, 'localStorage', storageDescriptor);
  else Reflect.deleteProperty(globalThis, 'localStorage');
});

describe('platform save storage', () => {
  it('uses localStorage on web without calling Preferences', async () => {
    native = false;
    await storage.saveStoredGameState({ budget: 123 });
    assert.deepEqual(storage.loadStoredGameState(), { budget: 123 });
    assert.equal(await storage.loadNativeStoredGameState(), null);
    await storage.deleteStoredGameState();
    assert.equal(browserValue, null);
    assert.deepEqual(calls, []);
  });

  it('loads native saves first and migrates legacy browser-only saves', async () => {
    native = true;
    browserValue = JSON.stringify({ budget: 111 });
    nativeValue = JSON.stringify({ budget: 222 });
    assert.deepEqual(await storage.loadNativeStoredGameState(), { budget: 222 });
    nativeValue = null;
    assert.deepEqual(await storage.loadNativeStoredGameState(), { budget: 111 });
    await storage.saveStoredGameState({ budget: 333 });
    assert.equal(nativeValue, JSON.stringify({ budget: 333 }));
    assert.equal(browserValue, JSON.stringify({ budget: 111 }));
  });

  it('orders pending native saves, reset and subsequent saves without resurrecting old state', async () => {
    native = true;
    const offset = calls.length;
    releaseWrite = () => undefined;
    const first = storage.saveStoredGameState({ budget: 1 });
    await new Promise(resolve => setTimeout(resolve, 0));
    const reset = storage.deleteStoredGameState();
    const last = storage.saveStoredGameState({ budget: 2 });
    const release = releaseWrite;
    releaseWrite = undefined;
    release();
    await Promise.all([first, reset, last]);
    assert.deepEqual(calls.slice(offset), ['set', 'remove', 'set']);
    assert.equal(nativeValue, JSON.stringify({ budget: 2 }));
    assert.equal(browserValue, null);
    await storage.deleteStoredGameState();
    assert.equal(nativeValue, null);
  });

  it('reports failed writes and keeps the save queue usable afterward', async () => {
    native = false;
    failBrowserWrite = true;
    await assert.rejects(storage.saveStoredGameState({ budget: 1 }), /Storage full/);
    await storage.saveStoredGameState({ budget: 2 });
    assert.equal(browserValue, JSON.stringify({ budget: 2 }));
  });
});
