# Defender

A browser-based arcade remake of the classic **Defender** — protect humanoids, destroy invaders, and chase the high score.

## Run locally

ES modules require a local HTTP server (opening `index.html` directly will not work).

```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve .
```

Then open [http://localhost:8080](http://localhost:8080).

## Controls

| Key | Action |
|-----|--------|
| ↑ / ↓ | Thrust up / down |
| ← / → | Move left / right |
| Space | Fire laser |
| X | Smart bomb |
| C | Hyperspace |
| P / Esc | Pause |

## Gameplay

- Destroy waves of landers, bombers, pods, baiters, and mutants.
- Protect humanoids on the planet surface — landers will abduct them.
- Catch falling humanoids before they hit the ground too hard.
- Use the radar to track threats across the wrapping world.
- Smart bombs clear on-screen enemies; hyperspace teleports with risk.

All tunables live in `src/config.js`.

## Tech

- Vanilla HTML / CSS / JavaScript (ES modules)
- Canvas rendering with neon green line-art style
- Procedural Web Audio SFX (no asset files)
- High score saved to `localStorage`
