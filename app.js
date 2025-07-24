/*
 * JavaScript logic for the Pomodoro Timer web application.
 *
 * This script manages timer state, session switching, user settings,
 * audio playback, notifications, and user interactions. The goal is
 * to provide a fluid Pomodoro experience with minimal distraction
 * while allowing flexibility in durations, themes and audio.
 */

(() => {
  // Enum for session types
  const SESSION = {
    WORK: 'Work',
    SHORT_BREAK: 'Short Break',
    LONG_BREAK: 'Long Break'
  };

  // Default durations in seconds
  const DEFAULTS = {
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsBeforeLong: 4,
    wallpaper: 'gradient_cool.png',
    audioTrack: 'none',
    volume: 0.5,
    darkMode: false,
    themePreset: 'custom'
  };

  // State variables
  let workDuration = DEFAULTS.workDuration;
  let shortBreakDuration = DEFAULTS.shortBreakDuration;
  let longBreakDuration = DEFAULTS.longBreakDuration;
  let sessionsBeforeLong = DEFAULTS.sessionsBeforeLong;
  let currentSessionType = SESSION.WORK;
  let sessionCount = 0;
  let remainingTime = workDuration;
  let timerInterval = null;
  let isRunning = false;
  let postponeUsed = false;

  // List of available wallpapers for shuffle (will be updated if more assets added)
  const wallpapers = [
    'gradient_cool.png',
    'gradient_warm.png',
    'abstract_green.png',
    'gradient_forest.png',
    'gradient_sunset.png',
    'gradient_pastel.png'
  ];

  // DOM elements
  const appEl = document.getElementById('app');
  const sessionLabelEl = document.getElementById('session-label');
  const timerDisplayEl = document.getElementById('timer-display');
  const startButtonEl = document.getElementById('start-button');
  const resetButtonEl = document.getElementById('reset-button');
  const postponeButtonEl = document.getElementById('postpone-button');
  const settingsButtonEl = document.getElementById('settings-button');
  const settingsPanelEl = document.getElementById('settings-panel');
  const saveSettingsEl = document.getElementById('save-settings');
  const closeSettingsEl = document.getElementById('close-settings');
  const workInputEl = document.getElementById('work-duration');
  const shortBreakInputEl = document.getElementById('short-break-duration');
  const longBreakInputEl = document.getElementById('long-break-duration');
  const sessionsBeforeLongEl = document.getElementById('sessions-before-long');
  const wallpaperSelectEl = document.getElementById('wallpaper-select');
  const audioSelectEl = document.getElementById('audio-select');
  const volumeSliderEl = document.getElementById('volume-slider');
  const audioPlayerEl = document.getElementById('audio-player');
  const darkModeToggleEl = document.getElementById('dark-mode-toggle');

  // Additional DOM elements for enhanced controls and settings
  const secondaryControlsEl = document.getElementById('secondary-controls');
  const addMinuteEl = document.getElementById('add-minute');
  const subtractMinuteEl = document.getElementById('subtract-minute');
  const skipToWorkEl = document.getElementById('skip-to-work');
  const skipToBreakEl = document.getElementById('skip-to-break');
  const audioToggleEl = document.getElementById('audio-toggle');
  const muteToggleEl = document.getElementById('mute-toggle');
  const audioProgressEl = document.getElementById('audio-progress');
  const audioProgressGroupEl = document.querySelector('.audio-progress-group');
  const colorPickerEl = document.getElementById('color-picker');
  const themePresetSelectEl = document.getElementById('theme-preset-select');
  const tasksInputEl = document.getElementById('tasks-input');
  const currentTaskEl = document.getElementById('current-task');

  // New DOM elements for additional features
  const tasksButtonEl = document.getElementById('tasks-button');
  const historyButtonEl = document.getElementById('history-button');
  const modeToggleEl = document.getElementById('mode-toggle');
  const modeMainEl = document.getElementById('mode-main');
  const modeSubEl = document.getElementById('mode-sub');
  const tasksPanelEl = document.getElementById('tasks-panel');
  const historyPanelEl = document.getElementById('history-panel');
  const newTaskInputEl = document.getElementById('new-task-input');
  const addTaskButtonEl = document.getElementById('add-task-button');
  const tasksListEl = document.getElementById('tasks-list');
  const closeTasksEl = document.getElementById('close-tasks');
  const historyListEl = document.getElementById('history-list');
  const clearHistoryEl = document.getElementById('clear-history');
  const closeHistoryEl = document.getElementById('close-history');

  // Additional panels and controls
  const audioSettingsButtonEl = document.getElementById('audio-settings-button');
  const audioPanelEl = document.getElementById('audio-panel');
  const closeAudioEl = document.getElementById('close-audio');
  const statsButtonEl = document.getElementById('stats-button');
  const statsPanelEl = document.getElementById('stats-panel');
  const closeStatsEl = document.getElementById('close-stats');
  const statsSummaryEl = document.getElementById('stats-summary');
  const quoteDisplayEl = document.getElementById('quote-display');

  // Motivational quotes for breaks
  const quotes = [
    "Take a deep breath and smile.",
    "Progress, not perfection.",
    "Small steps every day add up to big results.",
    "Rest is part of the process.",
    "Great things are done by a series of small things brought together."
  ];

  // Task management state
  // Tasks are stored as objects { text: string, done: boolean }
  let tasks = [];
  let currentTaskIndex = 0;

  // Utility: record task events into history with action and text
  function recordTaskEvent(action, text) {
    const timestamp = Date.now();
    history.push({ type: 'Task', action, text, timestamp });
    saveHistory();
    updateHistoryDisplay();
    updateStatsSummary();
  }

  // History of sessions
  let history = [];
  let sessionStartTime = null;
  let sessionTotalTime = null;

  /**
   * Show a random motivational quote in the quote display element. Called at
   * the beginning of a break session. Hides the quote display first and then
   * inserts a new quote.
   */
  function showRandomQuote() {
    if (!quoteDisplayEl) return;
    const index = Math.floor(Math.random() * quotes.length);
    quoteDisplayEl.textContent = quotes[index];
    quoteDisplayEl.classList.remove('hidden');
  }

  /**
   * Hide the quote display element. Called at the beginning of a work session.
   */
  function hideQuote() {
    if (!quoteDisplayEl) return;
    quoteDisplayEl.classList.add('hidden');
  }

  // Map audio track identifiers to actual URLs (local or remote)
  const audioSources = {
    track1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    track2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  };

  /**
   * Compute and display statistics summarising completed sessions and task events.
   * Counts the number of work, short break and long break sessions as well as
   * the number of tasks added, completed and deleted. Updates the stats panel.
   */
  function updateStatsSummary() {
    if (!statsSummaryEl) return;
    const counts = {
      'Work': 0,
      'Short Break': 0,
      'Long Break': 0,
      'Task Added': 0,
      'Task Completed': 0,
      'Task Deleted': 0
    };
    history.forEach((item) => {
      if (item.type === 'Task') {
        const key = `Task ${item.action}`;
        if (counts[key] !== undefined) counts[key]++;
      } else {
        if (counts[item.type] !== undefined) counts[item.type]++;
      }
    });
    // Compose HTML summary
    let html = '';
    html += `<div>Work sessions: ${counts['Work']}</div>`;
    html += `<div>Short breaks: ${counts['Short Break']}</div>`;
    html += `<div>Long breaks: ${counts['Long Break']}</div>`;
    html += `<div>Tasks added: ${counts['Task Added']}</div>`;
    html += `<div>Tasks completed: ${counts['Task Completed']}</div>`;
    html += `<div>Tasks deleted: ${counts['Task Deleted']}</div>`;
    statsSummaryEl.innerHTML = html;
  }

  /*
   * Load preferences from localStorage and apply them to the app. If a
   * preference is not found, use the defaults defined above. This
   * ensures the timer persists user choices across sessions.
   */
  function loadPreferences() {
    const stored = JSON.parse(localStorage.getItem('pomodoroPreferences') || '{}');
    workDuration = parseInt(stored.workDuration || DEFAULTS.workDuration, 10);
    shortBreakDuration = parseInt(stored.shortBreakDuration || DEFAULTS.shortBreakDuration, 10);
    longBreakDuration = parseInt(stored.longBreakDuration || DEFAULTS.longBreakDuration, 10);
    sessionsBeforeLong = parseInt(stored.sessionsBeforeLong || DEFAULTS.sessionsBeforeLong, 10);
    const wallpaper = stored.wallpaper || DEFAULTS.wallpaper;
    const audioTrack = stored.audioTrack || DEFAULTS.audioTrack;
    const volume = typeof stored.volume === 'number' ? stored.volume : DEFAULTS.volume;
    const baseColor = stored.baseColor || '#3b82f6';
    const themePreset = stored.themePreset || DEFAULTS.themePreset;
    const darkMode = typeof stored.darkMode === 'boolean' ? stored.darkMode : DEFAULTS.darkMode;
    // Tasks are loaded separately via loadTasks()
    currentTaskIndex = 0;

    // Apply to input fields
    if (workInputEl) workInputEl.value = Math.round(workDuration / 60);
    if (shortBreakInputEl) shortBreakInputEl.value = Math.round(shortBreakDuration / 60);
    if (longBreakInputEl) longBreakInputEl.value = Math.round(longBreakDuration / 60);
    if (sessionsBeforeLongEl) sessionsBeforeLongEl.value = sessionsBeforeLong;
    if (wallpaperSelectEl) wallpaperSelectEl.value = wallpaper;
    if (audioSelectEl) audioSelectEl.value = audioTrack;
    if (volumeSliderEl) volumeSliderEl.value = volume;
    if (colorPickerEl) colorPickerEl.value = baseColor;
    if (darkModeToggleEl) darkModeToggleEl.checked = darkMode;
    if (themePresetSelectEl) themePresetSelectEl.value = themePreset;

    applyWallpaper(wallpaper);
    applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;

    // Apply theme preset first (which may override base colour) and then the chosen colour.
    applyThemePreset(themePreset);
    applyThemeColor(colorPickerEl.value);
    applyDarkMode(darkMode);

    remainingTime = workDuration;
    updateDisplay();
    updateCurrentTaskDisplay();
    updateAudioProgressVisibility();

    // Load tasks and history separately
    loadTasks();
    loadHistory();

    // Update statistics summary after loading history
    updateStatsSummary();
  }

  /*
   * Save current preferences to localStorage. Called when user clicks
   * the save button in the settings panel. Converts minute inputs
   * into seconds for consistent internal use.
   */
  function savePreferences() {
    workDuration = Math.max(1, parseInt(workInputEl.value, 10)) * 60;
    shortBreakDuration = Math.max(1, parseInt(shortBreakInputEl.value, 10)) * 60;
    longBreakDuration = Math.max(1, parseInt(longBreakInputEl.value, 10)) * 60;
    sessionsBeforeLong = Math.max(1, parseInt(sessionsBeforeLongEl.value, 10));
    const wallpaper = wallpaperSelectEl.value;
    const audioTrack = audioSelectEl.value;
    const volume = parseFloat(volumeSliderEl.value);
    const baseColor = colorPickerEl.value;
    const themePreset = themePresetSelectEl ? themePresetSelectEl.value : 'custom';
    const darkMode = darkModeToggleEl && darkModeToggleEl.checked;
    // Tasks are managed separately; do not modify tasks here
    const prefs = {
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsBeforeLong,
      wallpaper,
      audioTrack,
      volume,
      baseColor,
      darkMode,
      themePreset
    };
    localStorage.setItem('pomodoroPreferences', JSON.stringify(prefs));

    applyWallpaper(wallpaper);
    applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;
    applyThemeColor(baseColor);
    applyDarkMode(darkMode);

    // Do not reset the timer; just apply new settings for future sessions
    updateAudioProgressVisibility();
    updateCurrentTaskDisplay();
    closeSettings();
  }

  // Apply the chosen wallpaper by updating the #app background image
  function applyWallpaper(filename) {
    if (filename === 'shuffle') {
      // Pick a random wallpaper from the available list
      const random = wallpapers[Math.floor(Math.random() * wallpapers.length)];
      appEl.style.backgroundImage = `url('assets/images/${random}')`;
    } else {
      appEl.style.backgroundImage = `url('assets/images/${filename}')`;
    }
  }

  // Apply the chosen audio track
  function applyAudioTrack(track) {
    if (track === 'none') {
      audioPlayerEl.pause();
      audioPlayerEl.removeAttribute('src');
      // Hide progress when no audio
      if (audioProgressGroupEl) audioProgressGroupEl.classList.add('hidden');
    } else {
      const src = audioSources[track];
      if (src) {
        audioPlayerEl.src = src;
        audioPlayerEl.loop = true;
        // Preload may be blocked by browser until user interaction
        audioPlayerEl.load();
        if (audioProgressGroupEl) audioProgressGroupEl.classList.remove('hidden');
      }
    }
  }

  // Format seconds into MM:SS string
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /*
   * Apply a base colour to the theme. Generates lighter and darker
   * variants and updates CSS variables accordingly. Accepts a hex
   * colour string, e.g. '#3b82f6'. Uses HSL conversion to adjust
   * lightness. This allows users to pick any accent colour and have
   * the UI adjust automatically.
   */
  function applyThemeColor(hex) {
    function hexToHsl(hexColor) {
      const r = parseInt(hexColor.substring(1, 3), 16) / 255;
      const g = parseInt(hexColor.substring(3, 5), 16) / 255;
      const b = parseInt(hexColor.substring(5, 7), 16) / 255;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      let h, s, l;
      l = (max + min) / 2;
      if (max === min) {
        h = s = 0;
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          default:
            h = (r - g) / d + 4;
        }
        h /= 6;
      }
      return { h, s, l };
    }
    function hslToHex(h, s, l) {
      const hueToRgb = (p, q, t) => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      let r, g, b;
      if (s === 0) {
        r = g = b = l;
      } else {
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hueToRgb(p, q, h + 1 / 3);
        g = hueToRgb(p, q, h);
        b = hueToRgb(p, q, h - 1 / 3);
      }
      const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }
    const hsl = hexToHsl(hex);
    const lighter = hslToHex(hsl.h, hsl.s, Math.min(1, hsl.l * 1.2));
    const darker = hslToHex(hsl.h, hsl.s, Math.max(0, hsl.l * 0.8));
    const root = document.documentElement;
    root.style.setProperty('--color-accent', hex);
    root.style.setProperty('--color-accent-light', lighter);
    root.style.setProperty('--color-accent-dark', darker);
  }

  /**
   * Apply a predefined theme preset by updating the accent colour. When a preset
   * is chosen, the colour picker is set to that colour and the accent
   * variables are recalculated via applyThemeColor(). If 'custom' is
   * selected, the colour picker retains its current value. Supported
   * presets draw inspiration from Apple’s palette: Apple Blue, Apple Green
   * and Apple Pink. Users can still fine‑tune the colour via the picker.
   */
  function applyThemePreset(preset) {
    let colour;
    switch (preset) {
      case 'apple-blue':
        colour = '#007AFF';
        break;
      case 'apple-green':
        colour = '#34C759';
        break;
      case 'apple-pink':
        colour = '#FF2D55';
        break;
      default:
        // Custom: do not change the colour
        return;
    }
    // Update the colour picker and apply new colour
    if (colorPickerEl) {
      colorPickerEl.value = colour;
    }
    applyThemeColor(colour);
  }

  /**
   * Apply or remove dark mode by setting CSS variables on the root. When
   * enabled, the primary text colour becomes light, the secondary colour
   * becomes muted and the overlay remains dark. When disabled (light mode),
   * colours invert to a lighter palette. This approach avoids toggling
   * classes throughout the markup and keeps the UI minimal.
   */
  function applyDarkMode(enabled) {
    const root = document.documentElement;
    if (enabled) {
      root.style.setProperty('--color-primary', '#ffffff');
      root.style.setProperty('--color-secondary', '#d1d5db');
      root.style.setProperty('--color-bg-overlay', 'rgba(0,0,0,0.35)');
      // Dark panels: use a translucent dark background for frosted glass effect
      root.style.setProperty('--panel-bg', 'rgba(17, 24, 39, 0.75)');
    } else {
      // Light mode: invert colours for a brighter interface reminiscent of macOS
      root.style.setProperty('--color-primary', '#1f2937');
      root.style.setProperty('--color-secondary', '#374151');
      root.style.setProperty('--color-bg-overlay', 'rgba(255,255,255,0.4)');
      // Light panels: use translucent light background
      root.style.setProperty('--panel-bg', 'rgba(255, 255, 255, 0.6)');
    }
  }

  // Show or hide the audio progress bar depending on whether a track is loaded
  function updateAudioProgressVisibility() {
    if (!audioProgressGroupEl) return;
    if (audioPlayerEl && audioPlayerEl.src) {
      audioProgressGroupEl.classList.remove('hidden');
    } else {
      audioProgressGroupEl.classList.add('hidden');
    }
  }

  // Update the on‑screen task label
  function updateCurrentTaskDisplay() {
    if (currentTaskEl) {
    if (tasks.length > 0 && currentTaskIndex < tasks.length) {
        const current = tasks[currentTaskIndex];
        // Skip completed tasks
        if (current.done) {
          // Find next incomplete task
          let idx = currentTaskIndex;
          while (idx < tasks.length && tasks[idx].done) idx++;
          currentTaskIndex = idx;
        }
        if (currentTaskIndex < tasks.length) {
          currentTaskEl.textContent = `Current task: ${tasks[currentTaskIndex].text}`;
          currentTaskEl.classList.remove('hidden');
        } else {
          currentTaskEl.classList.add('hidden');
        }
      } else {
        currentTaskEl.classList.add('hidden');
      }
    }
  }

  // Update audio progress slider
  function updateAudioProgressBar() {
    if (!audioProgressEl || !audioPlayerEl) return;
    if (audioPlayerEl.duration && !isNaN(audioPlayerEl.duration)) {
      const progress = (audioPlayerEl.currentTime / audioPlayerEl.duration) * 100;
      audioProgressEl.value = progress;
    }
  }

  // Seek audio track to a percentage
  function seekAudio() {
    if (audioPlayerEl && audioPlayerEl.duration && !isNaN(audioPlayerEl.duration)) {
      const target = (parseFloat(audioProgressEl.value) / 100) * audioPlayerEl.duration;
      audioPlayerEl.currentTime = target;
    }
  }
  // Update the timer display and session label
  function updateDisplay() {
    timerDisplayEl.textContent = formatTime(remainingTime);
    sessionLabelEl.textContent = currentSessionType;
    updateModeToggle();
  }

  // Start or resume the timer
  function startTimer() {
    if (isRunning) {
      // Pause
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      startButtonEl.textContent = 'Resume';
      return;
    }

    // Starting or resuming
    isRunning = true;
    startButtonEl.textContent = 'Pause';
    // If this is the first time starting this session, set start time and total time
    if (sessionStartTime === null) {
      sessionStartTime = Date.now();
      sessionTotalTime = remainingTime;
    }
    // If audio is selected and not already playing, start it
    if (audioPlayerEl.src && audioPlayerEl.paused) {
      audioPlayerEl.play().catch(() => {
        // Autoplay might be blocked until user interacts, ignore
      });
    }
    timerInterval = setInterval(() => {
      remainingTime--;
      updateDisplay();
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        handleSessionEnd();
      }
      // Update audio progress each tick
      updateAudioProgressBar();
    }, 1000);
  }

  // Reset timer to initial values based on current preferences
  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    sessionCount = 0;
    currentSessionType = SESSION.WORK;
    remainingTime = workDuration;
    startButtonEl.textContent = 'Start';
    postponeButtonEl.classList.add('hidden');
    postponeUsed = false;
    sessionStartTime = null;
    sessionTotalTime = null;
    updateDisplay();
    updateCurrentTaskDisplay();
    hideQuote();
  }

  // Transition to the next session based on current state
  function handleSessionEnd() {
    // Send a browser notification if permission granted
    sendNotification(`${currentSessionType} complete!`, currentSessionType === SESSION.WORK ? 'Time for a break.' : 'Back to work.');

    // Record the finished session
    recordSession();

    if (currentSessionType === SESSION.WORK) {
      sessionCount++;
      // Move to next task at the end of a work session
      if (tasks.length > 0 && currentTaskIndex < tasks.length) {
        currentTaskIndex++;
      }
      updateCurrentTaskDisplay();
      // Determine if it should be a long break
      if (sessionCount % sessionsBeforeLong === 0) {
        currentSessionType = SESSION.LONG_BREAK;
        remainingTime = longBreakDuration;
      } else {
        currentSessionType = SESSION.SHORT_BREAK;
        remainingTime = shortBreakDuration;
      }
      postponeUsed = false;
      postponeButtonEl.classList.remove('hidden');
      // Show a random quote for break
      showRandomQuote();
    } else {
      // Break finished, return to work
      currentSessionType = SESSION.WORK;
      remainingTime = workDuration;
      postponeButtonEl.classList.add('hidden');
      // Hide quote when returning to work
      hideQuote();
    }
    // If wallpaper is set to shuffle, pick a new random wallpaper for each session
    if (wallpaperSelectEl && wallpaperSelectEl.value === 'shuffle') {
      applyWallpaper('shuffle');
    }
    // Reset for next session; new startTime will be set in startTimer()
    sessionStartTime = null;
    sessionTotalTime = null;
    updateDisplay();
    // Automatically start next session
    startTimer();
  }

  // Send a notification if allowed
  function sendNotification(title, body) {
    if (Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  }

  // Toggle settings panel visibility
  function openSettings() {
    // If already open, close it
    if (!settingsPanelEl.classList.contains('hidden')) {
      closeSettings();
      return;
    }
    // Close other panels before opening settings
    closeTasks();
    closeHistory();
    closeAudio();
    closeStats();
    settingsPanelEl.classList.remove('hidden');
    settingsPanelEl.classList.add('slideout');
    // Pause timer when settings open
    if (isRunning) {
      startTimer();
    }
  }

  function closeSettings() {
    settingsPanelEl.classList.add('hidden');
    settingsPanelEl.classList.remove('slideout');
  }

  // Postpone the current break by adding 5 minutes; can be used only once per break
  function postponeBreak() {
    if (postponeUsed || currentSessionType === SESSION.WORK) return;
    remainingTime += 5 * 60;
    postponeUsed = true;
    postponeButtonEl.classList.add('hidden');
    updateDisplay();
    // Adjust total time for history
    if (sessionTotalTime !== null) {
      sessionTotalTime += 5 * 60;
    }
  }

  // Add or subtract minutes from the current remaining time
  function addMinutes(n) {
    remainingTime += n * 60;
    updateDisplay();
    if (sessionTotalTime !== null) {
      sessionTotalTime += n * 60;
    }
  }
  function subtractMinutes(n) {
    remainingTime = Math.max(1, remainingTime - n * 60);
    updateDisplay();
    if (sessionTotalTime !== null) {
      sessionTotalTime = Math.max(1, sessionTotalTime - n * 60);
    }
  }
  // Skip directly to a work session
  function skipToWork() {
    // Record the current session before switching
    recordSession();
    currentSessionType = SESSION.WORK;
    remainingTime = workDuration;
    sessionStartTime = null;
    sessionTotalTime = null;
    postponeUsed = false;
    postponeButtonEl.classList.add('hidden');
    updateDisplay();
    // Hide quote when manually switching to work
    hideQuote();
    // Shuffle wallpaper if enabled
    if (wallpaperSelectEl && wallpaperSelectEl.value === 'shuffle') {
      applyWallpaper('shuffle');
    }
  }
  // Skip directly to the next break session (short or long depending on cycle)
  function skipToBreak() {
    // Record the current session before switching
    recordSession();
    const nextCount = sessionCount + 1;
    if (nextCount % sessionsBeforeLong === 0) {
      currentSessionType = SESSION.LONG_BREAK;
      remainingTime = longBreakDuration;
    } else {
      currentSessionType = SESSION.SHORT_BREAK;
      remainingTime = shortBreakDuration;
    }
    sessionStartTime = null;
    sessionTotalTime = null;
    postponeUsed = false;
    postponeButtonEl.classList.remove('hidden');
    updateDisplay();
    // Show a random quote when manually switching to break
    showRandomQuote();
    // Shuffle wallpaper if enabled
    if (wallpaperSelectEl && wallpaperSelectEl.value === 'shuffle') {
      applyWallpaper('shuffle');
    }
  }

  // Toggle session mode between work and break via mode toggle UI or keyboard
  function toggleSessionMode() {
    // Add rotate animation class to mode toggle for 3D flip
    if (modeToggleEl) {
      modeToggleEl.classList.add('rotated');
      setTimeout(() => {
        modeToggleEl.classList.remove('rotated');
      }, 600);
    }
    if (currentSessionType === SESSION.WORK) {
      skipToBreak();
    } else {
      skipToWork();
    }
    updateDisplay();
  }

  // Update mode toggle text to reflect current and next session types
  function updateModeToggle() {
    if (!modeMainEl || !modeSubEl) return;
    if (currentSessionType === SESSION.WORK) {
      modeMainEl.textContent = 'Work';
      modeSubEl.textContent = 'Break';
    } else {
      // Both short and long breaks are simply labelled break
      modeMainEl.textContent = 'Break';
      modeSubEl.textContent = 'Work';
    }
  }

  /**
   * History and tasks management
   */
  // Load tasks from localStorage (pomodoroTasks) and convert to array of objects
  function loadTasks() {
    try {
      const storedTasks = JSON.parse(localStorage.getItem('pomodoroTasks') || '[]');
      if (Array.isArray(storedTasks)) {
        tasks = storedTasks.map((t) => {
          if (typeof t === 'string') return { text: t, done: false };
          // Already an object
          return { text: t.text || '', done: !!t.done };
        });
      } else {
        tasks = [];
      }
    } catch (e) {
      tasks = [];
    }
    currentTaskIndex = 0;
    updateCurrentTaskDisplay();
    updateTasksList();
  }

  // Save tasks to localStorage
  function saveTasks() {
    localStorage.setItem('pomodoroTasks', JSON.stringify(tasks));
  }

  // Render tasks into the tasks panel list
  function updateTasksList() {
    if (!tasksListEl) return;
    // Clear existing list
    tasksListEl.innerHTML = '';
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        const wasDone = task.done;
        task.done = checkbox.checked;
        // Log completion event when transitioning from not done to done
        if (!wasDone && task.done) {
          recordTaskEvent('Completed', task.text);
        }
        // If marking a task done before currentTaskIndex, update index
        if (checkbox.checked && index === currentTaskIndex && currentTaskIndex < tasks.length) {
          currentTaskIndex++;
          updateCurrentTaskDisplay();
        }
        saveTasks();
        updateTasksList();
      });
      const span = document.createElement('span');
      span.textContent = task.text;
      if (task.done) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.6';
      }
      // Delete button for each task
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.className = 'delete-button';
      delBtn.addEventListener('click', () => {
        const removed = tasks.splice(index, 1)[0];
        // Adjust currentTaskIndex if necessary
        if (index < currentTaskIndex) {
          currentTaskIndex--;
        } else if (index === currentTaskIndex) {
          // Current task was removed; currentTaskIndex now points to same index
          // but tasks length decreased; update display accordingly
        }
        recordTaskEvent('Deleted', removed.text);
        saveTasks();
        updateTasksList();
        updateCurrentTaskDisplay();
      });
      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(delBtn);
      tasksListEl.appendChild(li);
    });
  }

  // Add a new task from input field
  function addTask() {
    if (!newTaskInputEl) return;
    const value = newTaskInputEl.value.trim();
    if (value.length === 0) return;
    tasks.push({ text: value, done: false });
    newTaskInputEl.value = '';
    saveTasks();
    updateTasksList();
    updateCurrentTaskDisplay();
    // Record task addition event
    recordTaskEvent('Added', value);
  }

  // Open and close tasks panel
  function openTasks() {
    if (tasksPanelEl.classList.contains('hidden')) {
      // Close other panels first
      closeSettings();
      closeHistory();
      tasksPanelEl.classList.remove('hidden');
      tasksPanelEl.classList.add('slideout');
    } else {
      closeTasks();
    }
  }
  function closeTasks() {
    tasksPanelEl.classList.add('hidden');
    tasksPanelEl.classList.remove('slideout');
  }

  // Load history from localStorage
  function loadHistory() {
    try {
      const storedHistory = JSON.parse(localStorage.getItem('pomodoroHistory') || '[]');
      if (Array.isArray(storedHistory)) {
        history = storedHistory;
      } else {
        history = [];
      }
    } catch (e) {
      history = [];
    }
    updateHistoryDisplay();
  }
  // Save history to localStorage
  function saveHistory() {
    localStorage.setItem('pomodoroHistory', JSON.stringify(history));
  }

  // Record the current session to history if a session is in progress
  function recordSession() {
    if (!sessionStartTime || sessionTotalTime === null) return;
    const endTime = Date.now();
    const elapsed = Math.floor((endTime - sessionStartTime) / 1000);
    history.push({
      type: currentSessionType,
      start: sessionStartTime,
      end: endTime,
      duration: sessionTotalTime,
      elapsed: elapsed
    });
    saveHistory();
    updateHistoryDisplay();
    updateStatsSummary();
    // Reset start time so that we don't double-record
    sessionStartTime = null;
    sessionTotalTime = null;
  }

  // Render history list into history panel
  function updateHistoryDisplay() {
    if (!historyListEl) return;
    historyListEl.innerHTML = '';
    history.forEach((item) => {
      const li = document.createElement('li');
      // Distinguish between session entries and task events
      if (item.type === 'Task') {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Show action (Added/Completed/Deleted) and task text
        li.innerHTML = `<span>${item.action} task</span><span>${item.text} @ ${timeStr}</span>`;
      } else {
        // Format start and end times to local time strings
        const startDate = new Date(item.start);
        const endDate = new Date(item.end);
        const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const durationMinutes = Math.floor(item.elapsed / 60);
        const durationSeconds = item.elapsed % 60;
        const durationStr = `${durationMinutes}:${String(durationSeconds).padStart(2, '0')}`;
        li.innerHTML = `<span>${item.type}</span><span>${startStr}–${endStr} (${durationStr})</span>`;
      }
      historyListEl.appendChild(li);
    });
  }

  // Clear history entirely
  function clearHistory() {
    history = [];
    saveHistory();
    updateHistoryDisplay();
  }

  // Open and close history panel
  function openHistory() {
    if (historyPanelEl.classList.contains('hidden')) {
      // Close other panels
      closeSettings();
      closeTasks();
      historyPanelEl.classList.remove('hidden');
      historyPanelEl.classList.add('slideout');
    } else {
      closeHistory();
    }
  }
  function closeHistory() {
    historyPanelEl.classList.add('hidden');
    historyPanelEl.classList.remove('slideout');
  }

  /** Audio settings panel functions */
  function openAudio() {
    if (audioPanelEl.classList.contains('hidden')) {
      // Close other panels
      closeSettings();
      closeTasks();
      closeHistory();
      closeStats();
      audioPanelEl.classList.remove('hidden');
      audioPanelEl.classList.add('slideout');
    } else {
      closeAudio();
    }
  }
  function closeAudio() {
    audioPanelEl.classList.add('hidden');
    audioPanelEl.classList.remove('slideout');
  }

  /** Statistics panel functions */
  function openStats() {
    if (statsPanelEl.classList.contains('hidden')) {
      closeSettings();
      closeTasks();
      closeHistory();
      closeAudio();
      statsPanelEl.classList.remove('hidden');
      statsPanelEl.classList.add('slideout');
      updateStatsSummary();
    } else {
      closeStats();
    }
  }
  function closeStats() {
    statsPanelEl.classList.add('hidden');
    statsPanelEl.classList.remove('slideout');
  }
  // Toggle audio playback independently of the timer
  function toggleAudio() {
    if (!audioPlayerEl || !audioPlayerEl.src) return;
    if (audioPlayerEl.paused) {
      audioPlayerEl.play().catch(() => {});
      if (audioToggleEl) audioToggleEl.textContent = '🔈';
    } else {
      audioPlayerEl.pause();
      if (audioToggleEl) audioToggleEl.textContent = '🔇';
    }
  }
  // Toggle mute/unmute, remembering the previous volume
  let previousVolume = DEFAULTS.volume;
  function toggleMute() {
    if (!muteToggleEl) return;
    if (audioPlayerEl.volume > 0) {
      previousVolume = audioPlayerEl.volume;
      audioPlayerEl.volume = 0;
      volumeSliderEl.value = 0;
      muteToggleEl.textContent = '🔇';
    } else {
      audioPlayerEl.volume = previousVolume;
      volumeSliderEl.value = previousVolume;
      muteToggleEl.textContent = '🔊';
    }
  }

  // Keyboard shortcuts for accessibility and convenience
  function handleKeydown(e) {
    const tag = e.target.tagName.toLowerCase();
    // Avoid interfering with input fields
    if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        startTimer();
        break;
      case 'r':
      case 'R':
        resetTimer();
        break;
      case 's':
      case 'S':
        openSettings();
        break;
      case 'p':
      case 'P':
        postponeBreak();
        break;
      case 'Escape':
        if (!settingsPanelEl.classList.contains('hidden')) {
          closeSettings();
        }
        break;
      case '+':
      case '=': // shift plus on some keyboards
        addMinutes(1);
        break;
      case '-':
      case '_':
        subtractMinutes(1);
        break;
      case 'b':
      case 'B':
      case 'w':
      case 'W':
        // Toggle session mode for both b and w keys
        toggleSessionMode();
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'v':
      case 'V':
        toggleAudio();
        break;
      case 't':
      case 'T':
        openTasks();
        break;
      case 'h':
      case 'H':
        openHistory();
        break;
      default:
        break;
    }
  }

  // Request notification permission on load
  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }

  // Attach event listeners
  function attachEventListeners() {
    startButtonEl.addEventListener('click', startTimer);
    resetButtonEl.addEventListener('click', resetTimer);
    postponeButtonEl.addEventListener('click', postponeBreak);
    settingsButtonEl.addEventListener('click', openSettings);
    saveSettingsEl.addEventListener('click', savePreferences);
    closeSettingsEl.addEventListener('click', () => {
      closeSettings();
      // reload preferences to revert unsaved changes
      loadPreferences();
    });
    volumeSliderEl.addEventListener('input', () => {
      audioPlayerEl.volume = parseFloat(volumeSliderEl.value);
    });
    // Secondary controls
    if (addMinuteEl) addMinuteEl.addEventListener('click', () => addMinutes(1));
    if (subtractMinuteEl) subtractMinuteEl.addEventListener('click', () => subtractMinutes(1));
    // Skip buttons removed; session toggle handled by mode toggle
    if (audioToggleEl) audioToggleEl.addEventListener('click', toggleAudio);
    if (muteToggleEl) muteToggleEl.addEventListener('click', toggleMute);
    if (audioProgressEl) audioProgressEl.addEventListener('input', seekAudio);
    // Close settings when clicking outside panel
    document.addEventListener('click', (e) => {
      if (!settingsPanelEl.classList.contains('hidden')) {
        const target = e.target;
        if (!settingsPanelEl.contains(target) && target !== settingsButtonEl) {
          // Save current timer state
          const savedState = {
            remainingTime,
            currentSessionType,
            sessionCount,
            postponeUsed,
            currentTaskIndex,
            isRunning
          };
          closeSettings();
          // reload preferences to revert changes in settings UI
          loadPreferences();
          // Restore timer state and UI
          remainingTime = savedState.remainingTime;
          currentSessionType = savedState.currentSessionType;
          sessionCount = savedState.sessionCount;
          postponeUsed = savedState.postponeUsed;
          currentTaskIndex = savedState.currentTaskIndex;
          updateDisplay();
          updateCurrentTaskDisplay();
          // If timer was running before opening settings, resume
          if (savedState.isRunning) {
            startTimer();
          } else {
            startButtonEl.textContent = 'Resume';
          }
        }
      }
    });
    // Close tasks panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!tasksPanelEl.classList.contains('hidden')) {
        const target = e.target;
        if (!tasksPanelEl.contains(target) && target !== tasksButtonEl) {
          closeTasks();
        }
      }
    });
    // Close history panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!historyPanelEl.classList.contains('hidden')) {
        const target = e.target;
        if (!historyPanelEl.contains(target) && target !== historyButtonEl) {
          closeHistory();
        }
      }
    });
    // Mode toggle click
    if (modeToggleEl) modeToggleEl.addEventListener('click', toggleSessionMode);
    // Tasks and history buttons
    if (tasksButtonEl) tasksButtonEl.addEventListener('click', openTasks);
    if (historyButtonEl) historyButtonEl.addEventListener('click', openHistory);
    // Close buttons inside panels
    if (closeTasksEl) closeTasksEl.addEventListener('click', closeTasks);
    if (closeHistoryEl) closeHistoryEl.addEventListener('click', closeHistory);
    // Add task button
    if (addTaskButtonEl) addTaskButtonEl.addEventListener('click', addTask);
    // Enter key on new task input
    if (newTaskInputEl) newTaskInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addTask();
      }
    });
    // Clear history button
    if (clearHistoryEl) clearHistoryEl.addEventListener('click', clearHistory);
    // Update theme color on input
    if (colorPickerEl) colorPickerEl.addEventListener('input', () => {
      // When the user picks a custom colour, set preset to custom
      if (themePresetSelectEl) themePresetSelectEl.value = 'custom';
      applyThemeColor(colorPickerEl.value);
      // Save updated colour and preset immediately
      const prefs = JSON.parse(localStorage.getItem('pomodoroPreferences') || '{}');
      prefs.baseColor = colorPickerEl.value;
      prefs.themePreset = 'custom';
      localStorage.setItem('pomodoroPreferences', JSON.stringify(prefs));
    });
    // Dark mode toggle
    if (darkModeToggleEl) darkModeToggleEl.addEventListener('change', () => {
      const enabled = darkModeToggleEl.checked;
      applyDarkMode(enabled);
      // Save dark mode preference immediately
      const prefs = JSON.parse(localStorage.getItem('pomodoroPreferences') || '{}');
      prefs.darkMode = enabled;
      localStorage.setItem('pomodoroPreferences', JSON.stringify(prefs));
    });
    // Theme preset selection
    if (themePresetSelectEl) themePresetSelectEl.addEventListener('change', () => {
      const preset = themePresetSelectEl.value;
      applyThemePreset(preset);
      // Save preset and base colour immediately
      const prefs = JSON.parse(localStorage.getItem('pomodoroPreferences') || '{}');
      prefs.themePreset = preset;
      // If the preset is not custom, update baseColour in preferences to preserve colour across reloads
      if (preset !== 'custom') {
        prefs.baseColor = colorPickerEl.value;
      }
      localStorage.setItem('pomodoroPreferences', JSON.stringify(prefs));
    });
    // keyboard support
    document.addEventListener('keydown', handleKeydown);

    // Close audio panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!audioPanelEl.classList.contains('hidden')) {
        const target = e.target;
        if (!audioPanelEl.contains(target) && target !== audioSettingsButtonEl) {
          closeAudio();
        }
      }
    });
    // Close stats panel when clicking outside
    document.addEventListener('click', (e) => {
      if (!statsPanelEl.classList.contains('hidden')) {
        const target = e.target;
        if (!statsPanelEl.contains(target) && target !== statsButtonEl) {
          closeStats();
        }
      }
    });

    // Audio settings button and close button
    if (audioSettingsButtonEl) audioSettingsButtonEl.addEventListener('click', openAudio);
    if (closeAudioEl) closeAudioEl.addEventListener('click', closeAudio);
    // Stats button and close button
    if (statsButtonEl) statsButtonEl.addEventListener('click', openStats);
    if (closeStatsEl) closeStatsEl.addEventListener('click', closeStats);
  }

  // Initialise application
  function init() {
    loadPreferences();
    requestNotificationPermission();
    attachEventListeners();
    updateDisplay();
    updateCurrentTaskDisplay();
    updateAudioProgressVisibility();
  }

  // Kick things off when DOM is ready
  document.addEventListener('DOMContentLoaded', init);
})();