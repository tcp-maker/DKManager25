import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'dkmanager25_gamestate';
let pendingWrite = Promise.resolve();

const isNativePlatform = () => Capacitor.isNativePlatform();

export const loadStoredGameState = (): unknown => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) {
      return null;
    }

    return JSON.parse(saved);
  } catch (error) {
    console.error('Fejl ved indlæsning af game state:', error);
    return null;
  }
};

export const loadNativeStoredGameState = async (): Promise<unknown> => {
  if (!isNativePlatform()) {
    return null;
  }

  try {
    const { value } = await Preferences.get({ key: STORAGE_KEY });

    if (!value) {
      return loadStoredGameState();
    }

    return JSON.parse(value);
  } catch (error) {
    console.error('Fejl ved indlæsning af native game state:', error);
    return loadStoredGameState();
  }
};

export const saveStoredGameState = (state: unknown): Promise<void> => {
  const serializedState = JSON.stringify(state);
  pendingWrite = pendingWrite.catch(() => undefined).then(async () => {
    try {
      if (isNativePlatform()) {
        await Preferences.set({ key: STORAGE_KEY, value: serializedState });
      } else {
        localStorage.setItem(STORAGE_KEY, serializedState);
      }
    } catch (error) {
      console.error('Fejl ved gemning af game state:', error);
      throw error;
    }
  });
  return pendingWrite;
};

export const deleteStoredGameState = (): Promise<void> => {
  pendingWrite = pendingWrite.catch(() => undefined).then(async () => {
    let failure: unknown;
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Fejl ved sletning af game state:', error);
      failure = error;
    }
    if (isNativePlatform()) {
      try {
        await Preferences.remove({ key: STORAGE_KEY });
      } catch (error) {
        console.error('Fejl ved sletning af native game state:', error);
        failure ??= error;
      }
    }
    if (failure !== undefined) {
      throw failure;
    }
  });
  return pendingWrite;
};

export const isUsingNativeStorage = () => isNativePlatform();
