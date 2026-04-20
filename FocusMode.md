Here’s a **clear, build-ready PRD** you can hand off to an AI coding agent (or use yourself). I’ll structure it like a real product doc + phased execution so it can be implemented step-by-step without chaos.

---

# 🧠 Product Requirements Document (PRD)

## Product Name: **Diksuchi New Tab (Productivity Dashboard)**

---

## 1. 🎯 Objective

Replace the Chrome new tab with a **personal productivity dashboard** that:

* Drives **daily focus**
* Minimizes distractions
* Tracks **task completion trends**
* Encourages mindful start of the day (via Bhagavad Gita sloka)

---

## 2. 👤 Target User

* Individual productivity-focused users (like you)
* Developers / knowledge workers
* People struggling with distraction (YouTube, Instagram, LinkedIn loops)

---

## 3. 🧩 Core Features

---

### 3.1 🌅 New Tab Dashboard (Home Screen)

**UI Components:**

* Full-screen wallpaper (custom upload)
* Greeting:
  `Good Morning, {Name}`
* Daily **Bhagavad Gita sloka**
* Live clock (HH:mm:ss)
* Daily Focus prompt:

  * Input shown once per day
  * Persisted throughout the day
  * Reset next day

**Behavior:**

* On first open of the day:

  * Prompt: `"What is your main focus today?"`
* Store in local storage with date key
* If already answered → show focus text

---

### 3.2 📝 Task Management

**Features:**

* Add task
* Mark complete
* Delete task

**Task Model:**

```ts
{
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
  completedAt?: Date;
  parentTaskId?: string; // for "part of old task"
}
```

---

### 3.3 🧠 Task Classification Prompt

**On New Tab Open:**

* Ask:

  ```
  Is this:
  [ ] New Task
  [ ] Part of Existing Task
  ```

**If "Part of Existing Task":**

* Show dropdown of existing tasks
* Attach as sub-task (`parentTaskId`)

---

### 3.4 🚫 Focus Mode (Site Blocker)

**Blocked Sites:**

* YouTube
* Instagram
* LinkedIn
* Custom list

**Behavior:**

* When visiting blocked site:

  * Redirect to extension page
  * Show:

    ```
    "Stay focused: {Your Daily Focus}"
    ```

**Implementation:**

* Use Chrome API:

  * `chrome.webRequest`
  * or `declarativeNetRequest`

---

### 3.5 ⚙️ Settings Panel

**Options:**

* Change name
* Upload wallpaper
* Manage blocked sites
* Toggle features

**Storage:**

```ts
{
  name: string;
  wallpaper: base64 | url;
  blockedSites: string[];
}
```

---

### 3.6 📊 Productivity Dashboard

**Metrics:**

* Tasks completed today
* Tasks completed this week

**Views:**

* Daily count
* Weekly trend (bar or simple list)

---

## 4. 🗂️ Data Storage

Use:

* `chrome.storage.local`

**Data Structure:**

```ts
{
  user: {
    name: string;
    wallpaper: string;
  },
  focus: {
    "2026-04-19": "Build Chrome Extension"
  },
  tasks: Task[],
  blockedSites: string[]
}
```

---

## 5. 🏗️ Technical Architecture

### 5.1 Chrome Extension Structure

```
/extension
  ├── manifest.json
  ├── newtab.html
  ├── newtab.tsx (React)
  ├── background.ts
  ├── contentScript.ts
  ├── storage/
  ├── components/
```

---

### 5.2 Manifest (MV3)

```json
{
  "manifest_version": 3,
  "name": "Diksuchi Dashboard",
  "version": "1.0",
  "chrome_url_overrides": {
    "newtab": "newtab.html"
  },
  "permissions": [
    "storage",
    "tabs",
    "declarativeNetRequest"
  ],
  "host_permissions": [
    "*://*.youtube.com/*",
    "*://*.instagram.com/*",
    "*://*.linkedin.com/*"
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

---

## 6. ⚙️ Functional Requirements

---

### FR-1: Daily Focus Logic

* Check today’s date
* If no focus → prompt input
* Save under date key
* Reset next day automatically

---

### FR-2: Task Handling

* CRUD operations
* Maintain completion timestamps
* Support parent-child relation

---

### FR-3: Blocking Logic

* Intercept requests
* Redirect to custom page

---

### FR-4: Sloka Fetching

Option 1:

* Static JSON file (recommended first)

Option 2:

* API (later phase)

---

## 7. 🎨 UI/UX Guidelines

* Minimalist
* Dark overlay on wallpaper
* Large typography
* Keyboard-first interactions
* No clutter

---

## 8. 🚀 Phased Implementation Plan

This is the most important part for your AI agent 👇

---

# 🧱 PHASE 1 — Basic Extension Setup

**Goal:** Replace new tab + show UI

**Tasks:**

* Create manifest.json
* Setup newtab.html
* Render React app
* Show static UI

✅ Deliverable:

* New tab replaced successfully

---

# 🧱 PHASE 2 — Daily Focus System

**Tasks:**

* Input prompt
* Save in storage
* Reset logic by date

✅ Deliverable:

* Focus persists per day

---

# 🧱 PHASE 3 — Wallpaper + Greeting

**Tasks:**

* Upload image
* Save base64
* Apply as background
* Name input

✅ Deliverable:

* Personalized dashboard

---

# 🧱 PHASE 4 — Task Management

**Tasks:**

* Add / delete / complete
* Render list
* Persist tasks

✅ Deliverable:

* Working task manager

---

# 🧱 PHASE 5 — Task Classification

**Tasks:**

* Prompt on tab open
* Link subtasks

✅ Deliverable:

* Structured tasks

---

# 🧱 PHASE 6 — Focus Mode (Blocking)

**Tasks:**

* Setup blocking rules
* Redirect page
* Show focus message

⚠️ Most complex phase

✅ Deliverable:

* Distraction blocker working

---

# 🧱 PHASE 7 — Settings Panel

**Tasks:**

* Modal UI
* Edit name
* Manage block list

---

# 🧱 PHASE 8 — Analytics Dashboard

**Tasks:**

* Count completed tasks
* Weekly grouping

---

# 🧱 PHASE 9 — Gita Sloka Integration

**Tasks:**

* Load daily sloka
* Rotate content

---

# 🧱 PHASE 10 — Polish

**Tasks:**

* Animations
* Keyboard shortcuts
* Performance tuning

---

## 9. 🧪 Edge Cases

* No storage access
* Corrupted data
* Empty task list
* Large wallpaper size
* Timezone mismatch (use IST)

---

## 10. 🔮 Future Enhancements

* Sync across devices
* AI task suggestions
* Pomodoro timer
* Calendar integration
* Streak system

---

## 11. 📦 AI Coding Prompt (Use This)

When you give to AI agent, use:

```
Build a Chrome Extension (Manifest V3) using React + TypeScript.

Phase: <PHASE NAME>

Requirements:
<copy phase requirements>

Constraints:
- Use chrome.storage.local
- Use functional React components
- Use hooks
- Keep code modular

Output:
- Folder structure
- Full code
- Instructions to run
```

---

## 💡 Final Advice (Important)

Don’t try to build everything at once.

Start with:
👉 Phase 1 → 2 → 4 → 6

That alone = **powerful product**

---

If you want next:
I can generate **actual folder structure + starter code (React + MV3 + Webpack)** tailored to your current setup (since you’re already using Webpack + MFE thinking).
