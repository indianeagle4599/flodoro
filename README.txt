Pomodoro Timer Web Application
===============================

This project provides a feature‑rich yet minimal Pomodoro timer designed to help you stay focused and healthy during long work sessions.  It grew from the need to manage focus sessions while recovering from a pulmonary embolism, so it emphasises regular breaks, pleasant audio/visual ambience and customisability.

Current Features
----------------

* **Configurable Pomodoro sessions** – Set work duration, short break, long break and the number of work sessions before a long break in the Settings panel.
* **Work/Break toggle** – A large, two‑line mode toggle displays the current session (`Work` or `Break`) and the next session.  When you hover over the toggle it highlights; clicking it rotates along the **x‑axis** (like flipping a card) and instantly switches between work and break.  The old skip buttons have been removed.
* **Non‑intrusive slide‑out menus** – Settings, Tasks and History each live in their own slide‑out panel accessed via the header icons.  Panels close when you click outside them or press Escape.
* **Timer controls** – Start/Pause, Reset and Postpone Break controls, plus secondary controls to add or subtract one minute.  Keyboard shortcuts mirror these functions (Space toggles play/pause, `+`/`-` adjusts time, `p` postpones breaks, etc.).
* **Backgrounds and themes** – Choose from several included wallpapers (or add your own) and pick any accent colour.  A **Pastel Gradient** inspired by Apple’s iOS wallpaper has been added to the gallery.  Accent colours can now be selected via **theme presets** (Apple Blue, Green and Pink) or a custom colour picker.  The accent colour generates lighter and darker shades automatically for a cohesive look.  You can also enable **shuffle** to cycle through all backgrounds at the start of each session and toggle **dark mode** for a macOS‑like light or dark appearance.  Slide‑out panels now feature a frosted‑glass effect with blur and translucent backgrounds reminiscent of macOS windows.
* **Audio playback** – A dedicated audio panel (accessed via the 🎵 icon) lets you choose a focus track (or silence), adjust volume with a responsive slider whose knob enlarges when dragged, toggle mute, and scrub through the track with a progress bar.
* **Task manager** – Tasks are managed in a dedicated panel.  Add tasks one at a time, mark them complete with checkboxes, or delete them entirely using the 🗑️ button.  The current task appears below the timer and automatically advances after each completed work session or when you mark a task done.
* **Session & task history** – The app records each completed work or break session (start/end time and elapsed time) **and** each task event (added, completed or deleted).  View all entries in the History panel and clear it if you need a fresh start.  Task events display the action and time they occurred.
* **Statistics dashboard** – A new statistics panel (📈 icon) summarises how many work sessions, short breaks and long breaks you’ve completed as well as the number of tasks added, completed and deleted.  Counts update automatically whenever a session finishes or a task event occurs.
* **Motivational quotes** – During break sessions, a random quote appears under the timer to encourage rest and reflection.  Quotes hide automatically when you return to work.
* **Notifications** – When a session ends, the app can send a browser notification reminding you to start the next one (requires one‑time permission).
* **Persistent settings** – All preferences, tasks and history are saved to `localStorage`, so they persist across page reloads.

* **Helpful tooltips** – Header icons for Tasks, History, Statistics, Audio and Settings now have concise tooltips that appear on hover, making the UI self‑explanatory without adding visual noise.

Keyboard Shortcuts
------------------

* **Space** – Start/pause the timer
* **R** – Reset the timer
* **P** – Postpone a break (adds five minutes; once per break)
* **+ / -** – Add or subtract one minute
* **B or W** – Toggle between work and break
* **M** – Mute/unmute audio
* **V** – Play/pause audio
* **T** – Open/close the Tasks panel
* **H** – Open/close the History panel
* **S** – Open/close the Settings panel
* **Escape** – Close any open panel

Future Improvements
-------------------

The following enhancements are planned or under consideration:

* **Richer statistics and charts** – The current statistics panel shows simple counts.  Future iterations could visualise daily/weekly productivity with bar charts or graphs, and allow exporting data.
* **Ambient sound mixing** – Provide multiple ambient sound layers (e.g., rain, café noise, white noise) that can be toggled on/off and mixed with music.
* **Video and custom media playlists** – Allow users to drop folders of audio, images or loopable videos into `assets/` and select them by genre (e.g., deep focus, jazz club, library).  A processing script (`process_video.py`) is included to trim and loop YouTube videos when run locally.
* **Progressive Web App (PWA)** – Package the site as an installable app with offline capability and notifications even when the browser is closed.
* **Theme presets and automatic dark mode** – Offer curated colour palettes and automatic switching based on time of day.
* **Cross‑device sync** – Sync tasks, settings and history via a remote service for use on multiple devices (requires back‑end).

To contribute or customise further, see the source files in this directory.  The core logic resides in `app.js`, while styles live in `style.css`.  Feel free to modify or extend the code – it is written with modularity and readability in mind.