// newtab/components/shloka.js — Daily shloka display

import { shlokas } from '../../utils/shlokas.js';
import { todayString } from '../../utils/dateUtils.js';
import { storageGet, storageSet } from '../../utils/storage.js';

/**
 * Initialize the shloka component.
 * Rotates to a new shloka index each day.
 */
export async function initShloka() {
  const container = document.getElementById('shloka-card');
  if (!container) return;

  const { shlokaIndex, shlokaLastDate } = await storageGet(['shlokaIndex', 'shlokaLastDate']);
  const today = todayString();

  let index = shlokaIndex ?? 0;

  // Advance index once per day
  if (shlokaLastDate !== today) {
    index = (index + 1) % shlokas.length;
    await storageSet({ shlokaIndex: index, shlokaLastDate: today });
  }

  const shloka = shlokas[index];

  container.innerHTML = `
    <div class="shloka-header">
      <span class="shloka-icon">🕉</span>
      <span class="shloka-ref">Chapter ${shloka.chapter}, Verse ${shloka.verse}</span>
    </div>
    <p class="shloka-sanskrit">${shloka.sanskrit}</p>
    <p class="shloka-transliteration">${shloka.transliteration}</p>
    <p class="shloka-english">"${shloka.english}"</p>
  `;
}
