// newtab/components/focusMode.js — Focus Mode toggle and blocking logic

import { storageGet, storageSet } from '../../utils/storage.js';

/**
 * Initialize the Focus Mode toggle on the dashboard.
 */
export async function initFocusMode() {
  const toggle = document.getElementById('focus-mode-toggle');
  const label = document.getElementById('focus-mode-label');
  const indicator = document.getElementById('focus-mode-indicator');
  if (!toggle) return;

  const { focusMode } = await storageGet('focusMode');
  const enabled = focusMode?.enabled ?? false;

  updateToggleUI(toggle, label, indicator, enabled);

  toggle.addEventListener('click', async () => {
    const { focusMode: current } = await storageGet('focusMode');
    const newState = !current.enabled;

    await storageSet({ focusMode: { ...current, enabled: newState } });

    // Send message to service worker to update rules
    chrome.runtime.sendMessage({
      type: 'FOCUS_MODE_CHANGED',
      enabled: newState,
      blockedSites: current.blockedSites || []
    });

    updateToggleUI(toggle, label, indicator, newState);
  });
}

/**
 * Update the toggle button's visual state.
 */
function updateToggleUI(toggle, label, indicator, enabled) {
  if (enabled) {
    toggle.classList.add('active');
    label.textContent = 'Focus Mode: ON';
    indicator.textContent = '🔒';
  } else {
    toggle.classList.remove('active');
    label.textContent = 'Focus Mode';
    indicator.textContent = '🔓';
  }
  toggle.setAttribute('aria-pressed', String(enabled));
}
