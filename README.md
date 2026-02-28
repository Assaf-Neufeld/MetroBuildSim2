# Metro Build Simulator

A browser-based strategy/simulation game built with **TypeScript + Vite + HTML5 Canvas**.

## Features
- Build metro lines under per-level constraints.
- Run deterministic-ish simulation with fixed timestep (`1/60`).
- Passenger spawning, shortest-hop routing (BFS next-hop table), boarding/unloading, and transfers.
- Win/lose rules based on delivery targets, crowding, and sustained average wait.
- 3 playable levels with increasing difficulty and connection constraints.
- Desktop + mobile controls (tap/click, pan, wheel/pinch zoom).
- Basic PWA setup (manifest + service worker cache).

## Quick Start
```bash
npm install
npm run dev
```
Then open the local Vite URL (typically `http://localhost:5173`).

## Production Build
```bash
npm run build
npm run preview
```

## Controls
### Desktop
- `Click station`: start/extend current line
- `Shift + Click station`: start a new line and add station
- `Right click` or `Esc`: cancel current line
- `Mouse wheel`: zoom
- `Drag`: pan

### Mobile / Touch
- `Tap station`: start/extend current line
- `Two-finger pinch`: zoom
- `One-finger drag`: pan

## UI Buttons
- Mode: `Build` / `Simulate`
- Build actions: `New Line`, `Finish Line`, `Undo`, `Delete Line`
- Simulation: `Start`, `Pause/Resume`, `Reset`
- Levels: `Prev Level`, `Next Level`

## Game Rules
Each level includes:
- Station map (position, type, capacity, spawn rate)
- Build constraints (`maxLines`, `maxSegments`, `maxStationsPerLine`, required/forbidden connections)
- Goals (`surviveSeconds`, `deliveredTarget`, `maxAvgWait`, `maxOvercrowdSecondsPerStation`)

### Win
Survive long enough, deliver enough passengers, and keep system stable.

### Lose
- Any station overcrowded beyond threshold, or
- Average wait above level threshold for 10 sustained seconds.

## Project Structure
- `src/main.ts` — app boot + canvas + UI hook + SW registration
- `src/engine/game.ts` — game state, modes, loop, win/lose checks
- `src/engine/camera.ts` — pan/zoom transforms
- `src/render/render.ts` — canvas drawing
- `src/build/buildController.ts` — mouse/touch build + camera inputs
- `src/sim/simController.ts` — simulation update logic
- `src/sim/routing.ts` — graph + BFS next-hop routing
- `src/data/levels.ts` — 3 hardcoded levels
- `src/ui/ui.ts` — overlay UI binding + stats + toasts
- `src/utils/geometry.ts`, `src/utils/random.ts` — utility helpers

## Notes
- No external backend is required.
- PWA caching is intentionally simple and suited for MVP usage.
