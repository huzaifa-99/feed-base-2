# FeedBase2

A small browser game for practicing **4-bit binary** (decimals **0–15**). Catch the right falling value, build streaks, and learn from misses.

**Play:** [feedbase2.rhuzaifa.com](https://feedbase2.rhuzaifa.com/)

![FeedBase2 screenshot](https://github.com/huzaifa-99/feed-base-2/assets/68777211/43a65d5e-96a1-4a13-8c28-2c8950a4adf4)

## Modes

| Mode | Goal |
| --- | --- |
| **Classic** | Find a decimal → catch its binary (e.g. `2` → `0010`) |
| **Reverse** | Find a binary → catch its decimal |
| **Quiz** | Find a decimal → tap the matching binary |

Each mode has **Easy / Normal / Hard** difficulty (speed, density, quiz choices / timer).

## Features

- Score, best score (per mode × difficulty), and streak bonuses
- Sound effects (toggle), share score, pause
- **Show answers** cheat (hint under Find)
- **On-screen arrows** for touch play (toggle in settings)
- Mobile-friendly layout + installable **PWA** (works offline after first visit)
- Conversion chart: [`assets/images/binaryConversion.png`](./assets/images/binaryConversion.png)

## Controls

| Input | Action |
| --- | --- |
| ← → / drag / on-screen pads | Move (Classic & Reverse) |
| Tap choices | Answer (Quiz) |
| Header play / pause | Pause & resume |
| Header ⚙️ | Settings (mode, difficulty, options) |
| Space / Esc | Pause toggle / settings (desktop) |

## Run locally

Serve over HTTP (required for ES modules and the service worker):

```bash
npx serve .
```

Open the URL it prints. Opening `index.html` as a `file://` page will not work reliably.

### Install as an app

On **HTTPS** or **localhost**, use the browser’s **Install app** / **Add to Home Screen**. After the first load, the game can run offline.

## Project layout

```
index.html              # UI shell
style.css               # Layout & theme
manifest.webmanifest    # PWA manifest
sw.js                   # Offline cache
js/                     # Game modules
assets/icons/           # App icons
assets/fonts/           # Inconsolata
assets/images/          # Binary chart
```

## License

[MIT](./LICENSE) © Huzaifa Rasheed
