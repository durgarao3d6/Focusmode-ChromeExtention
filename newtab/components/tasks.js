// newtab/components/tasks.js — Lightweight task list system

import { storageGet, storageSet } from '../../utils/storage.js';
import { todayString } from '../../utils/dateUtils.js';

/**
 * Generate a UUID v4 string.
 */
function uuid() {
  return crypto.randomUUID?.() ??
    'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
}

/**
 * Initialize the task system.
 */
export async function initTasks() {
  const container = document.getElementById('tasks-panel');
  if (!container) return;

  let { tasks } = await storageGet('tasks');
  tasks = tasks || [];

  render(container, tasks);
  bindAddTask(container, tasks);
}

/**
 * Persist the current tasks array to storage.
 */
async function saveTasks(tasks) {
  await storageSet({ tasks });
}

/**
 * Update the daily completed stat counter.
 * @param {number} delta — +1 or -1
 */
async function updateDailyStat(delta) {
  const { stats } = await storageGet('stats');
  const today = todayString();
  const dailyCompleted = stats?.dailyCompleted || {};
  dailyCompleted[today] = Math.max(0, (dailyCompleted[today] || 0) + delta);
  await storageSet({ stats: { ...stats, dailyCompleted } });
}

/**
 * Render the full task list into the container.
 */
function render(container, tasks) {
  const activeTasks = tasks.filter((t) => t.status === 'active');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const listEl = container.querySelector('.tasks-list');
  listEl.innerHTML = '';

  // Active tasks
  activeTasks.forEach((task) => {
    listEl.appendChild(createTaskItem(container, tasks, task));
  });

  // Completed divider + done tasks
  if (doneTasks.length > 0) {
    const divider = document.createElement('div');
    divider.className = 'tasks-divider';
    divider.innerHTML = `<span>Completed</span><span class="tasks-divider-count">${doneTasks.length}</span>`;
    listEl.appendChild(divider);

    doneTasks.forEach((task) => {
      listEl.appendChild(createTaskItem(container, tasks, task));
    });
  }

  // Empty state
  if (tasks.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'tasks-empty';
    empty.textContent = 'No tasks yet. Add one above!';
    listEl.appendChild(empty);
  }
}

/**
 * Create a single task DOM element.
 */
function createTaskItem(container, tasks, task) {
  const item = document.createElement('div');
  item.className = `task-item ${task.status === 'done' ? 'task-done' : ''}`;
  item.dataset.id = task.id;

  // Checkbox
  const checkbox = document.createElement('button');
  checkbox.className = 'task-checkbox';
  checkbox.setAttribute('aria-label', task.status === 'done' ? 'Undo task' : 'Complete task');
  checkbox.innerHTML = task.status === 'done'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6L9 17l-5-5"/></svg>'
    : '';

  checkbox.addEventListener('click', async () => {
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx === -1) return;

    if (tasks[idx].status === 'active') {
      tasks[idx].status = 'done';
      tasks[idx].completedAt = new Date().toISOString();
      await updateDailyStat(1);
    } else {
      tasks[idx].status = 'active';
      tasks[idx].completedAt = null;
      await updateDailyStat(-1);
    }

    await saveTasks(tasks);
    render(container, tasks);
  });

  // Title
  const title = document.createElement('span');
  title.className = 'task-title';
  title.textContent = task.title;

  // Delete button
  const del = document.createElement('button');
  del.className = 'task-delete';
  del.setAttribute('aria-label', 'Delete task');
  del.innerHTML = '×';

  del.addEventListener('click', async () => {
    const idx = tasks.findIndex((t) => t.id === task.id);
    if (idx === -1) return;

    // If task was done, decrement today's stat
    if (tasks[idx].status === 'done') {
      await updateDailyStat(-1);
    }

    tasks.splice(idx, 1);
    await saveTasks(tasks);
    render(container, tasks);
  });

  item.appendChild(checkbox);
  item.appendChild(title);
  item.appendChild(del);

  return item;
}

/**
 * Bind the add-task input and button.
 */
function bindAddTask(container, tasks) {
  const input = container.querySelector('#task-input');
  const addBtn = container.querySelector('#task-add-btn');

  async function addTask() {
    const title = input.value.trim();
    if (!title) {
      input.classList.add('shake');
      setTimeout(() => input.classList.remove('shake'), 500);
      return;
    }

    const newTask = {
      id: uuid(),
      title,
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'active',
      parentId: null
    };

    tasks.push(newTask);
    await saveTasks(tasks);
    input.value = '';
    render(container, tasks);

    // Scroll list to show the new task
    const listEl = container.querySelector('.tasks-list');
    listEl.scrollTop = 0;
  }

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
  });
}
