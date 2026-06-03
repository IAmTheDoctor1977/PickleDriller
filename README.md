# Drill Lab — Pickleball Trainer PWA

A mobile-first progressive web app for tracking pickleball drills (wall, ball machine, partner) and building practice sessions with AI.

## Features

- **Drills** — Browse 35+ drills across 10 categories with intensity tags, equipment, and notes
- **Log** — Capture sessions: date, focus, duration, drills, performance, notes
- **History** — Running log with 30-day stats (sessions, minutes, "sharp" rate)
- **Randomize** — Smart shuffle that respects warm-up first, no back-to-back high-intensity or same-category drills, cool-down last
- **Generate** — AI session builder (uses Claude API) that reads your last 10 sessions, identifies weak areas, and weights drills accordingly
- **Gear** — Track paddles, balls, ball machine, rebounder, courts, shoes
- **PWA** — Installable on iPhone via Safari → Add to Home Screen; works offline after first load

## Stack

Pure HTML/CSS/JS. No build step. No frameworks. localStorage for persistence.

---

## Deploy to GitHub Pages

You have everything you need in this folder. Here's the full sequence.

### 1. Create the GitHub repo

1. Go to https://github.com/new
2. Repo name: `pickleball-trainer` (or whatever you want)
3. Public (required for free GitHub Pages)
4. **Don't** initialize with README, .gitignore, or license — you already have files
5. Click **Create repository**

You'll land on a page with quick-setup instructions. Keep that tab open.

### 2. Generate a Personal Access Token (PAT)

You need a token to push from the command line.

1. Go to https://github.com/settings/tokens?type=beta (fine-grained tokens)
2. Click **Generate new token**
3. Token name: `pickleball-trainer-push`
4. Expiration: 90 days is fine
5. Repository access: **Only select repositories** → pick `pickleball-trainer`
6. Permissions → Repository permissions:
   - **Contents** → Read and write
   - **Metadata** → Read-only (auto)
   - **Pages** → Read and write (so the API can enable it later if needed)
7. **Generate token**, copy it (starts with `github_pat_...`). You won't see it again.

### 3. Push the code

Open a terminal in the folder containing these files. Then:

```bash
git init
git add .
git commit -m "Initial commit: Drill Lab PWA"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/pickleball-trainer.git
git push -u origin main
```

When prompted for credentials:
- **Username:** your GitHub username
- **Password:** paste the PAT (NOT your GitHub account password)

(Optional, to save it for next time:)
```bash
git config --global credential.helper store
```

### 4. Enable GitHub Pages

1. In your repo, go to **Settings → Pages** (left sidebar)
2. Source: **Deploy from a branch**
3. Branch: `main`, folder: `/ (root)`
4. **Save**
5. Wait 30–60 seconds. The page will refresh showing:
   > Your site is live at https://YOUR_USERNAME.github.io/pickleball-trainer/

### 5. Open on your iPhone

1. Open Safari on your phone
2. Navigate to the URL above
3. Tap the **Share** icon → **Add to Home Screen**
4. Name it "Drill Lab" → **Add**

The icon appears on your home screen and opens in standalone mode (no browser chrome).

### 6. Set up the AI generator (optional)

The Generate tab uses the Claude API. To use it:

1. Get an API key from https://console.anthropic.com/settings/keys
2. Open the app → **Generate** tab
3. Paste your key into the API Key field

The key is stored only in your browser's localStorage. It's never sent anywhere except to Anthropic's API. **Don't commit the key to GitHub** — it's never put in the source code, only typed into the running app on your device.

---

## Update workflow

When you want to change a drill, tweak a style, or add a feature:

```bash
# edit files
git add .
git commit -m "describe the change"
git push
```

GitHub Pages rebuilds automatically in ~30 seconds. On your phone, force-refresh the PWA by removing it from the home screen and re-adding it, or open in Safari and pull-to-refresh once before relaunching. The service worker version-checks on each load.

---

## File structure

```
pickleball-trainer/
├── index.html          # Shell with bottom nav and tab containers
├── style.css           # All styles (light/dark auto via prefers-color-scheme)
├── app.js              # State, routing, view rendering, AI generator
├── drills.js           # Drill library (edit this to add/remove drills)
├── manifest.json       # PWA install metadata
├── service-worker.js   # Offline caching
├── icons/
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
└── README.md
```

## Customizing the drill library

Open `drills.js`. Each drill is an object — add or edit them and push to GitHub. The schema:

```js
{
  id: 'unique-id',            // any string, must be unique
  name: 'Drill Name',
  category: 'reset',          // dinking, third-shot, reset, transition, volley, atp-erne, serve-return, footwork, warmup, cooldown
  role: 'main',               // warmup, main, cooldown
  description: '...',
  duration: 10,               // minutes
  intensity: 'medium',        // low, medium, medium-high, high
  equipment: ['wall'],        // wall, ball-machine, partner, none
  tags: ['solo'],             // solo, partner (can include both)
  notes: 'Optional cue'
}
```

## Resetting data

The app stores everything in your browser's localStorage. To wipe sessions and gear:

- Open the app in Safari/Chrome
- DevTools → Application → Local Storage → clear `dl_sessions`, `dl_gear`, `dl_api_key`

Or just call `localStorage.clear()` in the console.

---

## Notes

- This is a static site — no backend, no server, no analytics, no tracking
- All data lives in your browser. If you clear browser data or switch phones, you lose history
- The AI generator costs real money per call (Anthropic API pricing). Sonnet 4.6 is fast and cheap — a session generation runs roughly fractions of a cent
- The repo is public; only your code is public, not your API key or session data
