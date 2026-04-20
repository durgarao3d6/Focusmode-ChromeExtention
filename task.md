# FocusTab Development Tasks

This document outlines the systematic development tasks for building the FocusTab Chrome Extension, following the phases defined in `FocusTab_PRD.md`.

## Phase 1 — Core Shell
**Goal:** Replace the new tab page with a personal productivity dashboard including wallpaper, greeting, live clock, shloka, and daily focus question.

- [x] **1.1 Extension Setup**
  - Initialize the project structure: `manifest.json`, `newtab/`, `blocked/`, `background/`, `assets/`, and `utils/`.
  - Configure Manifest V3 with necessary permissions (`storage`, `declarativeNetRequest`, `declarativeNetRequestWithHostAccess`, `chrome_url_overrides`, `host_permissions`).
- [x] **1.2 Core Layout & Wallpaper**
  - Implement `newtab.html` and `newtab.css`.
  - Load the default high-quality background (`assets/default-wallpaper.jpg`).
  - Read from `chrome.storage.local` to override the background if a custom wallpaper (`user.wallpaper`) is set.
- [x] **1.3 First-Run Onboarding**
  - Check for `user.name` in storage on load.
  - If null, show a first-run modal prompting for the user's name and save it.
- [x] **1.4 Clock & Greeting**
  - Implement a live ticking clock (updating every second) using `requestAnimationFrame` or `setInterval` (`newtab/components/clock.js`).
  - Implement a time-based greeting using `user.name` (Good morning, Good afternoon, etc.).
- [x] **1.5 Daily Geetha Shloka**
  - Populate `utils/shlokas.js` with Shloka data.
  - Add logic to read `shlokaIndex` and rotate it once per day.
  - Display the Sanskrit phrase and English translation on the dashboard.
- [x] **1.6 Daily Focus Question**
  - Check `dailyFocus.date` against the current date.
  - If new day or missing, prompt "What is your main focus today?".
  - Save to storage and display the set focus text prominently all day.

## Phase 2 — Task System
**Goal:** A lightweight, persistent task list embedded directly in the dashboard.

- [x] **2.1 Task UI Construction**
  - Build the right-side or bottom panel for tasks.
  - Add text input with an "Add" button (triggerable via Enter key).
- [x] **2.2 Task Persistence & Rendering**
  - Load and render tasks from `chrome.storage.local`.
  - Save new tasks to storage (`id`, `title`, `createdAt`, `status: 'active'`).
- [x] **2.3 Completing & Deleting Tasks**
  - Implement checkbox to mark task as done (update `completedAt`, visually strikethrough).
  - On task complete, increment `stats.dailyCompleted[today]` counter.
  - Implement hover-delete button to completely remove a task from the array.
- [x] **2.4 Task Sectioning**
  - Group and display active tasks first, followed by completed tasks under a visually distinct section or divider.

## Phase 3 — Focus Mode (Site Blocker)
**Goal:** A toggle that blocks distracting websites using background rules and displays a focus redirect page.

- [x] **3.1 Focus Mode Toggle UI**
  - Add "Focus Mode" toggle switch on the new tab dashboard indicating active/inactive states.
  - Persist toggle state (`focusMode.enabled`) in storage.
- [x] **3.2 Redirection Logic (Service Worker)**
  - Implement `background/service-worker.js`.
  - Generate and inject `chrome.declarativeNetRequest` dynamic rules for target domains when enabled.
  - Remove all dynamic rules when Focus Mode is disabled.
- [x] **3.3 Blocked Redirection Page**
  - Build `blocked/blocked.html` matching the dashboard aesthetic.
  - Display the blocked domain and remind the user of their current "Focus" text.
  - Provide a "Disable Focus Mode" button to instantly drop rules and return.

## Phase 4 — Settings Panel
**Goal:** A sliding settings drawer for holistic dashboard customization.

- [x] **4.1 Settings Shell & Profile Settings**
  - Add a gear `⚙` icon and a slide-in drawer layout (`newtab/components/settings.js`).
  - Add input field to update `user.name` which reflects on the greeting instantly.
  - Add toggle for Clock Format (12-hour vs 24-hour).
- [x] **4.2 Custom Wallpaper Upload**
  - Add file input for uploading an image (`accept="image/*"`).
  - Compress image to max 1920px width and base64-encode it (warn if > 5MB).
  - Add "Use Default" button to clear custom wallpaper.
- [x] **4.3 Blocklist Configuration**
  - Display list of current blocked sites.
  - Input field to add new sites (clean logic to strip `https://` / `www.`).
  - Ability to delete individual domains, instantly refreshing the service worker's dynamic rules if Focus Mode is active.
- [x] **4.4 Danger Zone**
  - Add confirmation-backed "Clear all tasks" and "Reset all settings" buttons.

## Phase 5 — Dashboard & Analytics
**Goal:** A visual summary of task completion natively placed in the dashboard.

- [x] **5.1 Analytics Shell & Daily View**
  - Add a dashboard trigger icon.
  - Build panel showing today's date, total tasks completed today, and a list of today's completed tasks.
- [x] **5.2 Weekly Bar Chart View**
  - Read `stats.dailyCompleted` for last 7 days.
  - Generate a bar chart visualization showing task velocity over the week.
- [x] **5.3 Data Cleanup Job**
  - Incorporate logic on extension boot to prune `stats.dailyCompleted` records older than 90 days.

## Phase 6 — New Tab Smart Prompt
**Goal:** Micro-intentionality prompt capturing focus immediately on opening a new tab.

- [x] **6.1 Prompt Trigger Logic**
  - Implement check in `newtab.js`: if a new tab is opened, display the Smart Prompt overlay dynamically.
- [x] **6.2 Three-Option UI**
  - Option 1: "New Task" (reveals inline input -> saves to `tasks` array -> sets active).
  - Option 2: "Continue a Task" (shows list of incomplete tasks -> user selects one).
  - Option 3: "Just Browsing" (closes modal instantly).
- [x] **6.3 Integration & Polish**
  - If a task is selected/added, immediately reflect it in the Task Panel on the right side.
  - Apply glowing border CSS animation to the actively continued task.
- [x] **6.4 "Just Browsing" Flow**
  - Skips tracking for this exact session without persisting any state.
