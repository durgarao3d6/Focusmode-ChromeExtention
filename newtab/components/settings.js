// newtab/components/settings.js — Settings panel logic

import { storageGet, storageSet } from '../../utils/storage.js';
import { getGreeting } from '../../utils/dateUtils.js';

/**
 * Initialize settings panel.
 */
export async function initSettings() {
  const gear = document.getElementById('settings-gear');
  const panel = document.getElementById('settings-panel');
  const overlay = document.getElementById('settings-overlay');
  const closeBtn = document.getElementById('settings-close');
  if (!gear || !panel) return;

  // Open
  gear.addEventListener('click', () => openSettings(panel, overlay));

  // Close
  closeBtn.addEventListener('click', () => closeSettings(panel, overlay));
  overlay.addEventListener('click', () => closeSettings(panel, overlay));

  // Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel.classList.contains('open')) {
      closeSettings(panel, overlay);
    }
  });
}

function openSettings(panel, overlay) {
  populateSettings();
  panel.classList.add('open');
  overlay.classList.add('visible');
}

function closeSettings(panel, overlay) {
  panel.classList.remove('open');
  overlay.classList.remove('visible');
}

/**
 * Populate settings fields with current values and bind handlers.
 */
async function populateSettings() {
  const { user, focusMode } = await storageGet(['user', 'focusMode']);

  // ── Section A: Profile ──
  const nameInput = document.getElementById('settings-name');
  const nameSaveBtn = document.getElementById('settings-name-save');
  nameInput.value = user?.name || '';

  // Remove old listeners by cloning
  const newNameSave = nameSaveBtn.cloneNode(true);
  nameSaveBtn.parentNode.replaceChild(newNameSave, nameSaveBtn);

  newNameSave.addEventListener('click', async () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const { user: u } = await storageGet('user');
    await storageSet({ user: { ...u, name } });
    document.getElementById('greeting').textContent = `${getGreeting()}, ${name} 👋`;
    showToast('Name updated');
  });

  // ── Section D: Clock Format ──
  const clock12 = document.getElementById('settings-clock-12');
  const clock24 = document.getElementById('settings-clock-24');
  const currentFormat = user?.clockFormat || '12h';
  clock12.classList.toggle('active', currentFormat === '12h');
  clock24.classList.toggle('active', currentFormat === '24h');

  const newClock12 = clock12.cloneNode(true);
  const newClock24 = clock24.cloneNode(true);
  clock12.parentNode.replaceChild(newClock12, clock12);
  clock24.parentNode.replaceChild(newClock24, clock24);

  newClock12.addEventListener('click', () => saveClockFormat('12h', newClock12, newClock24));
  newClock24.addEventListener('click', () => saveClockFormat('24h', newClock24, newClock12));

  // ── Section B: Wallpaper ──
  const fileInput = document.getElementById('settings-wallpaper-input');
  const useDefaultBtn = document.getElementById('settings-wallpaper-default');
  const preview = document.getElementById('settings-wallpaper-preview');

  // Show current preview
  if (user?.wallpaper) {
    preview.style.backgroundImage = `url(${user.wallpaper})`;
    preview.classList.add('has-image');
  } else {
    preview.style.backgroundImage = `url('../assets/default-wallpaper.jpg')`;
    preview.classList.remove('has-image');
  }

  const newFileInput = fileInput.cloneNode(true);
  fileInput.parentNode.replaceChild(newFileInput, fileInput);

  newFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image too large (max 5MB)', 'warn');
      return;
    }

    try {
      const base64 = await compressAndEncode(file, 1920);
      const { user: u } = await storageGet('user');
      await storageSet({ user: { ...u, wallpaper: base64 } });
      document.getElementById('wallpaper').style.backgroundImage = `url(${base64})`;
      preview.style.backgroundImage = `url(${base64})`;
      preview.classList.add('has-image');
      showToast('Wallpaper updated');
    } catch (err) {
      showToast('Failed to process image', 'warn');
    }
  });

  const newDefaultBtn = useDefaultBtn.cloneNode(true);
  useDefaultBtn.parentNode.replaceChild(newDefaultBtn, useDefaultBtn);

  newDefaultBtn.addEventListener('click', async () => {
    const { user: u } = await storageGet('user');
    await storageSet({ user: { ...u, wallpaper: null } });
    document.getElementById('wallpaper').style.backgroundImage = `url('../assets/default-wallpaper.jpg')`;
    preview.style.backgroundImage = `url('../assets/default-wallpaper.jpg')`;
    preview.classList.remove('has-image');
    showToast('Wallpaper reset to default');
  });

  // ── Section C: Blocked Sites ──
  renderBlockedSites(focusMode);

  // ── Section E: Danger Zone ──
  const clearTasksBtn = document.getElementById('settings-clear-tasks');
  const resetAllBtn = document.getElementById('settings-reset-all');

  const newClearTasks = clearTasksBtn.cloneNode(true);
  clearTasksBtn.parentNode.replaceChild(newClearTasks, clearTasksBtn);

  const newResetAll = resetAllBtn.cloneNode(true);
  resetAllBtn.parentNode.replaceChild(newResetAll, resetAllBtn);

  newClearTasks.addEventListener('click', () => showConfirm(
    'Clear all tasks? This cannot be undone.',
    async () => {
      await storageSet({ tasks: [], stats: { dailyCompleted: {} } });
      // Re-render tasks if initTasks is available
      const taskList = document.querySelector('.tasks-list');
      if (taskList) {
        taskList.innerHTML = '<div class="tasks-empty">No tasks yet. Add one above!</div>';
      }
      showToast('All tasks cleared');
    }
  ));

  newResetAll.addEventListener('click', () => showConfirm(
    'Reset ALL settings? Name, wallpaper, tasks, stats — everything will be erased.',
    async () => {
      await chrome.storage.local.clear();
      window.location.reload();
    }
  ));
}

/**
 * Save clock format preference.
 */
async function saveClockFormat(format, activeBtn, inactiveBtn) {
  const { user } = await storageGet('user');
  await storageSet({ user: { ...user, clockFormat: format } });
  activeBtn.classList.add('active');
  inactiveBtn.classList.remove('active');
  showToast(`Clock set to ${format === '12h' ? '12-hour' : '24-hour'}`);
}

/**
 * Render the blocked sites list with add/remove functionality.
 */
async function renderBlockedSites(focusModeData) {
  const fm = focusModeData || (await storageGet('focusMode')).focusMode || {};
  const list = document.getElementById('settings-blocklist');
  const addInput = document.getElementById('settings-block-input');
  const addBtn = document.getElementById('settings-block-add');

  list.innerHTML = '';

  (fm.blockedSites || []).forEach((domain) => {
    const item = document.createElement('div');
    item.className = 'settings-blocklist-item';
    item.innerHTML = `
      <span class="settings-blocklist-domain">${domain}</span>
      <button class="settings-blocklist-remove" aria-label="Remove ${domain}">×</button>
    `;
    item.querySelector('.settings-blocklist-remove').addEventListener('click', async () => {
      await removeSite(domain);
    });
    list.appendChild(item);
  });

  // Add site
  const newAddBtn = addBtn.cloneNode(true);
  addBtn.parentNode.replaceChild(newAddBtn, addBtn);

  const newAddInput = addInput.cloneNode(true);
  addInput.parentNode.replaceChild(newAddInput, addInput);

  async function addSite() {
    let domain = newAddInput.value.trim();
    if (!domain) return;

    // Clean domain
    domain = domain.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/.*$/, '').toLowerCase();
    if (!domain) return;

    const { focusMode: current } = await storageGet('focusMode');
    if (current.blockedSites.includes(domain)) {
      showToast('Site already in list', 'warn');
      return;
    }

    current.blockedSites.push(domain);
    await storageSet({ focusMode: current });

    // If focus mode is on, update rules
    if (current.enabled) {
      chrome.runtime.sendMessage({
        type: 'FOCUS_MODE_CHANGED',
        enabled: true,
        blockedSites: current.blockedSites
      });
    }

    newAddInput.value = '';
    renderBlockedSites(current);
    showToast(`${domain} added`);
  }

  newAddBtn.addEventListener('click', addSite);
  newAddInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite();
  });
}

/**
 * Remove a site from the blocklist.
 */
async function removeSite(domain) {
  const { focusMode: current } = await storageGet('focusMode');
  current.blockedSites = current.blockedSites.filter((s) => s !== domain);
  await storageSet({ focusMode: current });

  // If focus mode is on, update rules
  if (current.enabled) {
    chrome.runtime.sendMessage({
      type: 'FOCUS_MODE_CHANGED',
      enabled: true,
      blockedSites: current.blockedSites
    });
  }

  renderBlockedSites(current);
  showToast(`${domain} removed`);
}

/**
 * Compress an image file to a max width and return base64 string.
 */
function compressAndEncode(file, maxWidth) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;

        if (w > maxWidth) {
          h = (maxWidth / w) * h;
          w = maxWidth;
        }

        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);

        const base64 = canvas.toDataURL('image/jpeg', 0.85);
        resolve(base64);
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Show a small toast notification.
 */
function showToast(message, type = 'info') {
  // Remove existing toast
  const existing = document.querySelector('.settings-toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = `settings-toast settings-toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('visible'));
  setTimeout(() => {
    toast.classList.remove('visible');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

/**
 * Show a confirm dialog.
 */
function showConfirm(message, onConfirm) {
  const existing = document.getElementById('settings-confirm-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'settings-confirm-modal';
  modal.className = 'settings-confirm-overlay';
  modal.innerHTML = `
    <div class="settings-confirm-card">
      <p>${message}</p>
      <div class="settings-confirm-actions">
        <button class="settings-confirm-cancel">Cancel</button>
        <button class="settings-confirm-yes">Yes, do it</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  requestAnimationFrame(() => modal.classList.add('visible'));

  modal.querySelector('.settings-confirm-cancel').addEventListener('click', () => {
    modal.classList.remove('visible');
    setTimeout(() => modal.remove(), 300);
  });

  modal.querySelector('.settings-confirm-yes').addEventListener('click', async () => {
    await onConfirm();
    modal.classList.remove('visible');
    setTimeout(() => modal.remove(), 300);
  });
}
