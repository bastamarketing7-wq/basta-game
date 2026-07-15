# Basta Play · Marketing Game Experience

A premium, fully interactive branded web game for **Basta Marketing Agency** — five
game modes wrapped in a glassmorphism UI with animations, sound, XP, levels, coins,
achievements and a local leaderboard. Built with **HTML + CSS + JavaScript only**,
no backend, no build framework, and no external runtime dependencies.

> نصنع التجربة ويستمر الأثر

## ▶️ Play it

Open **`index.html`** in any modern browser. That's it.

`index.html` is a **single, self-contained production file** — all CSS, all
JavaScript, and both brand logos (embedded as base64 data URIs) live inside it.
There are **zero external files** to load, so it runs from `file://`, any static
host (GitHub Pages, Netlify, S3…), or an email attachment. ~600 KB total.

## 🎮 Game modes

| Mode | What you do |
|------|-------------|
| 🧩 **Marketing Puzzle** | Order marketing funnels (AIDA, brand journey…) and pick the best branding answers. |
| 🧠 **Memory Challenge** | Watch a brand-tile sequence light up, then reproduce it. It grows every round. |
| ⚡ **Speed Challenge** | Tap the requested brand element as fast as you can before the clock runs out. |
| ♟️ **Strategy Challenge** | Read real marketing scenarios and choose the smartest decision — with a "why". |
| 📅 **Daily Challenge** | A new, date-seeded mode every day with bonus XP & coins. |

## ✨ Features

- Professional animated **loading screen**
- Modern **glassmorphism** UI, brand-accurate (Blue `#1E5BD6` · White · Orange `#F97316`)
- **Dark & Light** mode
- **Sound effects** + ambient **background music** (synthesized via Web Audio — no audio files)
- **XP → Levels → Ranks**, **Coins**, **Achievement badges**
- **Local leaderboard** + **auto-save** (LocalStorage)
- **Confetti**, smooth 60fps transitions, ripple feedback
- **Mobile-first**, fully responsive (mobile / tablet / desktop)
- **Touch gestures & full keyboard support** (number keys pick options · `M` music · `T` theme · `Esc` close)
- **Accessibility**: ARIA labels, focus states, `prefers-reduced-motion`, high contrast

## 🎨 Branding

The provided Basta logos are used **as-is and never modified or recreated**:

- `assets/logo-badge.png` — circular agency badge (favicon, header, loader)
- `assets/logo-full.jpeg` — full wordmark logo (hero, menu)

## 🗂️ Project structure

The repo keeps a clean modular source **and** the flattened single file:

```
index.html          ← 🚀 the single, self-contained deliverable (open this)
index.src.html      ← modular HTML template (references the files below)
css/
  main.css           design tokens, reset, layout, glassmorphism, theming
  components.css      buttons, cards, mode tiles, game elements, modals, badges
  animations.css      keyframes, loading screen, transitions
js/
  data.js            all game content (puzzles, scenarios, tiles, achievements)
  storage.js         LocalStorage persistence + XP/level/coin progression
  audio.js           Web Audio sound effects + ambient music
  ui.js              theme, HUD, toasts, confetti, modal, ripple
  main.js            app controller, router, screens, reward logic
  games/
    puzzle.js  memory.js  speed.js  strategy.js  daily.js
assets/
  logo-badge.png  logo-full.jpeg
build_single.py     bundles the modular source into the single index.html
```

## 🔧 Rebuilding the single file

Edit the modular source, then regenerate `index.html`:

```bash
python3 build_single.py
```

The build inlines the CSS/JS and embeds each logo exactly once as a data URI.

---

Crafted for **Basta Marketing Agency**.
