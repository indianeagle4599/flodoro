<h1>
  <img src="assets/pomodoro-app-logo.png" alt="" width="39" align="absmiddle" />
  <samp>Pomodoro App</samp>
</h1>

`pomodoro-app` is a serverless, local-first Pomodoro timer and task manager for focused work sessions, breaks, ambient audio, lightweight history, and personal workflow tracking.

It is designed as one clean webpage: no backend, no account system, no sync requirement. User preferences, tasks, history, notification settings, and audio choices stay in the browser through `localStorage`.

## Current phase

The repo is in **static app polish** mode:
- **Focus pillar**: timer, session switching, break handling, notifications, and keyboard shortcuts.
- **Planning pillar**: local task list, starred tasks, session/task history, and simple stats.
- **Atmosphere pillar**: theme controls, gradients, audio playlists, and notification sounds.
- **Safety pillar**: local-only state, explicit browser permissions, safe DOM rendering, and no server dependency.

The default direction is serverless and device-local. Remote sync, accounts, or destructive data operations are not part of the current app model.

## Repository layout

```text
pomodoro-app/
  index.html                 # single-page app shell and slide-out panels
  app.js                     # timer, tasks, settings, history, audio, notifications
  style.css                  # responsive UI, panels, controls, themes
  audioManifest.js           # generated audio library manifest
  update_songs.py            # regenerates audioManifest.js from local music folders
  process_video.py           # local helper for preparing loopable media
  assets/
    pomodoro-app-logo.png    # README/app logo
    audio/notify.mp3         # notification chime
    demo/                    # optional screenshots/GIFs for README demos
    music/                   # optional local playlist assets, usually not committed
```

## Demo

![Main timer screen](assets/demo/timer.png)

| Settings | Notification settings | Audio settings |
| --- | --- | --- |
| ![Settings panel](assets/demo/settings-panel.png) | ![Notification settings panel](assets/demo/notifications.png) | ![Audio settings panel](assets/demo/audio-panel.png) |

| Tasks | History | Statistics |
| --- | --- | --- |
| ![Tasks panel](assets/demo/tasks-panel.png) | ![History panel](assets/demo/history-panel.png) | ![Statistics panel](assets/demo/stats-panel.png) |

## What is usable today

### 1. Pomodoro timer

Configurable work duration, short break, long break, and long-break cadence.

Controls include:
- Start / pause
- Reset
- Add or subtract one minute
- Postpone break once per break
- Manual work/break switching

### 2. Task manager

Tasks live in a slide-out panel and are stored locally. You can add, complete, star, delete, and reorder tasks. The app advances the current task after completed work sessions.

### 3. History and statistics

The app records session history and task events locally. The History panel shows the timeline, and the Statistics panel summarizes work sessions, breaks, and task activity.

History rendering uses DOM nodes and `textContent`; user-entered task text is not injected as HTML.

### 4. Audio playlists

The Audio panel supports playlist/category selection, track selection, play/pause, previous/next, mute, volume, and progress scrubbing.

`audioManifest.js` is generated from local audio folders. Large music files can stay local and outside git while the manifest maps available tracks for the app.

### 5. Notification settings

Notification controls live in a focused Notification Settings panel opened from the main Settings panel.

Available knobs:
- **Notifications**: master switch for all notification output.
- **Sounds**: chime playback.
- **On-screen alerts**: toast and browser notification output.
- **Notification timing**: `1 min early`, `5 min early`, custom early reminders, and `When session ends`.

Browser notification permission is only useful for on-screen browser notifications. The app still works with local toast/chime behavior when browser permission is not granted.

### 6. Themes and visual settings

The app supports gradient background colors, accent color, theme presets, and dark/light mode. Panels use a compact slide-out pattern to avoid crowding the main timer.

## Running locally

No build step is required.

Open `index.html` in a browser, or serve the folder with any static file server if your browser blocks local media behavior from `file://`.

Example:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Audio manifest workflow

When local music folders change, regenerate the manifest:

```bash
python update_songs.py
```

Expected result:
- `audioManifest.js` contains the current playlist/category mapping.
- Paths match the real folders under `assets/music/`.
- Missing or renamed folders should be fixed before committing the manifest.

## Local data model

The app stores data in the browser using `localStorage`:
- timer preferences
- theme preferences
- notification preferences
- selected audio genre/track
- tasks
- session/task history
- quote of the day

Clearing browser site data clears the app state.

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| `Space` | Start / pause timer |
| `R` | Reset timer |
| `P` | Postpone break |
| `+` / `-` | Add / subtract one minute |
| `B` or `W` | Toggle work/break mode |
| `M` | Mute/unmute audio |
| `V` | Play/pause audio |
| `T` | Open/close Tasks |
| `H` | Open/close History |
| `S` | Open/close Settings |
| `Escape` | Close open panel |

## Safety and design principles

- Static site by default.
- No backend required.
- Local browser state by default.
- Explicit browser permission for native notifications.
- Safe DOM rendering for user-entered text.
- Large audio/media assets can remain local and out of git.
- UI panels should stay compact, direct, and low-cognitive-load.

## Planned next steps

1. Guard settings parsing so blank or invalid duration fields cannot produce `NaN`.
2. Decide local-folder playlist flow: browser directory picker, bundled local assets, or both.
3. Add a manifest validation command for missing audio files and duplicate IDs.
4. Resolve the native notification icon path referenced by `app.js`.
5. Decide whether PWA/offline behavior belongs in this serverless version.
6. Add demo screenshots or a short walkthrough GIF under `assets/demo/`.
