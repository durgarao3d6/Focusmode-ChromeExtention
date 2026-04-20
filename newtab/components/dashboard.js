// newtab/components/dashboard.js — Dashboard & Analytics panel

import { storageGet, storageSet } from '../../utils/storage.js';
import { todayString, weekStart } from '../../utils/dateUtils.js';

/**
 * Initialize the dashboard component.
 */
export async function initDashboard() {
  const trigger = document.getElementById('dashboard-trigger');
  const panel = document.getElementById('dashboard-panel');
  const closeBtn = document.getElementById('dashboard-close');
  if (!trigger || !panel) return;

  // Prune old stats on load
  await pruneOldStats();

  trigger.addEventListener('click', () => {
    panel.classList.toggle('open');
    if (panel.classList.contains('open')) {
      renderDashboard();
    }
  });

  closeBtn.addEventListener('click', () => {
    panel.classList.remove('open');
  });
}

/**
 * Render the dashboard content.
 */
async function renderDashboard() {
  const { stats, tasks, dailyFocus } = await storageGet(['stats', 'tasks', 'dailyFocus']);
  const dailyCompleted = stats?.dailyCompleted || {};
  const today = todayString();

  renderDailyView(dailyCompleted, tasks || [], dailyFocus, today);
  renderWeeklyChart(dailyCompleted, today);
}

/**
 * Render the daily summary section.
 */
function renderDailyView(dailyCompleted, tasks, dailyFocus, today) {
  const countEl = document.getElementById('dashboard-today-count');
  const listEl = document.getElementById('dashboard-today-list');
  const focusEl = document.getElementById('dashboard-today-focus');

  const todayCount = dailyCompleted[today] || 0;
  countEl.textContent = todayCount;

  // Today's completed tasks
  const completedToday = tasks.filter((t) => {
    if (t.status !== 'done' || !t.completedAt) return false;
    return t.completedAt.startsWith(today);
  });

  if (completedToday.length > 0) {
    listEl.innerHTML = completedToday.map((t) => {
      const time = new Date(t.completedAt).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit'
      });
      return `<div class="dashboard-task-item">
        <span class="dashboard-task-check">✓</span>
        <span class="dashboard-task-title">${t.title}</span>
        <span class="dashboard-task-time">${time}</span>
      </div>`;
    }).join('');
  } else {
    listEl.innerHTML = '<div class="dashboard-empty">No tasks completed today yet.</div>';
  }

  // Today's focus
  if (dailyFocus?.text && dailyFocus?.date === today) {
    focusEl.innerHTML = `<span class="dashboard-focus-label">Today's Focus</span>
      <span class="dashboard-focus-text">${dailyFocus.text}</span>`;
    focusEl.style.display = 'flex';
  } else {
    focusEl.style.display = 'none';
  }
}

/**
 * Render the weekly bar chart.
 */
function renderWeeklyChart(dailyCompleted, today) {
  const chartEl = document.getElementById('dashboard-weekly-chart');
  const totalEl = document.getElementById('dashboard-weekly-total');

  // Get the last 7 days (Mon → Sun of current week)
  const days = getLast7Days(today);
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const values = days.map((d) => dailyCompleted[d] || 0);
  const maxVal = Math.max(...values, 1); // Avoid division by zero
  const weeklyTotal = values.reduce((sum, v) => sum + v, 0);

  totalEl.textContent = `${weeklyTotal} task${weeklyTotal !== 1 ? 's' : ''} this week`;

  chartEl.innerHTML = days.map((dateStr, i) => {
    const val = values[i];
    const height = Math.max(4, (val / maxVal) * 100); // Min 4% so bar is always visible
    const isToday = dateStr === today;
    const dayOfWeek = new Date(dateStr + 'T00:00:00').getDay();
    const label = dayLabels[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

    return `<div class="dashboard-bar-col ${isToday ? 'today' : ''}">
      <span class="dashboard-bar-value">${val}</span>
      <div class="dashboard-bar" style="height: ${height}%"></div>
      <span class="dashboard-bar-label">${label}</span>
    </div>`;
  }).join('');
}

/**
 * Get the last 7 days as YYYY-MM-DD strings, ending today.
 */
function getLast7Days(today) {
  const days = [];
  const d = new Date(today + 'T00:00:00');
  for (let i = 6; i >= 0; i--) {
    const day = new Date(d);
    day.setDate(d.getDate() - i);
    const y = day.getFullYear();
    const m = String(day.getMonth() + 1).padStart(2, '0');
    const dd = String(day.getDate()).padStart(2, '0');
    days.push(`${y}-${m}-${dd}`);
  }
  return days;
}

/**
 * Prune stats entries older than 90 days to avoid storage bloat.
 */
async function pruneOldStats() {
  const { stats } = await storageGet('stats');
  if (!stats?.dailyCompleted) return;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 90);
  const cutoffStr = cutoff.toISOString().split('T')[0];

  const pruned = {};
  let changed = false;

  for (const [date, count] of Object.entries(stats.dailyCompleted)) {
    if (date >= cutoffStr) {
      pruned[date] = count;
    } else {
      changed = true;
    }
  }

  if (changed) {
    await storageSet({ stats: { ...stats, dailyCompleted: pruned } });
  }
}
