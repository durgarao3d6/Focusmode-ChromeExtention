// newtab/components/focus.js — Daily focus question logic

import { todayString, isNewDay } from '../../utils/dateUtils.js';
import { storageGet, storageSet } from '../../utils/storage.js';

/**
 * Initialize the daily focus module.
 * Shows prompt if it is a new day, otherwise shows the stored focus text.
 */
export async function initFocus() {
  const banner = document.getElementById('focus-banner');
  const modal = document.getElementById('focus-modal');
  const input = document.getElementById('focus-input');
  const btn = document.getElementById('focus-submit');

  const { dailyFocus } = await storageGet('dailyFocus');

  if (!dailyFocus || isNewDay(dailyFocus.date) || !dailyFocus.text) {
    // Show prompt
    showFocusPrompt(modal, banner, input, btn);
  } else {
    // Show banner
    displayFocusBanner(banner, dailyFocus.text);
  }
}

function showFocusPrompt(modal, banner, input, btn) {
  modal.classList.add('visible');
  input.focus();

  async function submit() {
    const text = input.value.trim();
    if (!text) {
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
      return;
    }

    const today = todayString();
    await storageSet({ dailyFocus: { date: today, text } });

    modal.classList.remove('visible');
    modal.classList.add('hiding');
    setTimeout(() => modal.classList.remove('hiding'), 400);

    displayFocusBanner(banner, text);
  }

  btn.addEventListener('click', submit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') submit();
  });
}

function displayFocusBanner(banner, text) {
  banner.innerHTML = `
    <span class="focus-label">Today's Focus</span>
    <span class="focus-text">${text}</span>
  `;
  banner.classList.add('visible');
}
