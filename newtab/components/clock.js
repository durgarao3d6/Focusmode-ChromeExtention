// newtab/components/clock.js — Live clock and date display

import { formattedDate } from '../../utils/dateUtils.js';
import { storageGet } from '../../utils/storage.js';

let clockInterval = null;

/**
 * Format the current time based on user preference.
 * @param {'12h'|'24h'} format
 * @returns {string}
 */
function formatTime(format) {
  const now = new Date();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');

  if (format === '12h') {
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m}:${s} <span class="clock-ampm">${ampm}</span>`;
  }
  return `${String(h).padStart(2, '0')}:${m}:${s}`;
}

/**
 * Initialize the clock module.
 */
export async function initClock() {
  const timeEl = document.getElementById('clock-time');
  const dateEl = document.getElementById('clock-date');

  const { user } = await storageGet('user');
  const clockFormat = user?.clockFormat || '12h';

  function tick() {
    timeEl.innerHTML = formatTime(clockFormat);
    dateEl.textContent = formattedDate();
  }

  tick();
  clockInterval = setInterval(tick, 1000);
}

/**
 * Stop clock updates (for cleanup).
 */
export function destroyClock() {
  if (clockInterval) clearInterval(clockInterval);
}
