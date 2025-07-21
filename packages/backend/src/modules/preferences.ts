import { Network } from '../types/electrum';

export interface Preferences {
  gapLimitReceive: number;
  gapLimitChange: number;
  locale: string;
  fiatCurrency: string;
  activeAccountIndex: number;
  activeNetwork: Network;
}

export const defaultPreferences: Preferences = {
  gapLimitReceive: 500,
  gapLimitChange: 20,
  locale: 'en',
  fiatCurrency: 'USD',
  activeAccountIndex: -1,
  activeNetwork: Network.Mainnet,
};

const STORAGE_KEY = 'preferences';

/**
 * Load preferences from chrome.storage.local.
 * If none are stored yet, write the defaults back to storage.
 */
export async function loadPreferences(): Promise<Preferences> {
  const result = await new Promise<{ [key: string]: Preferences | undefined }>(resolve => {
    chrome.storage.local.get(STORAGE_KEY, resolve);
  });

  if (result[STORAGE_KEY] === undefined) {
    // If no persisted value, save the defaults for next time
    await savePreferences(defaultPreferences);
    return defaultPreferences;
  }

  return result[STORAGE_KEY] as Preferences;
}

/**
 * Save the given preferences object to chrome.storage.local.
 */
export function savePreferences(preferences: Preferences): Promise<void> {
  return new Promise(resolve => {
    chrome.storage.local.set({ [STORAGE_KEY]: preferences }, () => resolve(preferences));
  });
}

/**
 * Update one or more preference fields, persist the new object,
 * and return the updated preferences.
 */
export async function updatePreferences(updates: Partial<Preferences>): Promise<Preferences> {
  const current = await loadPreferences();
  const updated: Preferences = { ...current, ...updates };
  await savePreferences(updated);
  return updated;
}
