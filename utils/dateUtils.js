// utils/dateUtils.js — Date helpers

/**
 * Returns today's date in YYYY-MM-DD format.
 */
export function todayString() {
  const d = new Date();
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * Check whether a stored date string is a different day from today.
 * @param {string|null} storedDate  YYYY-MM-DD or null
 * @returns {boolean}
 */
export function isNewDay(storedDate) {
  return storedDate !== todayString();
}

/**
 * Returns the appropriate greeting string based on the current hour.
 */
export function getGreeting() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return 'Good morning';
  if (h >= 12 && h < 17) return 'Good afternoon';
  if (h >= 17 && h < 21) return 'Good evening';
  return 'Good night';
}

/**
 * Returns a long formatted date string, e.g. "Sunday, 19 April 2026".
 */
export function formattedDate() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

/**
 * Returns the start-of-week (Monday) date for a given date.
 * @param {Date} [date]
 * @returns {Date}
 */
export function weekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
