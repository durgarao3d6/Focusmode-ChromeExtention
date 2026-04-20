# FocusTab — Personal Productivity Dashboard
## Product Requirements Document (PRD)
**Version:** 1.0  
**Target:** Chrome Extension (Manifest V3)  
**Audience:** AI Coding Assistant / Developer  

---

## Table of Contents
1. [Product Overview](#1-product-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Data Models](#3-data-models)
4. [Phase Breakdown](#4-phase-breakdown)
5. [Phase 1 — Core Shell](#phase-1--core-shell)
6. [Phase 2 — Task System](#phase-2--task-system)
7. [Phase 3 — Focus Mode (Site Blocker)](#phase-3--focus-mode-site-blocker)
8. [Phase 4 — Settings Panel](#phase-4--settings-panel)
9. [Phase 5 — Dashboard & Analytics](#phase-5--dashboard--analytics)
10. [Phase 6 — New Tab Smart Prompt](#phase-6--new-tab-smart-prompt)
11. [UX Flows & Wireframe Notes](#7-ux-flows--wireframe-notes)
12. [Non-Functional Requirements](#8-non-functional-requirements)
13. [Acceptance Criteria Summary](#9-acceptance-criteria-summary)

---

## 1. Product Overview

**FocusTab** replaces Chrome's New Tab page with a personal productivity dashboard. Every new tab becomes a moment of intentionality — greeting the user, displaying their daily focus, managing tasks, and blocking distractions.

### Core Value Pillars
| Pillar | What it does |
|--------|--------------|
| **Presence** | Full-screen wallpaper, live clock, Sanskrit Geetha shloka — grounds the user each morning |
| **Clarity** | One main focus question per day — surfaces the user's priority |
| **Action** | Lightweight task list — add, complete, delete |
| **Protection** | Focus Mode — blocks distracting sites and shows the user's own focus message |
| **Reflection** | Weekly/daily dashboard — visual progress on tasks completed |
| **Intention** | New-tab prompt — asks whether the new tab is for a new task or continuing old work |

---

## 2. Technical Architecture

### Extension Structure
```
focustab/
├── manifest.json           # MV3 manifest
├── newtab/
│   ├── newtab.html         # New Tab page entry point
│   ├── newtab.js           # Main controller
│   ├── newtab.css          # Styles
│   └── components/
│       ├── clock.js
│       ├── shloka.js
│       ├── focus.js
│       ├── tasks.js
│       ├── dashboard.js
│       ├── settings.js
│       └── newTabPrompt.js
├── blocked/
│   ├── blocked.html        # Page shown when a site is blocked
│   ├── blocked.js
│   └── blocked.css
├── background/
│   └── service-worker.js   # Handles declarativeNetRequest rules
├── assets/
│   ├── default-wallpaper.jpg
│   └── icons/
│       ├── icon16.png
│       ├── icon48.png
│       └── icon128.png
└── utils/
    ├── storage.js          # Wrapper around chrome.storage.local
    ├── dateUtils.js        # Date helpers (isNewDay, weekStart, etc.)
    └── shlokas.js          # Array of 365 Bhagavad Gita shlokas
```

### Storage Strategy
- **chrome.storage.local** — all user data (tasks, settings, wallpaper as base64, focus, stats)
- **chrome.declarativeNetRequest** — dynamic rules for site blocking
- No external server. Everything is local-first and offline-capable.

### Manifest V3 Permissions Required
```json
{
  "permissions": [
    "storage",
    "declarativeNetRequest",
    "declarativeNetRequestWithHostAccess"
  ],
  "host_permissions": ["<all_urls>"],
  "chrome_url_overrides": { "newtab": "newtab/newtab.html" },
  "background": { "service_worker": "background/service-worker.js" }
}
```

---

## 3. Data Models

All stored in `chrome.storage.local`. Below is the full schema.

### 3.1 User Profile
```json
{
  "user": {
    "name": "string",                  // e.g. "Priya"
    "wallpaper": "string|null",        // base64 encoded image or null (use default)
    "createdAt": "ISO8601 string"
  }
}
```

### 3.2 Daily Focus
```json
{
  "dailyFocus": {
    "date": "YYYY-MM-DD",             // The date this focus was set
    "text": "string"                   // The user's focus answer
  }
}
```
**Reset rule:** If `date !== today`, prompt for new focus and reset.

### 3.3 Tasks
```json
{
  "tasks": [
    {
      "id": "uuid-string",
      "title": "string",
      "createdAt": "ISO8601",
      "completedAt": "ISO8601|null",
      "status": "active | done",
      "parentId": "uuid|null"           // Links to a parent task if "part of old task"
    }
  ]
}
```

### 3.4 Focus Mode
```json
{
  "focusMode": {
    "enabled": false,
    "blockedSites": [                  // User-managed list
      "instagram.com",
      "youtube.com",
      "linkedin.com",
      "twitter.com",
      "facebook.com",
      "reddit.com",
      "tiktok.com"
    ]
  }
}
```

### 3.5 Statistics (for Dashboard)
```json
{
  "stats": {
    "dailyCompleted": {
      "YYYY-MM-DD": 3,                 // Number of tasks completed on that date
      "YYYY-MM-DD": 5
    }
  }
}
```

### 3.6 New Tab Session State
```json
{
  "newTabSession": {
    "promptShownAt": "ISO8601|null",   // Last time the prompt was shown
    "lastTaskId": "uuid|null"          // The task user chose to continue
  }
}
```

### 3.7 Shlokas Index
```json
{
  "shlokaIndex": 0                    // Increments daily (mod total shlokas)
}
```

---

## 4. Phase Breakdown

| Phase | Feature Area | Depends On |
|-------|-------------|------------|
| 1 | Core Shell (wallpaper, greeting, clock, shloka, focus question) | — |
| 2 | Task System (add, done, delete) | Phase 1 |
| 3 | Focus Mode (site blocker) | Phase 1 |
| 4 | Settings Panel (name, wallpaper, blocklist) | Phase 1, 2, 3 |
| 5 | Dashboard (daily/weekly stats) | Phase 2 |
| 6 | New Tab Smart Prompt (new task vs old task) | Phase 2 |

Each phase is independently deployable and testable.

---

## Phase 1 — Core Shell

### Goal
Replace new tab with a full-screen wallpaper background, a greeting, a live clock, a daily Geetha shloka, and the daily focus question.

### 1.1 Wallpaper
- **Default:** Bundle a high-quality default landscape image (`assets/default-wallpaper.jpg`)
- **Custom:** If `user.wallpaper` is set in storage, use it as a base64 `background-image`
- CSS: `background-size: cover; background-position: center; background-attachment: fixed;`
- Add a subtle dark overlay (`rgba(0,0,0,0.35)`) so text is always legible

### 1.2 Greeting
- Read `user.name` from storage. If not set, show "Hello, Friend"
- Time-based greeting:
  - 5:00–11:59 → "Good morning"
  - 12:00–16:59 → "Good afternoon"
  - 17:00–20:59 → "Good evening"
  - 21:00–4:59 → "Good night"
- Format: **"Good morning, Priya"** — large, centered, elegant font

### 1.3 Live Clock
- Display current time in `HH:MM:SS` format (12hr with AM/PM or 24hr — make configurable later)
- Update every second using `setInterval`
- Display current date below: e.g., "Sunday, 19 April 2026"
- Position: Centered, above greeting

### 1.4 Daily Geetha Shloka
- Maintain an array of Bhagavad Gita shlokas in `utils/shlokas.js`
  - Each entry: `{ chapter, verse, sanskrit, transliteration, english }`
  - Minimum 30 shlokas for Phase 1; can expand to 365
- **Daily rotation logic:**
  - Read `shlokaIndex` from storage
  - If date has changed since last shown: increment index, save new date
  - Display the shloka at the current index
- **Layout:** Centered card with subtle glassmorphism — Sanskrit text, then English meaning below
- Keep it non-intrusive: compact, placed below clock/greeting

### 1.5 Daily Focus Question
- **Morning Prompt (first open of the day):**
  - Check `dailyFocus.date` vs today
  - If different or missing → show a modal/overlay: "What is your **main focus** today?"
  - Text input + "Set Focus" button
  - On submit: save `{ date: today, text: input }` to storage
- **During the Day:**
  - Show the focus text persistently in a banner or card: **"Today's Focus: [text]"**
  - Position: Pinned bottom-center or top strip — always visible
- **Reset:**
  - Next calendar day, the prompt appears again. Previous focus is archived (not deleted — needed for dashboard stats)

### 1.6 First-Run Onboarding
- If `user.name` is null → show a one-time welcome modal: "What's your name?"
- Simple input + "Let's Go" button
- After saving name, load the normal dashboard

### Phase 1 Acceptance Criteria
- [ ] New tab opens with wallpaper (default if none set)
- [ ] Clock updates every second
- [ ] Greeting reflects time of day and user name
- [ ] A new shloka appears each day
- [ ] Focus prompt appears on first open of each day
- [ ] Focus text is visible all day until midnight reset
- [ ] First-run name capture works

---

## Phase 2 — Task System

### Goal
A lightweight, persistent task list embedded in the dashboard.

### 2.1 Task List UI
- **Location:** Right-side panel or bottom section (below focus)
- **Add Task:**
  - Text input + "Add" button (or press Enter)
  - New task appended to list with status `active`
- **Task Item Display:**
  - Checkbox (click to mark done)
  - Task title text
  - Delete (×) icon — appears on hover
- **Done State:**
  - Strikethrough + muted color
  - `completedAt` set to current timestamp
  - Update `stats.dailyCompleted[today]++`
- **Delete:**
  - Removes task from array entirely
  - If task was `done`, decrement today's stat count

### 2.2 Task Persistence
- All CRUD operations update `chrome.storage.local`
- On page load, render all tasks from storage
- Tasks persist indefinitely (no auto-delete)

### 2.3 Task Grouping (Visual Only in Phase 2)
- Show active tasks first, completed tasks below a "Completed" divider
- No other grouping needed until Phase 6

### Phase 2 Acceptance Criteria
- [ ] Can add a task by typing and pressing Enter or clicking Add
- [ ] Tasks persist across new tab opens
- [ ] Clicking checkbox marks task done with strikethrough
- [ ] Clicking × deletes the task
- [ ] Completing a task increments today's stat counter

---

## Phase 3 — Focus Mode (Site Blocker)

### Goal
A toggle that blocks distracting websites. When blocked, the user sees their own focus message instead of an error page.

### 3.1 Focus Mode Toggle
- **UI:** Toggle switch visible on the main dashboard (e.g., top-right corner, labeled "Focus Mode")
- **On state:** Shows a visual indicator (red/orange glow or lock icon)
- **State stored:** `focusMode.enabled` in storage

### 3.2 Blocking Mechanism (Service Worker)
- Use `chrome.declarativeNetRequest` with **dynamic rules**
- When Focus Mode is enabled:
  - Generate rules to redirect matching URLs to `chrome-extension://[ID]/blocked/blocked.html`
  - Rule example:
    ```json
    {
      "id": 1,
      "priority": 1,
      "action": {
        "type": "redirect",
        "redirect": { "extensionPath": "/blocked/blocked.html" }
      },
      "condition": {
        "urlFilter": "instagram.com",
        "resourceTypes": ["main_frame"]
      }
    }
    ```
  - Generate one rule per blocked domain
- When Focus Mode is disabled:
  - Remove all dynamic rules via `chrome.declarativeNetRequest.updateDynamicRules`

### 3.3 Blocked Page (`blocked.html`)
- Full-screen page with the extension's wallpaper as background
- Display:
  - A lock or "🚫" icon
  - "You're in Focus Mode"
  - The user's current focus text: **"Your focus: [text]"**
  - Blocked site name: "You tried to visit Instagram"
  - A button: "Disable Focus Mode" → calls storage update + removes rules → redirects back
- **No back button, no bypass — just the one clear action**

### 3.4 Default Blocked Sites
```
instagram.com
youtube.com
linkedin.com
twitter.com / x.com
facebook.com
reddit.com
tiktok.com
```
Fully user-editable in Settings (Phase 4).

### Phase 3 Acceptance Criteria
- [ ] Toggle enables/disables Focus Mode and persists state
- [ ] Navigating to a blocked site redirects to blocked.html
- [ ] Blocked page shows user's focus text and blocked site name
- [ ] "Disable Focus Mode" button works from blocked page
- [ ] Disabling Focus Mode removes all redirect rules immediately

---

## Phase 4 — Settings Panel

### Goal
A settings drawer/modal accessible via a gear icon, letting the user customize all aspects of the extension.

### 4.1 Settings Icon
- Gear icon (⚙) pinned to bottom-right corner of the new tab page
- Click opens a slide-in settings panel

### 4.2 Settings Sections

#### Section A: Profile
| Field | Input Type | Storage Key |
|-------|-----------|-------------|
| Your Name | Text input | `user.name` |
| Save button | — | triggers storage write |

#### Section B: Wallpaper
| Field | Input Type | Behavior |
|-------|-----------|----------|
| Upload Image | File input (accept="image/*") | Convert to base64, store in `user.wallpaper` |
| Use Default | Button | Sets `user.wallpaper = null` |
| Preview | Thumbnail | Shows current wallpaper |

**Image size constraint:** Warn user if image > 5MB. Compress to max 1920px wide before storing.

#### Section C: Blocked Sites (Focus Mode)
| Element | Behavior |
|---------|----------|
| List of current blocked sites | Each with a remove (×) button |
| Add Site input | Text input + "Add" button |
| Input validation | Strip `https://`, `www.`, trailing slashes — store clean domain only |

#### Section D: Clock Format
| Option | Value |
|--------|-------|
| 12-hour | Default |
| 24-hour | Toggle |

Stored in `user.clockFormat: "12h" | "24h"`.

#### Section E: Reset / Danger Zone
- "Clear all tasks" button (with confirmation dialog)
- "Reset all settings" button (with confirmation dialog)

### 4.3 Settings UX
- Changes save immediately on input (no separate "save all" needed, except name)
- Panel closes with ✕ or click-outside
- Transitions: smooth slide-in from right

### Phase 4 Acceptance Criteria
- [ ] Gear icon opens settings panel
- [ ] Name change reflects immediately on dashboard greeting
- [ ] Image upload replaces wallpaper on both dashboard and blocked page
- [ ] Adding/removing blocked sites updates Focus Mode rules if currently enabled
- [ ] Clock format toggle works
- [ ] Confirm dialogs appear before destructive actions

---

## Phase 5 — Dashboard & Analytics

### Goal
A visual summary of task completion — daily and weekly — accessible from the main new tab page.

### 5.1 Dashboard Toggle
- A "Dashboard" button or icon on the main page (e.g., bar-chart icon)
- Clicking it expands a dashboard panel (slides up from bottom or replaces task panel)

### 5.2 Daily View
- Show: "Today — [Date]"
- Tasks completed today: **count** with a progress ring or bar
- List of today's completed tasks (titles, completion time)
- Today's focus text

### 5.3 Weekly View
- Show the current week (Mon–Sun)
- Bar chart (pure CSS or lightweight canvas) with:
  - X-axis: Day labels (Mon, Tue, …)
  - Y-axis: Tasks completed count
  - Highlight today's bar
- Weekly total: "X tasks completed this week"
- Data source: `stats.dailyCompleted` keyed by date

### 5.4 Data Retention
- Keep `stats.dailyCompleted` for at least 90 days
- Purge entries older than 90 days on extension load (to avoid bloating storage)

### 5.5 Focus History (Bonus — implement if time allows)
- List of past daily focus entries (last 7 days)
- Format: `[Date] — [Focus text]`

### Phase 5 Acceptance Criteria
- [ ] Dashboard panel opens from main page
- [ ] Today's completed task count is accurate
- [ ] Weekly bar chart renders correctly
- [ ] Data persists across browser restarts
- [ ] Old stats (>90 days) are pruned automatically

---

## Phase 6 — New Tab Smart Prompt

### Goal
Every time a new tab is opened, ask the user whether they are starting a new task or continuing an existing one. This creates micro-intentionality for every browser session.

### 6.1 Prompt Trigger Logic
- **Always show** the prompt when a new tab opens
- Exception: If the user dismisses with "Just browsing" — skip for this tab session only (do not persist dismissal)

### 6.2 Prompt UI
- A centered modal card appearing over the dashboard (not blocking the wallpaper/clock)
- Title: **"What are you opening this tab for?"**
- Two primary options:
  1. **"New Task"** — Opens an inline quick-add input for a new task title
  2. **"Continue a Task"** — Shows a dropdown/list of current active tasks to select from
- Secondary option:
  - **"Just Browsing"** — Dismisses prompt, nothing is added

### 6.3 "New Task" Flow
1. User clicks "New Task"
2. Prompt transforms into: text input + "Add & Start" button
3. On submit: task is added to storage (same as Phase 2 add task)
4. Prompt closes, task appears in task list

### 6.4 "Continue a Task" Flow
1. User clicks "Continue a Task"
2. Prompt shows list of active tasks (max 10, scrollable)
3. User selects a task
4. Prompt closes, selected task is highlighted in the task list (e.g., glowing border)
5. Store `newTabSession.lastTaskId` = selected task ID

### 6.5 "Just Browsing" Flow
1. User clicks "Just Browsing"
2. Prompt closes immediately
3. Nothing is stored — next tab open will show prompt again

### 6.6 Prompt Timing
- Show the prompt 300ms after new tab loads (slight delay so wallpaper/clock are visible first)
- Animate in: fade + scale up

### Phase 6 Acceptance Criteria
- [ ] Prompt appears on every new tab open
- [ ] "New Task" flow adds a task to the list
- [ ] "Continue a Task" shows only active (not done) tasks
- [ ] Selecting a task highlights it in the task list
- [ ] "Just Browsing" dismisses without any storage write
- [ ] Prompt animates in smoothly after 300ms

---

## 7. UX Flows & Wireframe Notes

### 7.1 New Tab Layout (Desktop 1920×1080)
```
┌─────────────────────────────────────────────────────────┐
│ [Full-screen wallpaper with dark overlay]               │
│                                                         │
│              12:34:56 PM                                │
│           Sunday, 19 April 2026                         │
│                                                         │
│           Good morning, Priya 👋                        │
│                                                         │
│  ┌──────────────────────────────────────┐               │
│  │ 🕉 Chapter 2, Verse 47               │               │
│  │ "Karmanye vadhikaraste..."           │               │
│  │ You have a right to perform your    │               │
│  │ prescribed duties...                │               │
│  └──────────────────────────────────────┘               │
│                                                         │
│  [Focus Mode: OFF ●]          [📊] [⚙]                │
│                                                         │
│  ┌──── Tasks ─────────────────────────┐                 │
│  │ ☐  Finish quarterly report         │                 │
│  │ ☐  Call Ravi about project         │                 │
│  │ ☑  Review PRD (done)               │                 │
│  │ [+ Add a task...]          [Add]   │                 │
│  └────────────────────────────────────┘                 │
│                                                         │
│  ━━━━━━ Today's Focus: Ship the MVP ━━━━━━━━━━━━━━━━━  │
└─────────────────────────────────────────────────────────┘
```

### 7.2 New Tab Prompt Overlay
```
┌─────────────────────────────────────────────────────────┐
│ [Wallpaper dimmed further]                              │
│                                                         │
│         ┌──────────────────────────────┐               │
│         │  What are you opening        │               │
│         │  this tab for?               │               │
│         │                              │               │
│         │  [ 📝 New Task ]             │               │
│         │  [ ↩ Continue a Task ]       │               │
│         │  [ 🌐 Just Browsing ]        │               │
│         └──────────────────────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### 7.3 Blocked Page Layout
```
┌─────────────────────────────────────────────────────────┐
│ [Same wallpaper, heavier dark overlay]                  │
│                                                         │
│                    🔒                                   │
│           You're in Focus Mode                          │
│                                                         │
│         You tried to visit Instagram                    │
│                                                         │
│      Your focus today:                                  │
│      "Ship the MVP"                                     │
│                                                         │
│        [ Disable Focus Mode ]                           │
└─────────────────────────────────────────────────────────┘
```

---

## 8. Non-Functional Requirements

### Performance
- New tab must visually load in < 300ms (no network requests on open)
- Wallpaper base64 stored in storage — no fetch delay
- All JS must be non-blocking; use `requestAnimationFrame` for clock

### Storage Limits
- `chrome.storage.local` limit is 10MB
- Wallpaper images must be compressed to ≤ 1MB before storage
- Tasks list: assume max 500 tasks (no pagination needed until then)

### Security
- No external scripts, no CDN dependencies (fully self-contained)
- No user data leaves the browser ever
- Content Security Policy in manifest: `"content_security_policy": { "extension_pages": "script-src 'self'; object-src 'self'" }`

### Accessibility
- All interactive elements have `aria-label`
- Focus trap on modal dialogs
- Keyboard navigable (Tab, Enter, Escape)
- Contrast ratio ≥ 4.5:1 for text over wallpaper overlay

### Browser Compatibility
- Chrome only (Manifest V3)
- Minimum Chrome version: 102 (declarativeNetRequest dynamic rules support)

---

## 9. Acceptance Criteria Summary

| # | Feature | Done When |
|---|---------|-----------|
| 1 | Wallpaper | Full-screen, custom upload works, default fallback works |
| 2 | Clock | Live, updates every second, correct time zone |
| 3 | Greeting | Time-aware, uses stored name |
| 4 | Shloka | New shloka per day, persists index across tabs |
| 5 | Focus Question | Morning prompt, all-day visibility, midnight reset |
| 6 | Task Add | Enter key or button, persists |
| 7 | Task Done | Checkbox, strikethrough, stat logged |
| 8 | Task Delete | × removes from list and storage |
| 9 | Focus Mode Toggle | Enables/disables blocking, state persists |
| 10 | Site Blocking | Redirect to blocked.html works for all default + custom sites |
| 11 | Blocked Page | Shows user focus, site name, disable button works |
| 12 | Settings — Name | Saved, reflected immediately |
| 13 | Settings — Wallpaper | Upload, preview, revert to default |
| 14 | Settings — Blocklist | Add/remove domains, updates rules if Focus Mode on |
| 15 | Dashboard — Daily | Correct count, lists completed tasks |
| 16 | Dashboard — Weekly | Bar chart with 7-day data |
| 17 | New Tab Prompt | Appears every tab, all 3 flows work correctly |
| 18 | First-Run | Name prompt on first install |

---

## 10. Shloka Data Format (for `utils/shlokas.js`)

```javascript
// utils/shlokas.js
export const shlokas = [
  {
    chapter: 2,
    verse: 47,
    sanskrit: "कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।",
    transliteration: "Karmanye vadhikaraste ma phaleshu kadachana",
    english: "You have the right to perform your prescribed duties, but you are not entitled to the fruits of your actions."
  },
  {
    chapter: 2,
    verse: 14,
    sanskrit: "मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।",
    transliteration: "Matrasparshastu kaunteya shitoshna sukha duhkha dah",
    english: "The contact between the senses and sense objects gives rise to fleeting perceptions of happiness and distress. These are non-permanent and come and go like winter and summer seasons."
  },
  // ... add remaining shlokas
];
```

---

## 11. Build Order for AI Coding Assistant

Follow phases strictly in order. Each phase ends with a working, testable Chrome extension load.

```
Phase 1 → Load extension, see wallpaper + clock + greeting + shloka + focus prompt
Phase 2 → Add/complete/delete tasks working and persisted
Phase 3 → Toggle focus mode, navigate to YouTube, see blocked page
Phase 4 → Open settings, change name, upload wallpaper, edit blocklist
Phase 5 → Open dashboard panel, see today's bar and weekly chart
Phase 6 → Open new tab, see prompt, test all 3 flows
```

**Do not skip phases or combine them.** Each phase builds on storage schemas defined in Phase 1.

---

*End of PRD — FocusTab v1.0*
