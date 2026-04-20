// utils/storage.js — Wrapper around chrome.storage.local

const DEFAULTS = {
  user: {
    name: null,
    wallpaper: null,
    clockFormat: '12h',
    createdAt: new Date().toISOString()
  },
  dailyFocus: {
    date: null,
    text: ''
  },
  tasks: [],
  focusMode: {
    enabled: false,
    blockedSites: [
      'instagram.com',
      'youtube.com',
      'linkedin.com',
      'twitter.com',
      'x.com',
      'facebook.com',
      'reddit.com',
      'tiktok.com'
    ]
  },
  stats: {
    dailyCompleted: {}
  },
  newTabSession: {
    promptShownAt: null,
    lastTaskId: null
  },
  shlokaIndex: 0,
  shlokaLastDate: null
};

/**
 * Retrieve one or more keys from storage.
 * @param {string|string[]} keys
 * @returns {Promise<object>}
 */
export function storageGet(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result));
  });
}

/**
 * Save key-value pairs to storage.
 * @param {object} data
 * @returns {Promise<void>}
 */
export function storageSet(data) {
  return new Promise((resolve) => {
    chrome.storage.local.set(data, () => resolve());
  });
}

/**
 * Remove keys from storage.
 * @param {string|string[]} keys
 * @returns {Promise<void>}
 */
export function storageRemove(keys) {
  return new Promise((resolve) => {
    chrome.storage.local.remove(keys, () => resolve());
  });
}

/**
 * Initialize storage with defaults if keys are missing.
 * Called once on first extension load.
 */
export async function initStorage() {
  const all = await storageGet(Object.keys(DEFAULTS));
  const toSet = {};

  for (const [key, defaultVal] of Object.entries(DEFAULTS)) {
    if (all[key] === undefined) {
      toSet[key] = defaultVal;
    }
  }

  if (Object.keys(toSet).length > 0) {
    await storageSet(toSet);
  }
}
