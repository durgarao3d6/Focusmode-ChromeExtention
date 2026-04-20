// newtab/components/newTabPrompt.js — New Tab Smart Prompt

import { storageGet, storageSet } from '../../utils/storage.js';

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
 * Initialize the New Tab Smart Prompt.
 * Shows after a 300ms delay to let the dashboard render first.
 */
export async function initNewTabPrompt() {
  const modal = document.getElementById('newtab-prompt');
  if (!modal) return;

  // Wait for the focus modal to resolve first — don't show both at once
  const focusModal = document.getElementById('focus-modal');
  if (focusModal && focusModal.classList.contains('visible')) {
    // Wait for focus modal to close, then show prompt
    const observer = new MutationObserver((mutations) => {
      if (!focusModal.classList.contains('visible')) {
        observer.disconnect();
        setTimeout(() => showPrompt(modal), 300);
      }
    });
    observer.observe(focusModal, { attributes: true, attributeFilter: ['class'] });
    return;
  }

  // Show after 300ms delay
  setTimeout(() => showPrompt(modal), 300);
}

/**
 * Show the prompt modal with animation.
 */
function showPrompt(modal) {
  const card = modal.querySelector('.ntp-card');
  const optionsView = modal.querySelector('.ntp-options');
  const newTaskView = modal.querySelector('.ntp-new-task');
  const continueView = modal.querySelector('.ntp-continue');

  // Reset to options view
  optionsView.style.display = 'flex';
  newTaskView.style.display = 'none';
  continueView.style.display = 'none';

  modal.classList.add('visible');

  // Bind handlers
  bindOptions(modal, optionsView, newTaskView, continueView);
}

/**
 * Dismiss the prompt.
 */
function dismissPrompt(modal) {
  modal.classList.remove('visible');
  modal.classList.add('hiding');
  setTimeout(() => modal.classList.remove('hiding'), 400);
}

/**
 * Bind the three option buttons.
 */
function bindOptions(modal, optionsView, newTaskView, continueView) {
  const newTaskBtn = modal.querySelector('#ntp-new-task-btn');
  const continueBtn = modal.querySelector('#ntp-continue-btn');
  const browsingBtn = modal.querySelector('#ntp-browsing-btn');

  // Clone to remove old listeners
  const newBtn = newTaskBtn.cloneNode(true);
  newTaskBtn.parentNode.replaceChild(newBtn, newTaskBtn);
  const contBtn = continueBtn.cloneNode(true);
  continueBtn.parentNode.replaceChild(contBtn, continueBtn);
  const browseBtn = browsingBtn.cloneNode(true);
  browsingBtn.parentNode.replaceChild(browseBtn, browsingBtn);

  // New Task
  newBtn.addEventListener('click', () => {
    optionsView.style.display = 'none';
    newTaskView.style.display = 'block';
    bindNewTaskFlow(modal, newTaskView, optionsView);
  });

  // Continue a Task
  contBtn.addEventListener('click', async () => {
    optionsView.style.display = 'none';
    continueView.style.display = 'block';
    await bindContinueFlow(modal, continueView, optionsView);
  });

  // Just Browsing
  browseBtn.addEventListener('click', () => {
    dismissPrompt(modal);
  });
}

/**
 * New Task flow — inline text input to add a task.
 */
function bindNewTaskFlow(modal, view, optionsView) {
  const input = view.querySelector('#ntp-new-task-input');
  const submitBtn = view.querySelector('#ntp-new-task-submit');
  const backBtn = view.querySelector('#ntp-new-task-back');

  // Clone to remove old listeners
  const newInput = input.cloneNode(true);
  input.parentNode.replaceChild(newInput, input);
  const newSubmit = submitBtn.cloneNode(true);
  submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
  const newBack = backBtn.cloneNode(true);
  backBtn.parentNode.replaceChild(newBack, backBtn);

  newInput.value = '';
  setTimeout(() => newInput.focus(), 100);

  async function addTask() {
    const title = newInput.value.trim();
    if (!title) {
      newInput.classList.add('shake');
      setTimeout(() => newInput.classList.remove('shake'), 500);
      return;
    }

    const { tasks } = await storageGet('tasks');
    const newTask = {
      id: uuid(),
      title,
      createdAt: new Date().toISOString(),
      completedAt: null,
      status: 'active',
      parentId: null
    };

    tasks.push(newTask);
    await storageSet({ tasks });

    // Refresh the task list on the page
    refreshTaskList();

    dismissPrompt(modal);
  }

  newSubmit.addEventListener('click', addTask);
  newInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
    if (e.key === 'Escape') {
      view.style.display = 'none';
      optionsView.style.display = 'flex';
    }
  });

  newBack.addEventListener('click', () => {
    view.style.display = 'none';
    optionsView.style.display = 'flex';
  });
}

/**
 * Continue a Task flow — select from active tasks.
 */
async function bindContinueFlow(modal, view, optionsView) {
  const list = view.querySelector('#ntp-continue-list');
  const backBtn = view.querySelector('#ntp-continue-back');

  const newBack = backBtn.cloneNode(true);
  backBtn.parentNode.replaceChild(newBack, backBtn);

  newBack.addEventListener('click', () => {
    view.style.display = 'none';
    optionsView.style.display = 'flex';
  });

  // Load active tasks
  const { tasks } = await storageGet('tasks');
  const activeTasks = (tasks || []).filter((t) => t.status === 'active').slice(0, 10);

  list.innerHTML = '';

  if (activeTasks.length === 0) {
    list.innerHTML = '<div class="ntp-empty">No active tasks. Add one first!</div>';
    return;
  }

  activeTasks.forEach((task) => {
    const item = document.createElement('button');
    item.className = 'ntp-task-item';
    item.textContent = task.title;
    item.setAttribute('aria-label', `Continue: ${task.title}`);

    item.addEventListener('click', async () => {
      // Store the selected task
      await storageSet({
        newTabSession: {
          promptShownAt: new Date().toISOString(),
          lastTaskId: task.id
        }
      });

      // Highlight the task in the main list
      highlightTask(task.id);

      dismissPrompt(modal);
    });

    list.appendChild(item);
  });
}

/**
 * Highlight a task in the main task list with a glowing border.
 */
function highlightTask(taskId) {
  // Remove any existing highlights
  document.querySelectorAll('.task-item.highlighted').forEach((el) => {
    el.classList.remove('highlighted');
  });

  const taskEl = document.querySelector(`.task-item[data-id="${taskId}"]`);
  if (taskEl) {
    taskEl.classList.add('highlighted');
    taskEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

/**
 * Refresh the task list by re-triggering initTasks.
 * We import dynamically to avoid circular dependency.
 */
async function refreshTaskList() {
  const { initTasks } = await import('./tasks.js');
  await initTasks();
}
