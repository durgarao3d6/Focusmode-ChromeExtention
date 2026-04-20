// background/service-worker.js — Manages declarativeNetRequest dynamic rules for Focus Mode

const RULE_ID_START = 1000;

/**
 * Install handler — sync rules with storage state on install/update.
 */
chrome.runtime.onInstalled.addListener(async () => {
  console.log('FocusTab extension installed.');
  await syncRulesWithStorage();
});

/**
 * Startup handler — sync rules when Chrome starts.
 */
chrome.runtime.onStartup.addListener(async () => {
  await syncRulesWithStorage();
});

/**
 * Message handler — responds to FOCUS_MODE_CHANGED from the new tab page.
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'FOCUS_MODE_CHANGED') {
    handleFocusModeChange(message.enabled, message.blockedSites)
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true; // Keep the message channel open for async response
  }

  if (message.type === 'DISABLE_FOCUS_MODE') {
    disableFocusMode()
      .then(() => sendResponse({ success: true }))
      .catch((err) => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

/**
 * Sync rules with the current storage state.
 * Called on install, startup, and when focus mode changes.
 */
async function syncRulesWithStorage() {
  const data = await chrome.storage.local.get('focusMode');
  const focusMode = data.focusMode || { enabled: false, blockedSites: [] };

  if (focusMode.enabled) {
    await applyBlockingRules(focusMode.blockedSites || []);
  } else {
    await removeAllBlockingRules();
  }
}

/**
 * Handle focus mode toggle.
 * @param {boolean} enabled
 * @param {string[]} blockedSites
 */
async function handleFocusModeChange(enabled, blockedSites) {
  if (enabled) {
    await applyBlockingRules(blockedSites);
  } else {
    await removeAllBlockingRules();
  }
}

/**
 * Disable focus mode from the blocked page.
 */
async function disableFocusMode() {
  const data = await chrome.storage.local.get('focusMode');
  const focusMode = data.focusMode || {};
  focusMode.enabled = false;
  await chrome.storage.local.set({ focusMode });
  await removeAllBlockingRules();
}

/**
 * Apply blocking redirect rules for all specified domains.
 * @param {string[]} domains
 */
async function applyBlockingRules(domains) {
  // First remove existing rules
  await removeAllBlockingRules();

  if (!domains || domains.length === 0) return;

  const rules = domains.map((domain, index) => ({
    id: RULE_ID_START + index,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: {
        extensionPath: `/blocked/blocked.html?site=${encodeURIComponent(domain)}`
      }
    },
    condition: {
      urlFilter: `||${domain}`,
      resourceTypes: ['main_frame']
    }
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    addRules: rules,
    removeRuleIds: []
  });
}

/**
 * Remove all dynamic blocking rules.
 */
async function removeAllBlockingRules() {
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = existingRules.map((r) => r.id);

  if (existingIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingIds,
      addRules: []
    });
  }
}
