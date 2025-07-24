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
    volume: 0.5
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
  const tasksInputEl = document.getElementById('tasks-input');
  const currentTaskEl = document.getElementById('current-task');

  // Task management state
  let tasks = [];
  let currentTaskIndex = 0;

  // Map audio track identifiers to actual URLs (local or remote)
  const audioSources = {
    track1: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    track2: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
  };

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
    tasks = Array.isArray(stored.tasks) ? stored.tasks : [];
    currentTaskIndex = 0;

    // Apply to input fields
    workInputEl.value = Math.round(workDuration / 60);
    shortBreakInputEl.value = Math.round(shortBreakDuration / 60);
    longBreakInputEl.value = Math.round(longBreakDuration / 60);
    sessionsBeforeLongEl.value = sessionsBeforeLong;
    wallpaperSelectEl.value = wallpaper;
    audioSelectEl.value = audioTrack;
    volumeSliderEl.value = volume;
    colorPickerEl.value = baseColor;
    tasksInputEl.value = tasks.join('\n');

    applyWallpaper(wallpaper);
    applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;

    applyThemeColor(baseColor);

    remainingTime = workDuration;
    updateDisplay();
    updateCurrentTaskDisplay();
    updateAudioProgressVisibility();
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
    // Parse tasks from textarea
    tasks = tasksInputEl.value
      .split(/\r?\n/)
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    currentTaskIndex = 0;

    const prefs = {
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsBeforeLong,
      wallpaper,
      audioTrack,
      volume,
      baseColor,
      tasks
    };
    localStorage.setItem('pomodoroPreferences', JSON.stringify(prefs));

    applyWallpaper(wallpaper);
    applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;
    applyThemeColor(baseColor);

    // Do not reset the timer; just apply new settings for future sessions
    updateAudioProgressVisibility();
    updateCurrentTaskDisplay();
    closeSettings();
  }

  // Apply the chosen wallpaper by updating the #app background image
  function applyWallpaper(filename) {
    appEl.style.backgroundImage = `url('assets/images/${filename}')`;
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
        currentTaskEl.textContent = `Current task: ${tasks[currentTaskIndex]}`;
        currentTaskEl.classList.remove('hidden');
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
  }

  // Start or resume the timer
  function startTimer() {
    if (isRunning) {
      // Pause
      clearInterval(timerInterval);
      isRunning = false;
      startButtonEl.textContent = 'Resume';
      return;
    }

    // If starting for the first time of a session, update the remainingTime accordingly
    // Start/resume
    isRunning = true;
    startButtonEl.textContent = 'Pause';

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
    isRunning = false;
    sessionCount = 0;
    currentSessionType = SESSION.WORK;
    remainingTime = workDuration;
    startButtonEl.textContent = 'Start';
    postponeButtonEl.classList.add('hidden');
    postponeUsed = false;
    updateDisplay();
    updateCurrentTaskDisplay();
  }

  // Transition to the next session based on current state
  function handleSessionEnd() {
    // Send a browser notification if permission granted
    sendNotification(`${currentSessionType} complete!`, currentSessionType === SESSION.WORK ? 'Time for a break.' : 'Back to work.');

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
    } else {
      // Break finished, return to work
      currentSessionType = SESSION.WORK;
      remainingTime = workDuration;
      postponeButtonEl.classList.add('hidden');
    }
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
  }

  // Add or subtract minutes from the current remaining time
  function addMinutes(n) {
    remainingTime += n * 60;
    updateDisplay();
  }
  function subtractMinutes(n) {
    remainingTime = Math.max(1, remainingTime - n * 60);
    updateDisplay();
  }
  // Skip directly to a work session
  function skipToWork() {
    currentSessionType = SESSION.WORK;
    remainingTime = workDuration;
    postponeUsed = false;
    postponeButtonEl.classList.add('hidden');
    updateDisplay();
  }
  // Skip directly to the next break session (short or long depending on cycle)
  function skipToBreak() {
    const nextCount = sessionCount + 1;
    if (nextCount % sessionsBeforeLong === 0) {
      currentSessionType = SESSION.LONG_BREAK;
      remainingTime = longBreakDuration;
    } else {
      currentSessionType = SESSION.SHORT_BREAK;
      remainingTime = shortBreakDuration;
    }
    postponeUsed = false;
    postponeButtonEl.classList.remove('hidden');
    updateDisplay();
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
        skipToBreak();
        break;
      case 'w':
      case 'W':
        skipToWork();
        break;
      case 'm':
      case 'M':
        toggleMute();
        break;
      case 'v':
      case 'V':
        toggleAudio();
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
    if (skipToWorkEl) skipToWorkEl.addEventListener('click', skipToWork);
    if (skipToBreakEl) skipToBreakEl.addEventListener('click', skipToBreak);
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
    // Update theme color on input
    if (colorPickerEl) colorPickerEl.addEventListener('input', () => {
      applyThemeColor(colorPickerEl.value);
    });
    // keyboard support
    document.addEventListener('keydown', handleKeydown);
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