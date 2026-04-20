// newtab/newtab.js — Main controller for the new tab page

import { initStorage, storageGet, storageSet } from '../utils/storage.js';
import { getGreeting } from '../utils/dateUtils.js';
import { initClock } from './components/clock.js';
import { initShloka } from './components/shloka.js';
import { initFocus } from './components/focus.js';
import { initTasks } from './components/tasks.js';
import { initFocusMode } from './components/focusMode.js';
import { initSettings } from './components/settings.js';
import { initDashboard } from './components/dashboard.js';
import { initNewTabPrompt } from './components/newTabPrompt.js';

/**
 * Boot sequence
 */
async function boot() {
  // 1. Ensure storage defaults are in place
  await initStorage();

  // 2. Load user data
  const { user } = await storageGet('user');

  // 3. Set wallpaper
  setWallpaper(user?.wallpaper);

  // 4. Check first-run onboarding
  if (!user?.name) {
    showOnboarding();
    return; // Don't load the rest until name is captured
  }

  // 5. Initialize all components
  await loadDashboard(user.name);
}

/**
 * Set the wallpaper background.
 */
function setWallpaper(customWallpaper) {
  const el = document.getElementById('wallpaper');
  if (customWallpaper) {
    el.style.backgroundImage = `url(${customWallpaper})`;
  } else {
    el.style.backgroundImage = `url('../assets/default-wallpaper.jpg')`;
  }
}

/**
 * Show the first-run onboarding modal.
 */
function showOnboarding() {
  const modal = document.getElementById('onboarding-modal');
  const input = document.getElementById('onboarding-name-input');
  const btn = document.getElementById('onboarding-submit');

  modal.classList.add('visible');

  setTimeout(() => input.focus(), 500);

  async function submit() {
    const name = input.value.trim();
    if (!name) {
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
      return;
    }

    // Save user
    const { user } = await storageGet('user');
    await storageSet({
      user: {
        ...user,
        name,
        createdAt: user?.createdAt || new Date().toISOString()
      }
    });

    // Hide modal
    modal.classList.remove('visible');

    // Now load the dashboard
    await loadDashboard(name);
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
}

/**
 * Initialize all dashboard components after user is set.
 */
async function loadDashboard(name) {
  // Greeting
  const greetingEl = document.getElementById('greeting');
  greetingEl.textContent = `${getGreeting()}, ${name} 👋`;

  // Clock
  await initClock();

  // Shloka
  await initShloka();

  // Focus
  await initFocus();

  // Tasks
  await initTasks();

  // Focus Mode
  await initFocusMode();

  // Settings
  await initSettings();

  // Dashboard
  await initDashboard();

  // New Tab Smart Prompt (last, after everything renders)
  await initNewTabPrompt();
}

// Start
boot();
