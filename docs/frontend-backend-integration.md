# Game UI Frontend Integration Guide

This document explains how to connect this frontend to backend endpoints and where to configure navigation, counters, and animation behavior.

## Source of truth

All runtime config is centralized in:

- `scripts/core/config.js`

Main UI logic reads from this object:

- `window.GAME_UI_CONFIG`

Core behavior implementation:

- `scripts/core/main.js`

## What is configurable

`window.GAME_UI_CONFIG` supports:

```js
{
  links: {
    topbar: {
      farm: "/farm",
      settings: "/settings"
    },
    gamebar: {
      home: "/home",
      tasks: "/tasks",
      shop: "/shop",
      guild: "/guild",
      profile: "/profile"
    }
  },
  counter: {
    durationSeconds: 10,
    endpoint: "",
    requestTimeoutMs: 3000,
    tickMs: 50
  },
  gamebar: {
    countersEndpoint: "",
    counters: {
      home: 12,
      tasks: 4,
      shop: 8,
      guild: 2,
      profile: 16
    }
  },
  progress: {
    screen: "",
    points: 0,
    goal: 100,
    title: "Поздравляем!",
    message: "Отличная тренировка!",
    ctaLabel: "Продолжить",
    endpoint: "",
    autoOpen: false,
    openOnTimerFinish: false
  },
  animations: {
    farmDurationMs: 620,
    settingsDurationMs: 820,
    tickFadeMs: 520,
    tickStrokeMs: 220,
    finishFillMs: 1150,
    finishBubbleRevealMs: 1100,
    finishBubbleRevealDelayMs: 900,
    finishBlurInMs: 650,
    finishBlurInDelayMs: 1150,
    finishPulseMs: 2600,
    finishPulseDelayMs: 1800,
    finishArcStrokeWidthPx: 3,
    progressOpenMs: 320,
    progressCloseMs: 220,
    progressRingFillMs: 1200
  }
}
```

## UI element mapping

### Topbar links

- Farm button: `data-link-key="farm"`
- Settings button: `data-link-key="settings"`

Clicking these buttons triggers animation and then navigation to `links.topbar[key]`.

### Gamebar links and counters

Each gamebar item uses `data-gamebar-key`:

- `home`, `tasks`, `shop`, `guild`, `profile`

On click:

1. item becomes active,
2. icon switches to `*-active` variant,
3. navigates to `links.gamebar[key]`.

Counter text for each item is populated by:

1. `gamebar.counters` (local fallback),
2. then overwritten by `gamebar.countersEndpoint` response (if available).

## Backend contracts

## 1) Counter endpoint

URL:

- `GAME_UI_CONFIG.counter.endpoint`

Expected JSON (all fields optional):

```json
{
  "durationSeconds": 120,
  "remainingSeconds": 87
}
```

Behavior:

- `durationSeconds` sets full timer duration.
- `remainingSeconds` sets current countdown position (clamped to duration).
- if endpoint fails/timeouts, frontend falls back to local config.

## 2) Gamebar counters endpoint

URL:

- `GAME_UI_CONFIG.gamebar.countersEndpoint`

Expected JSON shape:

```json
{
  "home": 12,
  "tasks": 4,
  "shop": 8,
  "guild": 2,
  "profile": 16
}
```

Missing keys are ignored; existing values remain.

## 3) Progress popup endpoint

URL:

- `GAME_UI_CONFIG.progress.endpoint`

Expected JSON (all fields optional):

```json
{
  "points": 87,
  "goal": 100,
  "title": "Поздравляем!",
  "message": "Отличный результат!",
  "ctaLabel": "Продолжить",
  "autoOpen": true
}
```

Behavior:

- All fields are optional; missing fields fall back to `GAME_UI_CONFIG.progress` defaults.
- `points / goal` drives plant growth via `--grow-level` (clamped to `[0, 1]`) and the percent label.
- If `autoOpen: true` is returned, the popup opens immediately after the fetch resolves.

## Progress popup state

The progress popup is a fullscreen modal layered over the main UI. It displays:

1. earned points (large number above the plant),
2. a congratulation title + message,
3. visualization of progress as a grove of 5 trees that grow in staggered sequence (`points / goal`), with a shining animated sun overhead.
4. points number counts up from 0 to the earned value (eased animation, duration `animations.progressCountMs`).

### How to show / hide

The popup exposes an imperative API on `window.GameUI`:

```js
// Show the popup. All fields in the payload are optional.
window.GameUI.showProgress({
  points: 87,
  goal: 100,
  title: "Поздравляем!",
  message: "Отличный результат!",
  ctaLabel: "Продолжить",
});

window.GameUI.hideProgress();
window.GameUI.toggleProgress({ points: 42 });
```

Built-in close triggers:

- click on the backdrop (`data-progress-action="close"`),
- click on the close button (×) or the CTA button,
- press `Escape`.

### Auto-open options

- `progress.screen: "gameui:progressopen"` → opens the popup on page load and dispatches `gameui:progressopen` (preferred named screen state).
- `progress.autoOpen: true` → same as above (shorthand).
- `progress.openOnTimerFinish: true` → opens the popup automatically when the speedometer countdown reaches `0`.

### Custom events

The popup dispatches the following events on `document`:

- `gameui:progressopen` — fired after the popup is shown.
- `gameui:progressclose` — fired after the close animation completes.
- `gameui:timerfinish` — fired by the speedometer when the countdown hits zero (the popup listens to this if `openOnTimerFinish` is enabled, but you can subscribe to it for any purpose).

### DOM contract

- Root: `#progress-popup` with `role="dialog"`, `aria-modal="true"`, `hidden` when closed.
- Close-on-click elements: any descendant with `data-progress-action="close"`.
- Content slots: `#progress-popup-points`, `#progress-popup-title`, `#progress-popup-message`, `.progress-popup-cta`, `#progress-popup-grove`, `#progress-popup-trees`, `#progress-popup-grow-percent`.
- Tree growth duration: `animations.progressRingFillMs` (`--anim-progress-ring-fill`).
- Points count-up duration: `animations.progressCountMs` (`--anim-progress-count`).

## State management model

Frontend state is managed in-memory in `scripts/core/main.js` (no external state library).

### Timer state

Runtime fields:

- `totalDurationSeconds`/`totalDurationMs`
- `remainingMs`
- `isFinished`

State lifecycle:

1. `countdown` starts from configured or backend-provided values.
2. `remainingMs` decreases every `counter.tickMs`.
3. when `remainingMs === 0`, UI enters `finished` (`.speedometer.is-finished`).
4. finished ring animations continue; countdown interval is cleared.

### Data source priority

Timer:

1. `data-duration` on `.speedometer` (if valid),
2. `GAME_UI_CONFIG.counter.durationSeconds`,
3. backend override from `counter.endpoint` (`durationSeconds`, `remainingSeconds`).

Gamebar counters:

1. `GAME_UI_CONFIG.gamebar.counters` (local fallback),
2. backend override from `gamebar.countersEndpoint`.

### UI interaction state

Topbar:

- click triggers jump animation class (`is-jumping`) + navigation from config links.

Gamebar:

- exactly one item becomes active via `is-active`,
- icon switches between default and `-active` asset,
- navigation uses `links.gamebar[data-gamebar-key]`.

## Animation config behavior

Animation parameters in `animations` are mapped to CSS variables by `main.js` at startup.

Examples:

- `finishArcStrokeWidthPx` -> `--anim-finish-arc-stroke-width`
- `finishPulseMs` -> `--anim-finish-pulse`
- `farmDurationMs` -> `--anim-farm-duration`

This keeps timing and visual tuning centralized in config and avoids hardcoded values spread across CSS/JS.

## Quick backend hookup checklist

1. Set route URLs in `links.topbar` and `links.gamebar`.
2. Set `counter.endpoint` and return `durationSeconds`/`remainingSeconds`.
3. Set `gamebar.countersEndpoint` and return per-key counts.
4. Tune `requestTimeoutMs` and `tickMs` as needed.
5. Adjust `animations` values for product motion style.
6. Decide how the progress popup is opened — manually via `window.GameUI.showProgress(...)`, automatically via `progress.openOnTimerFinish`, by `progress.autoOpen`, or by the `autoOpen` flag returned from `progress.endpoint`.

## Notes for another AI agent

- Do not edit animation values directly in `styles/main.css` unless adding a new variable.
- Prefer extending `window.GAME_UI_CONFIG` and keeping defaults in `scripts/core/config.js`.
- Preserve `data-link-key` and `data-gamebar-key` attributes in `index.html`; they are the JS wiring contract.
