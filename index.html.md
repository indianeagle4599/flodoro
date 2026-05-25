# Flodoro

> Pomodoro, where music flows.

Flodoro is a serverless, local-first Pomodoro timer and task manager. One page: timer controls, local tasks, session history, statistics, themes, notifications, and optional ambient audio from folders the user selects in the browser.

## What it does

- **Pomodoro timer**: Configurable work, short break, and long break durations; start/pause, reset, ±1 minute, postpone break, manual work/break toggle.
- **Tasks**: Add, complete, star, delete, reorder; current task advances after completed work sessions.
- **History and statistics**: Local session and task timeline with safe DOM rendering (`textContent` for user text).
- **Audio**: Local playlist manager via directory picker; Chromium can persist folder handles in IndexedDB. No music is required on deploy.
- **Notifications**: Master switch plus sounds, on-screen toasts, and browser notifications with configurable early reminders.
- **Themes**: Gradient background, accent color, presets, dark/light mode.

## Runtime model

- Static HTML/CSS/JS only; no build step.
- No backend, accounts, or cloud sync.
- App state in `localStorage`; local music folder handles in IndexedDB where supported.
- Hosted demo: https://hiteshgoyal.me/flodoro/
- Anonymous usage analytics via GoatCounter on the hosted page (no account data sent).

## Keyboard shortcuts

| Key | Action |
| --- | --- |
| Space | Start / pause |
| R | Reset |
| P | Postpone break |
| + / - | Add / subtract one minute |
| B or W | Toggle work/break |
| M | Mute/unmute audio |
| V | Play/pause audio |
| T / H / S | Tasks / History / Settings panels |
| Escape | Close open panel |

## Links

- Repository: https://github.com/indianeagle4599/flodoro
- Agent index: https://hiteshgoyal.me/flodoro/llms.txt
