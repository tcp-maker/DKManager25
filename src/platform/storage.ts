import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'dkmanager25_gamestate';

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
      return null;
    }

    return JSON.parse(value);
  } catch (error) {
    console.error('Fejl ved indlæsning af native game state:', error);
    return null;
  }
};

export const saveStoredGameState = async (state: unknown) => {
  const serializedState = JSON.stringify(state);

  try {
    localStorage.setItem(STORAGE_KEY, serializedState);
  } catch (error) {
    console.error('Fejl ved gemning af game state:', error);
  }

  if (!isNativePlatform()) {
    return;
  }

  try {
    await Preferences.set({
      key: STORAGE_KEY,
      value: serializedState,
    });
  } catch (error) {
    console.error('Fejl ved gemning af native game state:', error);
  }
};

export const deleteStoredGameState = async () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Fejl ved sletning af game state:', error);
  }

  if (!isNativePlatform()) {
    return;
  }

  try {
    await Preferences.remove({ key: STORAGE_KEY });
  } catch (error) {
    console.error('Fejl ved sletning af native game state:', error);
  }
};

export const isUsingNativeStorage = () => isNativePlatform();
