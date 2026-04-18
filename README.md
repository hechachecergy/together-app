# Together — Self-Guided Relationship Coaching App

A private, self-guided web app that helps couples communicate better, work through conflict, and build a relationship they're proud of.

## Features

- **Weekly Check-In** — 5-question form both partners complete, with side-by-side reveal
- **Conflict Reflection** — Private per-partner reflection with 24-hour reveal
- **Exercise Gallery** — 10 research-backed relationship exercises with filters
- **Progress Dashboard** — Connection score trend, goal tracking, milestones
- **Coach-Like Logic** — 7 rules that surface the right exercises based on your data
- **100% Private** — All data stays on your device via localStorage. No account, no server.

## How to Run

You need a local server (ES modules don't work via `file://`).

**Option A — VS Code (easiest, no terminal)**
1. Install [VS Code](https://code.visualstudio.com) (free)
2. Install the **Live Server** extension
3. Open the `together-app` folder in VS Code
4. Right-click `index.html` → **Open with Live Server**

**Option B — Python (macOS/Linux)**
```bash
cd together-app
python3 -m http.server 3000
```
Then open `http://localhost:3000`

**Option C — Node.js**
```bash
npx serve .
```

## File Structure

```
together-app/
├── index.html          ← Landing page
├── onboarding.html     ← Couple setup
├── goals.html          ← Goal-setting wizard
├── checkin.html        ← Weekly check-in form
├── conflict.html       ← Conflict reflection
├── exercises.html      ← Exercise gallery
├── dashboard.html      ← Progress dashboard
├── css/
│   └── styles.css      ← Full design system
├── js/
│   ├── app.js          ← Shared init + nav
│   ├── storage.js      ← localStorage helpers
│   ├── goals.js        ← Goal wizard logic
│   ├── checkin.js      ← Check-in logic
│   ├── conflict.js     ← Conflict reflection logic
│   ├── exercises.js    ← Gallery + modal
│   ├── dashboard.js    ← Stats + charts
│   └── prompts.js      ← Coach-logic rule engine
└── data/
    └── exercises.json  ← 10 exercises (add more here)
```

## Tech Stack

- Vanilla HTML, CSS, JavaScript (ES modules)
- localStorage for data persistence
- No framework, no build step, no dependencies
