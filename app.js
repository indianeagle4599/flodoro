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

    // Apply to input fields
    workInputEl.value = Math.round(workDuration / 60);
    shortBreakInputEl.value = Math.round(shortBreakDuration / 60);
    longBreakInputEl.value = Math.round(longBreakDuration / 60);
    sessionsBeforeLongEl.value = sessionsBeforeLong;
    wallpaperSelectEl.value = wallpaper;
    audioSelectEl.value = audioTrack;
    volumeSliderEl.value = volume;

    applyWallpaper(wallpaper);
    applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;

    remainingTime = workDuration;
    updateDisplay();
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

    const prefs = {
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsBeforeLong,
      wallpaper,
      audioTrack,
      volume
    };
    localStorage.setItem('pomodoroPreferences', JSON.stringify(prefs));

    applyWallpaper(wallpaper);
    applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;

    // Reset timer to reflect new durations
    resetTimer();
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
    } else {
      const src = audioSources[track];
      if (src) {
        audioPlayerEl.src = src;
        audioPlayerEl.loop = true;
        // Preload may be blocked by browser until user interaction
        audioPlayerEl.load();
      }
    }
  }

  // Format seconds into MM:SS string
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
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
  }

  // Transition to the next session based on current state
  function handleSessionEnd() {
    // Send a browser notification if permission granted
    sendNotification(`${currentSessionType} complete!`, currentSessionType === SESSION.WORK ? 'Time for a break.' : 'Back to work.');

    if (currentSessionType === SESSION.WORK) {
      sessionCount++;
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
    settingsPanelEl.classList.remove('hidden');
    // Pause timer when settings open
    if (isRunning) {
      startTimer();
    }
  }

  function closeSettings() {
    settingsPanelEl.classList.add('hidden');
  }

  // Postpone the current break by adding 5 minutes; can be used only once per break
  function postponeBreak() {
    if (postponeUsed || currentSessionType === SESSION.WORK) return;
    remainingTime += 5 * 60;
    postponeUsed = true;
    postponeButtonEl.classList.add('hidden');
    updateDisplay();
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
    // keyboard support
    document.addEventListener('keydown', handleKeydown);
  }

  // Initialise application
  function init() {
    loadPreferences();
    requestNotificationPermission();
    attachEventListeners();
    updateDisplay();
  }

  // Kick things off when DOM is ready
  document.addEventListener('DOMContentLoaded', init);
})();