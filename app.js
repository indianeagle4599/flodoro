/*
 * JavaScript logic for the Flodoro web application.
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
    // Durations (seconds)
    workDuration: 25 * 60,
    shortBreakDuration: 5 * 60,
    longBreakDuration: 15 * 60,
    sessionsBeforeLong: 4,

    // Background gradient base colours
    bgColor1: '#3358a2',
    bgColor2: '#8f5bbb',

    // Audio
    audioGenre: 'none',   // initial genre visible in the selector
    audioTrack: 'none',   // initial track
    volume: 0.5,

    // Theme
    darkMode: true,
    themePreset: 'custom',

    // Notifications
    notificationMuted: false,
    notificationSoundsEnabled: true,
    notificationVisualAlertsEnabled: true
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

  // Track dark mode state (true = dark, false = light)
  let darkMode = DEFAULTS.darkMode;

  // Background gradient colours (hex strings)
  let bgColor1 = DEFAULTS.bgColor1;
  let bgColor2 = DEFAULTS.bgColor2;

  // Audio genre (category)
  let audioGenre = DEFAULTS.audioGenre;

  // Notification settings: timing plus output channels.
  let notificationMuted = DEFAULTS.notificationMuted;
  let notificationSoundsEnabled = DEFAULTS.notificationSoundsEnabled;
  let notificationVisualAlertsEnabled = DEFAULTS.notificationVisualAlertsEnabled;
  let notificationTimes = [1, 5];
  let notifyEnd = true;
  let isNotificationActive = false;

  // Quote system state: index of current break quote and user-selected theme quote.
  let currentQuoteIndex = 0;
  let themeQuote = null;


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
  const audioSelectEl = document.getElementById('audio-select');
  const volumeSliderEl = document.getElementById('volume-slider');
  const audioPlayerEl = document.getElementById('audio-player');

  // New background colour pickers for dynamic gradient
  const bgColor1El = document.getElementById('bg-color1');
  const bgColor2El = document.getElementById('bg-color2');

  // New audio controls for genres and playback
  const audioGenreSelectEl = document.getElementById('audio-genre-select');
  const audioPlayPauseEl = document.getElementById('audio-play-pause');
  const prevTrackEl = document.getElementById('prev-track');
  const nextTrackEl = document.getElementById('next-track');

  // Additional DOM elements for enhanced controls and settings
  const addMinuteEl = document.getElementById('add-minute');
  const subtractMinuteEl = document.getElementById('subtract-minute');
  const muteToggleEl = document.getElementById('mute-toggle');
  const audioProgressEl = document.getElementById('audio-progress');
  const audioProgressGroupEl = document.querySelector('.audio-progress-group');
  const localAudioFolderButtonEl = document.getElementById('local-audio-folder-button');
  const clearLocalAudioButtonEl = document.getElementById('clear-local-audio-button');
  const localAudioInputEl = document.getElementById('local-audio-input');
  const localAudioStatusEl = document.getElementById('local-audio-status');
  const localAudioListEl = document.getElementById('local-audio-list');
  const colorPickerEl = document.getElementById('color-picker');
  const themePresetSelectEl = document.getElementById('theme-preset-select');
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

  // New elements: colour mode toggle and flagged tasks display
  const colorModeToggleEl = document.getElementById('color-mode-toggle');
  const flaggedTasksDisplayEl = document.getElementById('flagged-tasks-display');

  // Additional panels and controls
  const audioSettingsButtonEl = document.getElementById('audio-settings-button');
  const audioPanelEl = document.getElementById('audio-panel');
  const closeAudioEl = document.getElementById('close-audio');
  const statsButtonEl = document.getElementById('stats-button');
  const statsPanelEl = document.getElementById('stats-panel');
  const closeStatsEl = document.getElementById('close-stats');
  const statsSummaryEl = document.getElementById('stats-summary');
  const notificationSettingsButtonEl = document.getElementById('notification-settings-button');
  const notificationSettingsSummaryEl = document.getElementById('notification-settings-summary');
  const notificationPanelEl = document.getElementById('notification-panel');
  const backNotificationsEl = document.getElementById('back-notifications');
  const closeNotificationsEl = document.getElementById('close-notifications');
  const playlistPanelEl = document.getElementById('playlist-panel');
  const playlistManagerButtonEl = document.getElementById('playlist-manager-button');
  const playlistManagerSummaryEl = document.getElementById('playlist-manager-summary');
  const backPlaylistEl = document.getElementById('back-playlist');
  const closePlaylistEl = document.getElementById('close-playlist');
  const quoteDisplayEl = document.getElementById('quote-display');

  // Element for displaying the user's theme quote (quote of the day)
  const themeQuoteDisplayEl = document.getElementById('theme-quote-display');
  // Container where notification settings UI will be injected
  const notificationSettingsContainerEl = document.getElementById('notification-settings-container');

  const STORAGE_KEYS = {
    preferences: 'pomodoroPreferences',
    tasks: 'pomodoroTasks',
    history: 'pomodoroHistory',
    themeQuote: 'pomodoroThemeQuote'
  };

  function readStorageValue(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn(`Failed to read ${key}; using fallback.`, e);
      return null;
    }
  }

  function writeStorageValue(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn(`Failed to write ${key}.`, e);
    }
  }

  function removeStorageValue(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn(`Failed to remove ${key}.`, e);
    }
  }

  function readStorageJson(key, fallback) {
    try {
      const raw = readStorageValue(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) {
      console.warn(`Failed to parse ${key}; using fallback.`, e);
      return fallback;
    }
  }

  function writeStorageJson(key, value) {
    writeStorageValue(key, JSON.stringify(value));
  }

  function readStoredPreferences() {
    return readStorageJson(STORAGE_KEYS.preferences, {});
  }

  function writeStoredPreferences(preferences) {
    writeStorageJson(STORAGE_KEYS.preferences, preferences);
  }

  function updateStoredPreferences(patch) {
    const prefs = readStoredPreferences();
    const cleanPatch = Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined)
    );
    writeStoredPreferences({ ...prefs, ...cleanPatch });
  }

  function parsePositiveInt(value, fallback) {
    const v = parseInt(value, 10);
    return Number.isFinite(v) && v > 0 ? v : fallback;
  }

  /* ---------------------------------------------------------------------------
 * CENTRAL PANEL MANAGER – one source of truth for open/close behaviour
 * ------------------------------------------------------------------------- */
  const PANELS = new Map([
    ['settings', settingsPanelEl],
    ['tasks', tasksPanelEl],
    ['history', historyPanelEl],
    ['audio', audioPanelEl],
    ['stats', statsPanelEl],
    ['notifications', notificationPanelEl],
    ['playlist', playlistPanelEl],
  ]);

  function showPanel(key) {
    const el = PANELS.get(key);
    if (!el) return;
    el.classList.add('slideout');
    el.classList.remove('hidden');
  }

  function hidePanel(key) {
    const el = PANELS.get(key);
    if (!el) return;
    el.classList.add('hidden');
    el.classList.remove('slideout');
  }

  function togglePanel(key) {
    const el = PANELS.get(key);
    if (!el) return;

    const willShow = el.classList.contains('hidden');

    // close everything first
    PANELS.forEach((_, k) => hidePanel(k));

    // then either show or leave hidden (so a second click still closes)
    if (willShow) showPanel(key);
  }



  // Motivational quotes for breaks
  const quotes = [
    "Take a deep breath and smile.",
    "Progress, not perfection.",
    "Small steps every day add up to big results.",
    "Rest is part of the process.",
    "Great things are done by a series of small things brought together."
  ];

  // Task management state
  // Tasks are stored as objects { text: string, done: boolean, starred: boolean }
  let tasks = [];
  let currentTaskIndex = 0;
  // Index of the task currently being dragged (for reorder)
  let draggedTaskIndex = null;

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
    // Choose a random quote index and render it with star button and cycling behaviour
    currentQuoteIndex = Math.floor(Math.random() * quotes.length);
    updateQuoteDisplay();
  }

  /**
   * Hide the quote display element. Called at the beginning of a work session.
   */
  function hideQuote() {
    if (!quoteDisplayEl) return;
    quoteDisplayEl.classList.add('hidden');
  }

  // --- Audio playback state ------------------------------------
  let audioIsPlaying = false;          // true  ==> user wants music playing
  function refreshAudioIcons() {
    if (audioPlayPauseEl) {
      audioPlayPauseEl.textContent = audioIsPlaying ? '⏸' : '▶';
    }
  }

  // Map audio track identifiers to object URLs from user-picked local folders.
  const builtInAudioSources = {};
  const builtInAudioLibrary = {};
  let audioSources = {};
  let audioLibrary = {};
  let localAudioFolders = [];

  const LOCAL_AUDIO_DB = {
    name: 'pomodoroLocalAudio',
    version: 1,
    store: 'handles',
    directoryListKey: 'musicDirectories',
    legacyDirectoryKey: 'musicDirectory'
  };
  const AUDIO_FILE_RE = /\.(mp3|wav|ogg|m4a|aac|flac|opus|webm)$/i;

  function cloneAudioLibrary(library) {
    return Object.fromEntries(
      Object.entries(library || {}).map(([name, tracks]) => [
        name,
        Array.isArray(tracks) ? tracks.map((track) => ({ ...track })) : []
      ])
    );
  }

  function resolveIdbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function normalizeStorageId(value) {
    const normalized = String(value || 'music')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    return normalized || 'music';
  }

  function createLocalAudioFolderId(name) {
    if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
    return `${normalizeStorageId(name)}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function openLocalAudioDb() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window)) {
        reject(new Error('IndexedDB is not available.'));
        return;
      }

      const request = indexedDB.open(LOCAL_AUDIO_DB.name, LOCAL_AUDIO_DB.version);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains(LOCAL_AUDIO_DB.store)) {
          request.result.createObjectStore(LOCAL_AUDIO_DB.store);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function withLocalAudioStore(mode, callback) {
    return openLocalAudioDb().then((db) => new Promise((resolve, reject) => {
      const tx = db.transaction(LOCAL_AUDIO_DB.store, mode);
      const store = tx.objectStore(LOCAL_AUDIO_DB.store);
      let callbackResult;
      try {
        callbackResult = callback(store);
      } catch (error) {
        try {
          tx.abort();
        } catch (abortError) {
          // Transaction may already be inactive.
        }
        db.close();
        reject(error);
        return;
      }
      tx.oncomplete = () => {
        db.close();
        resolve(callbackResult);
      };
      tx.onerror = () => {
        db.close();
        reject(tx.error);
      };
      tx.onabort = () => {
        db.close();
        reject(tx.error || new Error('Local audio storage transaction aborted.'));
      };
    }));
  }

  function getStoredLocalAudioFolderRecords() {
    return withLocalAudioStore('readonly', (store) => {
      const recordsRequest = store.get(LOCAL_AUDIO_DB.directoryListKey);
      const legacyRequest = store.get(LOCAL_AUDIO_DB.legacyDirectoryKey);
      return Promise.all([
        resolveIdbRequest(recordsRequest),
        resolveIdbRequest(legacyRequest)
      ]).then(([records, legacyHandle]) => {
        if (Array.isArray(records)) {
          return records.filter((record) => record?.handle);
        }
        if (legacyHandle) {
          return [{
            id: `legacy-${normalizeStorageId(legacyHandle.name)}`,
            name: legacyHandle.name,
            handle: legacyHandle
          }];
        }
        return [];
      });
    }).catch((error) => {
      console.warn('Could not read local audio folder handles.', error);
      return [];
    });
  }

  function persistLocalAudioFolderRecords() {
    const records = localAudioFolders
      .filter((folder) => folder.persistent && folder.handle)
      .map((folder) => ({
        id: folder.id,
        name: folder.name,
        handle: folder.handle
      }));

    return withLocalAudioStore('readwrite', (store) => {
      store.put(records, LOCAL_AUDIO_DB.directoryListKey);
      store.delete(LOCAL_AUDIO_DB.legacyDirectoryKey);
    }).catch((error) => {
      console.warn('Could not persist local audio folders.', error);
    });
  }

  function clearStoredLocalAudioFolderRecords() {
    return withLocalAudioStore('readwrite', (store) => {
      store.delete(LOCAL_AUDIO_DB.directoryListKey);
      store.delete(LOCAL_AUDIO_DB.legacyDirectoryKey);
    }).catch((error) => {
      console.warn('Could not clear local audio folder handles.', error);
    });
  }

  function countLocalAudioPlaylists() {
    return localAudioFolders.reduce((count, folder) => count + folder.playlistNames.length, 0);
  }

  function countLocalAudioTracks() {
    return localAudioFolders.reduce((count, folder) => count + folder.trackCount, 0);
  }

  function formatCount(value, singular, plural = `${singular}s`) {
    return `${value} ${value === 1 ? singular : plural}`;
  }

  function updatePlaylistSummary() {
    if (!playlistManagerSummaryEl) return;
    playlistManagerSummaryEl.replaceChildren();
    const items = localAudioFolders.length > 0
      ? [
        formatCount(localAudioFolders.length, 'folder'),
        formatCount(countLocalAudioTracks(), 'track')
      ]
      : ['No folders added'];
    items.forEach((text) => playlistManagerSummaryEl.appendChild(renderSummaryChip(text)));
  }

  function updateLocalAudioStatus(message = null) {
    if (localAudioStatusEl) {
      if (message) {
        localAudioStatusEl.textContent = message;
      } else if (localAudioFolders.length > 0) {
        localAudioStatusEl.textContent = `${formatCount(localAudioFolders.length, 'folder')}, ${formatCount(countLocalAudioPlaylists(), 'playlist')}, ${formatCount(countLocalAudioTracks(), 'track')}.`;
      } else {
        localAudioStatusEl.textContent = 'Add one or more local music folders.';
      }
    }

    if (clearLocalAudioButtonEl) {
      clearLocalAudioButtonEl.classList.toggle('hidden', localAudioFolders.length === 0);
    }

    updatePlaylistSummary();
  }

  function revokeFolderObjectUrls(folder) {
    (folder.objectUrls || []).forEach((url) => URL.revokeObjectURL(url));
  }

  function revokeAllLocalAudioObjectUrls() {
    localAudioFolders.forEach(revokeFolderObjectUrls);
  }

  function isAudioFile(file) {
    return file && (file.type.startsWith('audio/') || AUDIO_FILE_RE.test(file.name));
  }

  function stripAudioExtension(fileName) {
    return fileName.replace(AUDIO_FILE_RE, '').trim() || fileName;
  }

  function buildLocalAudioLibrary(fileEntries, sourceName, folderId) {
    const localSources = {};
    const localLibrary = {};
    const objectUrls = [];
    let trackCount = 0;

    fileEntries.forEach(({ file, path }) => {
      if (!isAudioFile(file)) return;
      const safePath = path || file.name;
      const parts = safePath.split('/').filter(Boolean);
      const fileName = parts[parts.length - 1] || file.name;
      const playlistSource = parts.length > 1 ? parts[0] : sourceName;
      const playlistName = parts.length > 1 ? `${sourceName} / ${playlistSource}` : sourceName;
      const id = `local:${folderId}:${safePath}`;
      const objectUrl = URL.createObjectURL(file);
      objectUrls.push(objectUrl);
      localSources[id] = objectUrl;
      if (!localLibrary[playlistName]) localLibrary[playlistName] = [];
      localLibrary[playlistName].push({
        id,
        name: stripAudioExtension(fileName),
        local: true,
        folderId
      });
      trackCount += 1;
    });

    Object.values(localLibrary).forEach((tracks) => {
      tracks.sort((a, b) => a.name.localeCompare(b.name));
    });

    return {
      sources: localSources,
      library: localLibrary,
      objectUrls,
      playlistNames: Object.keys(localLibrary).sort(),
      trackCount
    };
  }

  function upsertLocalAudioFolder(folder) {
    const existingIndex = localAudioFolders.findIndex((item) => item.id === folder.id);
    if (existingIndex >= 0) {
      revokeFolderObjectUrls(localAudioFolders[existingIndex]);
      localAudioFolders.splice(existingIndex, 1, folder);
    } else {
      localAudioFolders.push(folder);
    }
    localAudioFolders.sort((a, b) => a.name.localeCompare(b.name));
  }

  function rebuildAudioLibrary({ persist = false, preferredGenre = null, preferredTrackId = null } = {}) {
    audioSources = { ...builtInAudioSources };
    audioLibrary = cloneAudioLibrary(builtInAudioLibrary);

    localAudioFolders.forEach((folder) => {
      Object.assign(audioSources, folder.sources);
      Object.entries(folder.library).forEach(([playlistName, tracks]) => {
        audioLibrary[playlistName] = tracks;
      });
    });

    renderLocalAudioManager();
    updateLocalAudioStatus();
    populateGenreSelect({ persist, preferredGenre, preferredTrackId });
  }

  function renderLocalAudioManager() {
    if (!localAudioListEl) return;
    localAudioListEl.replaceChildren();

    localAudioFolders.forEach((folder) => {
      const row = document.createElement('div');
      row.className = 'local-audio-item';

      const details = document.createElement('div');
      details.className = 'local-audio-item-details';

      const title = document.createElement('div');
      title.className = 'local-audio-item-title';
      title.textContent = folder.name;

      const meta = document.createElement('div');
      meta.className = 'local-audio-item-meta';
      const parts = [
        formatCount(folder.playlistNames.length, 'playlist'),
        formatCount(folder.trackCount, 'track')
      ];
      if (folder.needsPermission) parts.push('reconnect needed');
      if (folder.sessionOnly) parts.push('this session only');
      meta.textContent = parts.join(' · ');

      details.append(title, meta);
      row.appendChild(details);

      if (folder.needsPermission && folder.handle) {
        const reconnectBtn = document.createElement('button');
        reconnectBtn.className = 'local-audio-link-button';
        reconnectBtn.type = 'button';
        reconnectBtn.textContent = 'Reconnect';
        reconnectBtn.addEventListener('click', () => reconnectLocalAudioFolder(folder.id));
        row.appendChild(reconnectBtn);
      }

      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'local-audio-delete-button';
      deleteBtn.type = 'button';
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', () => removeLocalAudioFolder(folder.id));
      row.appendChild(deleteBtn);

      localAudioListEl.appendChild(row);
    });
  }

  async function findLocalAudioFolderByHandle(handle) {
    if (!handle?.isSameEntry) return null;
    for (const folder of localAudioFolders) {
      if (!folder.handle?.isSameEntry) continue;
      try {
        if (await handle.isSameEntry(folder.handle)) return folder;
      } catch (error) {
        // Fall through and treat it as a different folder.
      }
    }
    return null;
  }

  async function collectAudioFilesFromDirectory(handle, parentParts = []) {
    const entries = [];
    for await (const [name, child] of handle.entries()) {
      if (child.kind === 'directory') {
        entries.push(...await collectAudioFilesFromDirectory(child, [...parentParts, name]));
      } else if (child.kind === 'file') {
        const file = await child.getFile();
        entries.push({ file, path: [...parentParts, name].join('/') });
      }
    }
    return entries;
  }

  function loadLocalAudioEntries(fileEntries, {
    folderId,
    folderName,
    handle = null,
    persistent = false,
    sessionOnly = false,
    needsPermission = false,
    preferredPlaylist = null,
    preferredTrack = null
  }) {
    const built = buildLocalAudioLibrary(fileEntries, folderName, folderId);
    if (built.trackCount === 0) {
      updateLocalAudioStatus(`No supported audio files found in ${folderName}.`);
      return false;
    }

    const folder = {
      id: folderId,
      name: folderName,
      handle,
      persistent,
      sessionOnly,
      needsPermission,
      sources: built.sources,
      library: built.library,
      objectUrls: built.objectUrls,
      playlistNames: built.playlistNames,
      trackCount: built.trackCount
    };

    upsertLocalAudioFolder(folder);
    rebuildAudioLibrary({
      persist: false,
      preferredGenre: preferredPlaylist,
      preferredTrackId: preferredTrack
    });
    updateStoredPreferences({
      audioGenre: audioGenreSelectEl ? audioGenreSelectEl.value : DEFAULTS.audioGenre,
      audioTrack: audioSelectEl ? audioSelectEl.value : DEFAULTS.audioTrack
    });
    return true;
  }

  async function loadLocalAudioDirectory(handle, {
    folderId = null,
    sourceName = null,
    persistHandle = false,
    fromRestore = false,
    preferredPlaylist = null,
    preferredTrack = null
  } = {}) {
    if (!handle) return false;
    const existing = folderId ? localAudioFolders.find((folder) => folder.id === folderId) : await findLocalAudioFolderByHandle(handle);
    const id = folderId || existing?.id || createLocalAudioFolderId(handle.name);
    const name = sourceName || handle.name;
    updateLocalAudioStatus(`Loading ${name}...`);

    let fileEntries;
    try {
      fileEntries = await collectAudioFilesFromDirectory(handle);
    } catch (error) {
      updateLocalAudioStatus(`Could not read ${name}.`);
      throw error;
    }

    const loaded = loadLocalAudioEntries(fileEntries, {
      folderId: id,
      folderName: name,
      handle,
      persistent: persistHandle || fromRestore || !!existing?.persistent,
      sessionOnly: false,
      preferredPlaylist,
      preferredTrack
    });

    if (loaded && (persistHandle || fromRestore || existing?.persistent)) {
      await persistLocalAudioFolderRecords();
    }
    return loaded;
  }

  async function restoreLocalAudioDirectories() {
    const records = await getStoredLocalAudioFolderRecords();
    if (records.length === 0) {
      rebuildAudioLibrary({ persist: false });
      return;
    }

    const prefs = readStoredPreferences();
    let restored = 0;
    for (const record of records) {
      const handle = record.handle;
      if (!handle) continue;
      let permission = 'denied';
      try {
        permission = await handle.queryPermission({ mode: 'read' });
      } catch (e) {
        permission = 'denied';
      }

      if (permission === 'granted') {
        const loaded = await loadLocalAudioDirectory(handle, {
          folderId: record.id,
          sourceName: record.name || handle.name,
          fromRestore: true,
          preferredPlaylist: prefs.audioGenre,
          preferredTrack: prefs.audioTrack
        });
        if (loaded) restored += 1;
      } else {
        upsertLocalAudioFolder({
          id: record.id,
          name: record.name || handle.name,
          handle,
          persistent: true,
          sessionOnly: false,
          needsPermission: true,
          sources: {},
          library: {},
          objectUrls: [],
          playlistNames: [],
          trackCount: 0
        });
      }
    }

    rebuildAudioLibrary({
      persist: false,
      preferredGenre: prefs.audioGenre,
      preferredTrackId: prefs.audioTrack
    });
    updateLocalAudioStatus(restored > 0 ? null : 'Saved folders need reconnecting.');
    await persistLocalAudioFolderRecords();
  }

  async function chooseLocalAudioFolder() {
    if ('showDirectoryPicker' in window) {
      try {
        const handle = await window.showDirectoryPicker({ mode: 'read' });
        const existing = await findLocalAudioFolderByHandle(handle);
        await loadLocalAudioDirectory(handle, {
          folderId: existing?.id || null,
          persistHandle: true
        });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          console.warn('Local audio folder selection failed.', error);
          updateLocalAudioStatus('Could not load that folder.');
        }
      }
      return;
    }

    if (localAudioInputEl) {
      localAudioInputEl.value = '';
      localAudioInputEl.click();
    }
  }

  function normalizePickedFilePath(file) {
    const rawPath = file.webkitRelativePath || file.name;
    const parts = rawPath.split('/').filter(Boolean);
    return parts.length > 1 ? parts.slice(1).join('/') : parts.join('/');
  }

  function loadPickedLocalAudioFiles(files) {
    const fileList = Array.from(files || []);
    if (fileList.length === 0) return;
    const firstPath = fileList[0].webkitRelativePath || '';
    const folderName = firstPath.split('/').filter(Boolean)[0] || 'Selected files';
    const entries = fileList.map((file) => ({
      file,
      path: normalizePickedFilePath(file)
    }));
    const loaded = loadLocalAudioEntries(entries, {
      folderId: createLocalAudioFolderId(folderName),
      folderName,
      sessionOnly: true
    });
    if (loaded) updateLocalAudioStatus(`${folderName} loaded for this browser session.`);
  }

  async function reconnectLocalAudioFolder(folderId) {
    const folder = localAudioFolders.find((item) => item.id === folderId);
    if (!folder?.handle?.requestPermission) return;
    try {
      const permission = await folder.handle.requestPermission({ mode: 'read' });
      if (permission === 'granted') {
        const prefs = readStoredPreferences();
        await loadLocalAudioDirectory(folder.handle, {
          folderId: folder.id,
          sourceName: folder.name,
          fromRestore: true,
          preferredPlaylist: prefs.audioGenre,
          preferredTrack: prefs.audioTrack
        });
      } else {
        updateLocalAudioStatus(`${folder.name} still needs permission.`);
      }
    } catch (error) {
      console.warn('Local audio reconnect failed.', error);
      updateLocalAudioStatus(`Could not reconnect ${folder.name}.`);
    }
  }

  async function removeLocalAudioFolder(folderId) {
    const folder = localAudioFolders.find((item) => item.id === folderId);
    if (!folder) return;
    const removedCurrentTrack = audioPlayerEl.dataset.trackId && folder.sources[audioPlayerEl.dataset.trackId];
    if (removedCurrentTrack) {
      audioIsPlaying = false;
      applyAudioTrack('none');
    }
    revokeFolderObjectUrls(folder);
    localAudioFolders = localAudioFolders.filter((item) => item.id !== folderId);
    await persistLocalAudioFolderRecords();
    rebuildAudioLibrary({ persist: false });
    updateStoredPreferences({
      audioGenre: audioGenreSelectEl ? audioGenreSelectEl.value : DEFAULTS.audioGenre,
      audioTrack: audioSelectEl ? audioSelectEl.value : DEFAULTS.audioTrack
    });
  }

  async function clearLocalAudioAccess() {
    revokeAllLocalAudioObjectUrls();
    localAudioFolders = [];
    await clearStoredLocalAudioFolderRecords();
    audioIsPlaying = false;
    applyAudioTrack('none');
    rebuildAudioLibrary({ persist: false, preferredGenre: 'none', preferredTrackId: 'none' });
    updateStoredPreferences({
      audioGenre: 'none',
      audioTrack: 'none'
    });
    updateLocalAudioStatus('Local playlists cleared.');
  }

  console.log('Local audio library initialized.');
  rebuildAudioLibrary({ persist: false });

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
    statsSummaryEl.replaceChildren();
    [
      ['Work sessions', counts['Work']],
      ['Short breaks', counts['Short Break']],
      ['Long breaks', counts['Long Break']],
      ['Tasks added', counts['Task Added']],
      ['Tasks completed', counts['Task Completed']],
      ['Tasks deleted', counts['Task Deleted']]
    ].forEach(([label, value]) => {
      const row = document.createElement('div');
      row.textContent = `${label}: ${value}`;
      statsSummaryEl.appendChild(row);
    });
  }

  /*
   * Load preferences from localStorage and apply them to the app. If a
   * preference is not found, use the defaults defined above. This
   * ensures the timer persists user choices across sessions.
   */
  function loadPreferences() {
    const stored = readStoredPreferences();
    workDuration = parsePositiveInt(stored.workDuration, DEFAULTS.workDuration);
    shortBreakDuration = parsePositiveInt(stored.shortBreakDuration, DEFAULTS.shortBreakDuration);
    longBreakDuration = parsePositiveInt(stored.longBreakDuration, DEFAULTS.longBreakDuration);
    sessionsBeforeLong = parsePositiveInt(stored.sessionsBeforeLong, DEFAULTS.sessionsBeforeLong);
    const audioTrack = stored.audioTrack || DEFAULTS.audioTrack;
    const volume = typeof stored.volume === 'number' ? stored.volume : DEFAULTS.volume;
    const baseColor = stored.baseColor || '#3b82f6';
    const themePreset = normalizeThemePreset(stored.themePreset || DEFAULTS.themePreset);
    darkMode = typeof stored.darkMode === 'boolean' ? stored.darkMode : DEFAULTS.darkMode;
    // Load gradient colours and audio genre
    bgColor1 = stored.bgColor1 || DEFAULTS.bgColor1;
    bgColor2 = stored.bgColor2 || DEFAULTS.bgColor2;
    audioGenre = stored.audioGenre || DEFAULTS.audioGenre;

    // Load notification preferences and theme quote
    isNotificationActive = false;
    notificationMuted = typeof stored.notificationMuted === 'boolean'
      ? stored.notificationMuted
      : DEFAULTS.notificationMuted;
    notificationSoundsEnabled = typeof stored.notificationSoundsEnabled === 'boolean'
      ? stored.notificationSoundsEnabled
      : DEFAULTS.notificationSoundsEnabled;
    notificationVisualAlertsEnabled = typeof stored.notificationVisualAlertsEnabled === 'boolean'
      ? stored.notificationVisualAlertsEnabled
      : DEFAULTS.notificationVisualAlertsEnabled;
    notificationTimes = Array.isArray(stored.notificationTimes)
      ? normalizeNotificationTimes(stored.notificationTimes)
      : [1, 5];
    notifyEnd = typeof stored.notifyEnd === 'boolean' ? stored.notifyEnd : true;
    themeQuote = readStorageValue(STORAGE_KEYS.themeQuote) || null;
    // Tasks are loaded separately via loadTasks()
    currentTaskIndex = 0;

    // Apply to input fields
    if (workInputEl) workInputEl.value = Math.round(workDuration / 60);
    if (shortBreakInputEl) shortBreakInputEl.value = Math.round(shortBreakDuration / 60);
    if (longBreakInputEl) longBreakInputEl.value = Math.round(longBreakDuration / 60);
    if (sessionsBeforeLongEl) sessionsBeforeLongEl.value = sessionsBeforeLong;
    if (audioSelectEl) audioSelectEl.value = audioTrack;
    if (volumeSliderEl) volumeSliderEl.value = volume;
    if (colorPickerEl) colorPickerEl.value = baseColor;
    // Update colour mode toggle button label
    updateColorModeButton();
    if (themePresetSelectEl) themePresetSelectEl.value = themePreset;
    if (bgColor1El) bgColor1El.value = bgColor1;
    if (bgColor2El) bgColor2El.value = bgColor2;
    if (audioGenreSelectEl) audioGenreSelectEl.value = audioGenre;

    // applyAudioTrack(audioTrack);
    audioPlayerEl.volume = volume;

    applyDarkMode(darkMode);
    applyThemePreset(themePreset);
    applyThemeColor(colorPickerEl.value);
    updateColorModeButton();
    // Apply background gradient based on stored colours
    applyBackgroundGradient();
    // Populate audio select options for stored genre
    updateAudioSelectOptions({ persist: false, preferredTrackId: audioTrack });

    remainingTime = workDuration;
    updateDisplay();
    updateCurrentTaskDisplay();
    updateAudioProgressVisibility();

    // Load tasks and history separately
    loadTasks();
    loadHistory();

    // Update statistics summary after loading history
    updateStatsSummary();

    // Initialise notification settings UI and update to reflect loaded preferences
    initNotificationSettingsUI();
    // Show theme quote if one has been selected previously
    updateThemeQuoteDisplay();
  }

  /*
   * Save current preferences to localStorage. Called when user clicks
   * the save button in the settings panel. Converts minute inputs
   * into seconds for consistent internal use.
   */
  function savePreferences() {
    workDuration = parsePositiveInt(workInputEl.value, DEFAULTS.workDuration / 60) * 60;
    shortBreakDuration = parsePositiveInt(shortBreakInputEl.value, DEFAULTS.shortBreakDuration / 60) * 60;
    longBreakDuration = parsePositiveInt(longBreakInputEl.value, DEFAULTS.longBreakDuration / 60) * 60;
    sessionsBeforeLong = parsePositiveInt(sessionsBeforeLongEl.value, DEFAULTS.sessionsBeforeLong);
    const audioTrack = audioSelectEl.value;
    const volume = parseFloat(volumeSliderEl.value);
    const baseColor = colorPickerEl.value;
    const themePreset = themePresetSelectEl ? themePresetSelectEl.value : 'custom';
    // Use current darkMode state rather than reading from a checkbox
    const darkModePref = darkMode;
    // Read background colours and audio genre selections
    const bg1 = bgColor1El ? bgColor1El.value : DEFAULTS.bgColor1;
    const bg2 = bgColor2El ? bgColor2El.value : DEFAULTS.bgColor2;
    bgColor1 = bg1;
    bgColor2 = bg2;
    const genreSel = audioGenreSelectEl ? audioGenreSelectEl.value : DEFAULTS.audioGenre;
    audioGenre = genreSel;
    // Tasks are managed separately; do not modify tasks here
    const prefs = {
      workDuration,
      shortBreakDuration,
      longBreakDuration,
      sessionsBeforeLong,
      audioTrack,
      volume,
      baseColor,
      darkMode: darkModePref,
      themePreset,
      bgColor1: bg1,
      bgColor2: bg2,
      audioGenre: genreSel,
      // Persist notification settings
      notificationMuted: notificationMuted,
      notificationSoundsEnabled: notificationSoundsEnabled,
      notificationVisualAlertsEnabled: notificationVisualAlertsEnabled,
      notificationTimes: notificationTimes.slice(),
      notifyEnd: notifyEnd
    };
    writeStoredPreferences(prefs);

    // Reload only if the track actually changed
    if (audioPlayerEl.dataset.trackId !== audioTrack) {
      applyAudioTrack(audioTrack);
    }

    audioPlayerEl.volume = volume;

    applyThemeColor(baseColor);
    applyDarkMode(darkMode);
    applyBackgroundGradient();

    // Do not reset the timer; just apply new settings for future sessions
    updateAudioProgressVisibility();
    updateCurrentTaskDisplay();
    closeSettings();
  }


  // Apply the chosen audio track
  function applyAudioTrack(trackId) {
    if (audioProgressGroupEl) audioProgressGroupEl.classList.add('hidden');

    if (trackId === 'none') {
      audioPlayerEl.pause();
      audioPlayerEl.removeAttribute('src');
      delete audioPlayerEl.dataset.trackId;
      refreshAudioIcons();
      return;
    }

    const src = audioSources[trackId];
    if (!src) {
      console.warn('No audio source for', trackId);
      audioPlayerEl.pause();
      audioPlayerEl.removeAttribute('src');
      delete audioPlayerEl.dataset.trackId;
      refreshAudioIcons();
      return;
    }

    if (audioPlayerEl.dataset.trackId !== trackId) {
      audioPlayerEl.pause();
      audioPlayerEl.removeAttribute('src');
      audioPlayerEl.src = src;
      audioPlayerEl.currentTime = 0;
      // Do not call .load(); it can truncate long VBR MP3s in some browsers.
    }

    if (audioProgressGroupEl) audioProgressGroupEl.classList.remove('hidden');

    if (audioIsPlaying) {
      audioPlayerEl.play().catch(() => { audioIsPlaying = false; });
    }

    audioPlayerEl.dataset.trackId = trackId;
    refreshAudioIcons();
  }

  function duckMusic(enable) {
    if (!audioPlayerEl) return;

    if (enable) {
      // already ducked? do nothing
      if (audioPlayerEl.dataset.ducked) return;
      audioPlayerEl.dataset.ducked = '1';
      audioPlayerEl.dataset.prevVol = audioPlayerEl.volume;
      audioPlayerEl.volume = audioPlayerEl.volume * 0.1;
    } else {
      if (!audioPlayerEl.dataset.ducked) return;   // nothing to restore
      const prev = parseFloat(audioPlayerEl.dataset.prevVol);
      audioPlayerEl.volume = isNaN(prev) ? audioPlayerEl.volume : prev;
      delete audioPlayerEl.dataset.prevVol;
      delete audioPlayerEl.dataset.ducked;
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
    // Update accent text colour for contrast
    const accentText = getContrastYIQ(hex);
    root.style.setProperty('--accent-text', accentText);
  }

  /**
   * Calculate a high‑contrast text colour (white or black) based on
   * the given hex colour using the YIQ algorithm. Returns '#fff' for
   * dark backgrounds and '#000' for light backgrounds.
   */
  function getContrastYIQ(hex) {
    if (!hex || hex.length < 7) return '#fff';
    const r = parseInt(hex.substr(1, 2), 16);
    const g = parseInt(hex.substr(3, 2), 16);
    const b = parseInt(hex.substr(5, 2), 16);
    const yiq = (r * 299 + g * 587 + b * 114) / 1000;
    return yiq >= 140 ? '#000' : '#fff';
  }

  /** Legacy preset ids mapped to current options (white/silver → frost, steel → twilight). */
  const THEME_PRESET_ALIASES = {
    white: 'frost',
    silver: 'frost',
    steel: 'twilight'
  };

  /** Per-preset accent and gradient colours tuned separately for dark and light UI. */
  const THEME_PRESETS = {
    twilight: {
      dark: { colour: '#3b82f6', grad1: '#3358a2', grad2: '#8f5bbb' },
      light: { colour: '#4338ca', grad1: '#c7d2fe', grad2: '#e9d5ff' }
    },
    blue: {
      dark: { colour: '#0a84ff', grad1: '#3358a2', grad2: '#1e40af' },
      light: { colour: '#1d4ed8', grad1: '#dbeafe', grad2: '#93c5fd' }
    },
    green: {
      dark: { colour: '#30d158', grad1: '#2ba552', grad2: '#14532d' },
      light: { colour: '#15803d', grad1: '#dcfce7', grad2: '#86efac' }
    },
    pink: {
      dark: { colour: '#ff375f', grad1: '#be185d', grad2: '#881337' },
      light: { colour: '#be185d', grad1: '#fce7f3', grad2: '#f9a8d4' }
    },
    frost: {
      dark: { colour: '#60a5fa', grad1: '#1e293b', grad2: '#475569' },
      light: { colour: '#2563eb', grad1: '#f8fafc', grad2: '#cbd5e1' }
    },
    golden: {
      dark: { colour: '#b7791f', grad1: '#fef3c7', grad2: '#d97706' },
      light: { colour: '#b45309', grad1: '#fef9c3', grad2: '#fbbf24' }
    }
  };

  function normalizeThemePreset(preset) {
    if (!preset || preset === 'custom') return 'custom';
    const mapped = THEME_PRESET_ALIASES[preset] || preset;
    return THEME_PRESETS[mapped] ? mapped : 'custom';
  }

  /**
   * Apply a predefined theme preset. Each preset stores separate dark/light
   * palettes so contrast stays readable in both colour modes.
   */
  function applyThemePreset(preset) {
    const resolved = normalizeThemePreset(preset);
    if (resolved === 'custom') return;
    const palette = THEME_PRESETS[resolved][darkMode ? 'dark' : 'light'];
    const { colour, grad1, grad2 } = palette;
    if (colorPickerEl) colorPickerEl.value = colour;
    if (bgColor1El) bgColor1El.value = grad1;
    if (bgColor2El) bgColor2El.value = grad2;
    bgColor1 = grad1;
    bgColor2 = grad2;
    applyThemeColor(colour);
    applyBackgroundGradient();
  }

  /*
   * ----------------------------------------------------------------------
   * Quote of the day functionality
   *
   * Display a random quote during breaks, allow cycling through quotes by
   * clicking on the quote, and allow the user to mark a quote as their
   * favourite "quote of the day" via a star button. The selected theme
   * quote is shown above the timer until removed by the user. The theme
   * quote persists across sessions via localStorage.
   */
  function updateQuoteDisplay() {
    if (!quoteDisplayEl) return;
    // Constrain index
    if (currentQuoteIndex < 0 || currentQuoteIndex >= quotes.length) {
      currentQuoteIndex = 0;
    }
    const quote = quotes[currentQuoteIndex];
    const starred = themeQuote === quote;
    const quoteText = document.createElement('span');
    quoteText.className = 'quote-text';
    quoteText.textContent = quote;
    const starBtn = document.createElement('button');
    starBtn.id = 'quote-star-btn';
    starBtn.className = 'star-quote-btn';
    starBtn.title = 'Set as quote of the day';
    starBtn.textContent = starred ? '★' : '☆';
    quoteDisplayEl.replaceChildren(quoteText, starBtn);
    quoteDisplayEl.classList.remove('hidden');
    // Clicking the quote cycles to next
    quoteDisplayEl.onclick = () => {
      cycleQuote();
    };
    // Star button toggles theme quote
    starBtn.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if (themeQuote === quote) {
        themeQuote = null;
      } else {
        themeQuote = quote;
      }
      persistThemeQuote();
      updateThemeQuoteDisplay();
      updateQuoteDisplay();
    });
  }

  function cycleQuote() {
    currentQuoteIndex = (currentQuoteIndex + 1) % quotes.length;
    updateQuoteDisplay();
  }

  function persistThemeQuote() {
    if (themeQuote) {
      writeStorageValue(STORAGE_KEYS.themeQuote, themeQuote);
    } else {
      removeStorageValue(STORAGE_KEYS.themeQuote);
    }
  }

  function updateThemeQuoteDisplay() {
    if (!themeQuoteDisplayEl) return;
    if (themeQuote) {
      const themeQuoteText = document.createElement('span');
      themeQuoteText.className = 'theme-quote-text';
      themeQuoteText.textContent = themeQuote;
      const removeBtn = document.createElement('button');
      removeBtn.id = 'remove-theme-quote';
      removeBtn.className = 'remove-theme-btn';
      removeBtn.title = 'Remove quote of the day';
      removeBtn.textContent = '✕';
      themeQuoteDisplayEl.replaceChildren(themeQuoteText, removeBtn);
      themeQuoteDisplayEl.classList.remove('hidden');
      removeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        themeQuote = null;
        persistThemeQuote();
        updateThemeQuoteDisplay();
        updateQuoteDisplay();
      });
    } else {
      themeQuoteDisplayEl.classList.add('hidden');
      themeQuoteDisplayEl.replaceChildren();
    }
  }

  /*
   * ----------------------------------------------------------------------
   * Notification settings and scheduling
   *
   * Build the notification settings UI, manage user-selected notification
   * times, persist them and schedule notifications relative to session
   * completion. Notifications are cleared when the timer is paused or
   * reset and rescheduled when resumed.
   */
  let notificationUIElements = null;

  function normalizeNotificationTimes(times) {
    const values = Array.isArray(times) ? times : [];
    return [...new Set(values
      .map((time) => parseInt(time, 10))
      .filter((time) => Number.isInteger(time) && time > 0))]
      .sort((a, b) => a - b);
  }

  function formatReminderLabel(minutes) {
    return `${minutes} min early`;
  }

  function getNotificationSummaryItems() {
    if (notificationMuted) return ['Notifications off'];

    const reminders = normalizeNotificationTimes(notificationTimes).map(formatReminderLabel);
    if (notifyEnd) reminders.push('When session ends');
    if (reminders.length === 0) return ['No timing selected'];
    return reminders;
  }

  function renderSummaryChip(text) {
    const chip = document.createElement('span');
    chip.className = 'settings-summary-chip';
    chip.textContent = text;
    return chip;
  }

  function updateNotificationSummary() {
    if (!notificationSettingsSummaryEl) return;
    notificationSettingsSummaryEl.replaceChildren();
    getNotificationSummaryItems().forEach((item) => {
      notificationSettingsSummaryEl.appendChild(renderSummaryChip(item));
    });
  }

  function initNotificationSettingsUI() {
    if (!notificationSettingsContainerEl) {
      updateNotificationSummary();
      return;
    }

    notificationSettingsContainerEl.replaceChildren();

    const group = document.createElement('div');
    group.className = 'notification-settings-stack';

    const masterGroup = document.createElement('div');
    masterGroup.className = 'settings-group notification-section';
    const masterLabel = document.createElement('label');
    masterLabel.className = 'notification-toggle-row notification-toggle-row-primary';
    const masterText = document.createElement('span');
    masterText.textContent = 'Notifications';
    const notificationsCheckbox = document.createElement('input');
    notificationsCheckbox.type = 'checkbox';
    notificationsCheckbox.id = 'notifications-enabled-checkbox';
    notificationsCheckbox.checked = !notificationMuted;
    masterLabel.appendChild(masterText);
    masterLabel.appendChild(notificationsCheckbox);
    masterGroup.appendChild(masterLabel);
    group.appendChild(masterGroup);

    const outputGroup = document.createElement('div');
    outputGroup.className = 'settings-group notification-section notification-output-section';
    const outputLabel = document.createElement('label');
    outputLabel.textContent = 'Notify by';
    outputGroup.appendChild(outputLabel);

    const outputRow = document.createElement('div');
    outputRow.className = 'notification-output-row';

    function createOutputToggle(id, text) {
      const label = document.createElement('label');
      label.className = 'notification-toggle-row notification-sub-toggle';
      const labelText = document.createElement('span');
      labelText.textContent = text;
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      label.appendChild(labelText);
      label.appendChild(checkbox);
      return { label, checkbox };
    }

    const { label: soundLabel, checkbox: soundCheckbox } = createOutputToggle('notification-sounds-checkbox', 'Sounds');
    const { label: visualLabel, checkbox: visualCheckbox } = createOutputToggle('notification-visual-alerts-checkbox', 'On-screen alerts');
    outputRow.appendChild(soundLabel);
    outputRow.appendChild(visualLabel);
    outputGroup.appendChild(outputRow);
    group.appendChild(outputGroup);

    const reminderGroup = document.createElement('div');
    reminderGroup.className = 'settings-group notification-section';
    const reminderLabel = document.createElement('label');
    reminderLabel.textContent = 'Notification timing';
    reminderGroup.appendChild(reminderLabel);

    const optionsRow = document.createElement('div');
    optionsRow.className = 'notify-options';

    function createNotifyOption(id, text) {
      const optionLabel = document.createElement('label');
      optionLabel.className = 'notify-timing-option';
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = id;
      const optionText = document.createElement('span');
      optionText.textContent = text;
      optionLabel.appendChild(checkbox);
      optionLabel.appendChild(optionText);
      return { optionLabel, checkbox };
    }

    const { optionLabel: oneMinLabel, checkbox: oneMinCheckbox } = createNotifyOption('notify-1min', '1 min early');
    const { optionLabel: fiveMinLabel, checkbox: fiveMinCheckbox } = createNotifyOption('notify-5min', '5 min early');
    const { optionLabel: endLabel, checkbox: endCheckbox } = createNotifyOption('notify-end', 'When session ends');

    optionsRow.appendChild(oneMinLabel);
    optionsRow.appendChild(fiveMinLabel);
    optionsRow.appendChild(endLabel);
    reminderGroup.appendChild(optionsRow);

    const customRow = document.createElement('div');
    customRow.className = 'custom-notify-row';
    const customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.min = '1';
    customInput.placeholder = 'Minutes early';
    customInput.id = 'custom-notify-input';
    const addCustomBtn = document.createElement('button');
    addCustomBtn.className = 'control-button';
    addCustomBtn.textContent = 'Add';
    addCustomBtn.title = 'Add custom notification timing';
    customRow.appendChild(customInput);
    customRow.appendChild(addCustomBtn);
    reminderGroup.appendChild(customRow);

    const customList = document.createElement('div');
    customList.id = 'custom-notify-list';
    customList.className = 'custom-notify-list';
    reminderGroup.appendChild(customList);
    group.appendChild(reminderGroup);

    notificationSettingsContainerEl.appendChild(group);

    function addCustomTime() {
      const val = parseInt(customInput.value, 10);
      if (Number.isInteger(val) && val > 0) {
        notificationTimes = normalizeNotificationTimes([...notificationTimes, val]);
        persistNotificationSettings();
        updateNotificationUI();
      }
      customInput.value = '';
    }

    notificationsCheckbox.addEventListener('change', () => {
      notificationMuted = !notificationsCheckbox.checked;
      persistNotificationSettings();
      if (!notificationMuted && notificationVisualAlertsEnabled) requestNotificationPermission();
      updateNotificationUI();
    });
    soundCheckbox.addEventListener('change', () => {
      notificationSoundsEnabled = soundCheckbox.checked;
      persistNotificationSettings();
      updateNotificationUI();
    });
    visualCheckbox.addEventListener('change', () => {
      notificationVisualAlertsEnabled = visualCheckbox.checked;
      persistNotificationSettings();
      if (!notificationMuted && notificationVisualAlertsEnabled) requestNotificationPermission();
      updateNotificationUI();
    });
    oneMinCheckbox.addEventListener('change', () => {
      toggleNotifyTime(1, oneMinCheckbox.checked);
    });
    fiveMinCheckbox.addEventListener('change', () => {
      toggleNotifyTime(5, fiveMinCheckbox.checked);
    });
    endCheckbox.addEventListener('change', () => {
      notifyEnd = endCheckbox.checked;
      persistNotificationSettings();
      updateNotificationUI();
    });
    addCustomBtn.addEventListener('click', addCustomTime);
    customInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addCustomTime();
      }
    });

    notificationUIElements = {
      notificationsCheckbox,
      soundCheckbox,
      visualCheckbox,
      oneMinCheckbox,
      fiveMinCheckbox,
      endCheckbox,
      customInput,
      addCustomBtn,
      customList
    };
    updateNotificationUI();
  }

  function toggleNotifyTime(minutes, enabled) {
    if (enabled) {
      if (!notificationTimes.includes(minutes)) {
        notificationTimes = normalizeNotificationTimes([...notificationTimes, minutes]);
      }
    } else {
      notificationTimes = notificationTimes.filter((t) => t !== minutes);
    }
    persistNotificationSettings();
    updateNotificationUI();
  }

  function updateNotificationUI() {
    notificationTimes = normalizeNotificationTimes(notificationTimes);
    updateNotificationSummary();
    if (!notificationUIElements) return;

    const {
      notificationsCheckbox,
      soundCheckbox,
      visualCheckbox,
      oneMinCheckbox,
      fiveMinCheckbox,
      endCheckbox,
      customInput,
      addCustomBtn,
      customList
    } = notificationUIElements;
    const notificationsEnabled = !notificationMuted;

    notificationsCheckbox.checked = notificationsEnabled;
    soundCheckbox.checked = notificationSoundsEnabled;
    visualCheckbox.checked = notificationVisualAlertsEnabled;
    oneMinCheckbox.checked = notificationTimes.includes(1);
    fiveMinCheckbox.checked = notificationTimes.includes(5);
    endCheckbox.checked = notifyEnd;

    [soundCheckbox, visualCheckbox, oneMinCheckbox, fiveMinCheckbox, endCheckbox, customInput, addCustomBtn]
      .forEach((control) => {
        control.disabled = !notificationsEnabled;
      });

    const customTimes = notificationTimes.filter((t) => t !== 1 && t !== 5);
    customList.replaceChildren();
    customTimes.forEach((t) => {
      const chip = document.createElement('span');
      chip.className = 'custom-notify-chip';
      chip.textContent = formatReminderLabel(t);
      const removeBtn = document.createElement('button');
      removeBtn.className = 'remove-theme-btn';
      removeBtn.title = 'Remove';
      removeBtn.textContent = '✕';
      removeBtn.disabled = !notificationsEnabled;
      removeBtn.addEventListener('click', () => {
        notificationTimes = notificationTimes.filter((x) => x !== t);
        persistNotificationSettings();
        updateNotificationUI();
      });
      chip.appendChild(removeBtn);
      customList.appendChild(chip);
    });
  }

  function persistNotificationSettings() {
    notificationTimes = normalizeNotificationTimes(notificationTimes);
    updateStoredPreferences({
      notificationMuted,
      notificationSoundsEnabled,
      notificationVisualAlertsEnabled,
      notificationTimes: notificationTimes.slice(),
      notifyEnd
    });
    updateNotificationSummary();
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
      root.style.setProperty('--panel-bg', 'rgba(17, 24, 39, 0.75)');
      root.style.setProperty('--panel-border', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--panel-shadow', '0 4px 16px rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--surface-soft', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--surface-soft-border', 'rgba(255, 255, 255, 0.12)');
      root.style.setProperty('--surface-strong', 'rgba(255, 255, 255, 0.22)');
      root.style.setProperty('--input-bg', '#374151');
      root.style.setProperty('--input-color', '#ffffff');
      root.style.setProperty('--input-border', 'transparent');
      root.style.setProperty('--quote-bg', 'rgba(0, 0, 0, 0.4)');
    } else {
      // Light mode: dark text on a lightly frosted canvas; muted secondary for
      // labels; frosted (not dark) chips so quote/task text stays readable.
      root.style.setProperty('--color-primary', '#111827');
      root.style.setProperty('--color-secondary', '#4b5563');
      root.style.setProperty('--color-bg-overlay', 'rgba(255, 255, 255, 0.22)');
      root.style.setProperty('--panel-bg', 'rgba(241, 245, 249, 0.92)');
      root.style.setProperty('--panel-border', 'rgba(15, 23, 42, 0.14)');
      root.style.setProperty('--panel-shadow', '0 6px 20px rgba(15, 23, 42, 0.14)');
      root.style.setProperty('--surface-soft', 'rgba(15, 23, 42, 0.1)');
      root.style.setProperty('--surface-soft-border', 'rgba(15, 23, 42, 0.16)');
      root.style.setProperty('--surface-strong', 'rgba(15, 23, 42, 0.18)');
      root.style.setProperty('--input-bg', '#ffffff');
      root.style.setProperty('--input-color', '#111827');
      root.style.setProperty('--input-border', 'rgba(15, 23, 42, 0.16)');
      root.style.setProperty('--quote-bg', 'rgba(255, 255, 255, 0.72)');
    }
    applyBackgroundGradient();
  }

  /**
   * Update the colour mode button's label to reflect current mode.
   * In dark mode the button shows "Light Mode" (clicking it will switch to light mode),
   * and vice versa. This function should be called whenever darkMode changes.
   */
  function updateColorModeButton() {
    if (!colorModeToggleEl) return;
    colorModeToggleEl.textContent = darkMode ? 'Light Mode' : 'Dark Mode';
  }

  /**
   * Toggle between light and dark modes. Updates darkMode state,
   * applies the theme and updates the button label.
   */
  function toggleColorMode() {
    darkMode = !darkMode;
    applyDarkMode(darkMode);
    updateColorModeButton();
    const preset = themePresetSelectEl ? themePresetSelectEl.value : 'custom';
    if (preset !== 'custom') applyThemePreset(preset);
  }

  /**
   * Lighten or darken a hex colour by a given factor. A factor > 1 will
   * lighten the colour, while a factor < 1 will darken it. Converts
   * the colour to HSL, multiplies the lightness by the factor and
   * clamps it between 0 and 1. Returns a hex string. This helper is
   * used to generate background gradients that remain legible in both
   * dark and light modes.
   *
   * @param {string} hex The input colour in #rrggbb format.
   * @param {number} factor The multiplier for the lightness channel.
   */
  function adjustColour(hex, factor) {
    // Remove leading '#'
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16) / 255;
    const g = parseInt(clean.substring(2, 4), 16) / 255;
    const b = parseInt(clean.substring(4, 6), 16) / 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
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
    // Adjust lightness
    l = Math.min(1, Math.max(0, l * factor));
    // Convert back to RGB
    const hueToRgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    let r2, g2, b2;
    if (s === 0) {
      r2 = g2 = b2 = l;
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r2 = hueToRgb(p, q, h + 1 / 3);
      g2 = hueToRgb(p, q, h);
      b2 = hueToRgb(p, q, h - 1 / 3);
    }
    const toHex = (x) => Math.round(x * 255).toString(16).padStart(2, '0');
    return `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;
  }

  /**
   * Apply a linear gradient to the app background using the current
   * selected colours. Depending on dark or light mode, the colours
   * are darkened or lightened to ensure sufficient contrast with
   * foreground elements. This function should be called whenever
   * bgColor1, bgColor2 or darkMode changes.
   */
  function applyBackgroundGradient() {
    // Determine factor based on dark mode: dark mode darkens colours
    // Use global darkMode state instead of reading from checkbox
    const dark = darkMode;
    // Dark mode: darken colours slightly; Light mode: use original colours
    const factor = dark ? 0.6 : 1.0;
    const c1 = adjustColour(bgColor1, factor);
    const c2 = adjustColour(bgColor2, factor);
    if (appEl) {
      appEl.style.backgroundImage = `linear-gradient(135deg, ${c1}, ${c2})`;
    }
  }

  /**
 * Build the <option> list for #audio-genre-select from AUDIO_LIBRARY keys.
 * Keeps any previously–saved genre if it still exists; otherwise selects the first key.
 */
  function populateGenreSelect({ persist = true, preferredGenre = null, preferredTrackId = null } = {}) {
    if (!audioGenreSelectEl) return;

    const previous = preferredGenre || audioGenreSelectEl.value || audioGenre || readStoredPreferences().audioGenre || 'none';
    const playlistNames = Object.keys(audioLibrary).sort();

    audioGenreSelectEl.replaceChildren();

    if (playlistNames.length === 0) {
      const opt = document.createElement('option');
      opt.value = 'none';
      opt.textContent = 'No playlists added';
      audioGenreSelectEl.appendChild(opt);
    } else {
      playlistNames.forEach((key) => {
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = key.replace(/(^|\s)\w/g, (c) => c.toUpperCase());
        audioGenreSelectEl.appendChild(opt);
      });
    }

    if ([...audioGenreSelectEl.options].some((option) => option.value === previous)) {
      audioGenreSelectEl.value = previous;
    } else {
      audioGenreSelectEl.value = playlistNames[0] || 'none';
    }
    audioGenre = audioGenreSelectEl.value;

    updateAudioSelectOptions({ persist, preferredTrackId });
  }

  /**
   * Populate the track select element with options corresponding to the
   * selected audio genre. When the genre changes, any previously
   * selected track is reset to the first track of the new genre.
   * Tracks are drawn from the audioLibrary. Always includes a
   * 'None' option.
   */
  function updateAudioSelectOptions({ persist = true, preferredTrackId = null } = {}) {
    if (!audioSelectEl || !audioGenreSelectEl) return;
    const genre = audioGenreSelectEl.value;
    const previousTrackId = preferredTrackId || audioSelectEl.value || readStoredPreferences().audioTrack || DEFAULTS.audioTrack;
    audioGenre = genre;

    audioSelectEl.replaceChildren();

    const noneOpt = document.createElement('option');
    noneOpt.value = 'none';
    noneOpt.textContent = 'None';
    audioSelectEl.appendChild(noneOpt);

    const list = audioLibrary[genre] || [];
    list.forEach((track) => {
      const opt = document.createElement('option');
      opt.value = track.id;
      opt.textContent = track.name;
      audioSelectEl.appendChild(opt);
    });

    if (list.some((track) => track.id === previousTrackId)) {
      audioSelectEl.value = previousTrackId;
    } else if (list.length > 0) {
      audioSelectEl.value = list[0].id;
    } else {
      audioSelectEl.value = 'none';
    }

    if (audioSelectEl.value === 'none') {
      applyAudioTrack('none');
    } else if (audioPlayerEl.dataset.trackId !== audioSelectEl.value) {
      applyAudioTrack(audioSelectEl.value);
    }

    if (audioIsPlaying && audioPlayerEl.paused) {
      audioPlayerEl.play().catch(() => { audioIsPlaying = false; refreshAudioIcons(); });
    }

    if (persist) {
      updateStoredPreferences({
        audioGenre: genre,
        audioTrack: audioSelectEl.value
      });
    }
  }

  /**
   * Toggle play/pause for the audio player and update the play/pause
   * button icon accordingly. This is separate from the quick audio
   * toggle, which mutes/unmutes globally. When paused, the audio
   * remains loaded so that play resumes from the same position.
   */
  function togglePlayPause() {
    if (!audioPlayerEl) return;

    audioIsPlaying = !audioIsPlaying;

    if (audioIsPlaying) {
      if (!audioSelectEl || audioSelectEl.value === 'none') {
        audioIsPlaying = false;
        refreshAudioIcons();
        return;
      }
      if (!audioPlayerEl.src) applyAudioTrack(audioSelectEl.value);
      audioPlayerEl.play().catch(() => { audioIsPlaying = false; refreshAudioIcons(); });
    } else {
      audioPlayerEl.pause();
    }

    refreshAudioIcons();
  }


  /**
   * Advance to the previous track within the current genre. If at the
   * beginning, wraps around to the last track. Updates the audio
   * source and saves the preference.
   */
  function previousTrack() {
    if (!audioGenreSelectEl || !audioSelectEl) return;
    const genre = audioGenreSelectEl.value;
    const list = audioLibrary[genre] || [];
    if (list.length === 0) return;
    // Find current index
    const idx = list.findIndex((t) => t.id === audioSelectEl.value);
    let newIndex = idx - 1;
    if (newIndex < 0) newIndex = list.length - 1;
    const newTrack = list[newIndex];
    audioSelectEl.value = newTrack.id;
    applyAudioTrack(newTrack.id);
    // Immediately play new track if previously playing
    if (audioIsPlaying) {
      audioPlayerEl.play().catch(() => { audioIsPlaying = false; refreshAudioIcons(); });
    }
    refreshAudioIcons();
    updateStoredPreferences({ audioTrack: newTrack.id });
  }

  /**
   * Advance to the next track within the current genre. If at the
   * end, wraps around to the first track. Updates the audio source
   * and saves the preference.
   */
  function nextTrack() {
    if (!audioGenreSelectEl || !audioSelectEl) return;
    const genre = audioGenreSelectEl.value;
    const list = audioLibrary[genre] || [];
    if (list.length === 0) return;
    const idx = list.findIndex((t) => t.id === audioSelectEl.value);
    let newIndex = idx + 1;
    if (newIndex >= list.length) newIndex = 0;
    const newTrack = list[newIndex];
    audioSelectEl.value = newTrack.id;
    applyAudioTrack(newTrack.id);
    if (audioIsPlaying) {
      audioPlayerEl.play().catch(() => { audioIsPlaying = false; refreshAudioIcons(); });
    }
    refreshAudioIcons();
    updateStoredPreferences({ audioTrack: newTrack.id });
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

  // Show flagged (starred) tasks prominently below the timer
  function updateFlaggedTasksDisplay() {
    if (!flaggedTasksDisplayEl) return;
    // Only display tasks that are starred and not completed
    const flagged = tasks.filter((t) => t.starred && !t.done);
    if (flagged.length === 0) {
      flaggedTasksDisplayEl.replaceChildren();
      flaggedTasksDisplayEl.classList.add('hidden');
      return;
    }
    flaggedTasksDisplayEl.classList.remove('hidden');
    flaggedTasksDisplayEl.replaceChildren();
    flagged.forEach((task) => {
      const chip = document.createElement('div');
      chip.className = 'flag-chip';
      chip.textContent = task.text;
      flaggedTasksDisplayEl.appendChild(chip);
    });
  }

  // Update audio progress slider
  function updateAudioProgressBar() {
    if (!audioProgressEl || !audioPlayerEl) return;
    if (audioPlayerEl.duration && !isNaN(audioPlayerEl.duration)) {
      const progress = (audioPlayerEl.currentTime / audioPlayerEl.duration) * 100;
      audioProgressEl.value = progress;
      // Update CSS variable for gradient fill on custom progress bar
      audioProgressEl.style.setProperty('--audio-progress-value', `${progress}%`);
    }
  }

  // Seek audio track to a percentage
  function seekAudio() {
    if (audioPlayerEl.duration && !isNaN(audioPlayerEl.duration)) {
      audioPlayerEl.currentTime =
        (audioProgressEl.value / 100) * audioPlayerEl.duration;
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
      // Pause the timer
      clearInterval(timerInterval);
      timerInterval = null;
      isRunning = false;
      // Stop any scheduled notifications
      // clearScheduledNotifications();
      // scheduleNotifications();
      // Set play icon on pause
      startButtonEl.textContent = '▶';
      startButtonEl.setAttribute('title', 'Start');
      return;
    }

    // Starting or resuming
    isRunning = true;
    // Set pause icon when running
    startButtonEl.textContent = '⏸';
    startButtonEl.setAttribute('title', 'Pause');
    // If this is the first time starting this session, set start time and total time
    if (sessionStartTime === null) {
      sessionStartTime = Date.now();
      sessionTotalTime = remainingTime;
    }
    // Do not automatically start audio when timer starts; user controls audio explicitly
    timerInterval = setInterval(() => {
      remainingTime--;
      updateDisplay();
      if (remainingTime <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        isRunning = false;
        handleSessionEnd();
      }
      const mins = remainingTime / 60;
      if (Number.isInteger(mins) && notificationTimes.includes(mins)) {
        sendNotification(
          `${currentSessionType} ending in ${mins} minute${mins === 1 ? '' : 's'}!`,
          currentSessionType === SESSION.WORK ? 'Prepare to rest soon.' : 'Get ready to work.'
        );
      }
    }, 1000);

    // Schedule notifications for this session
    // scheduleNotifications();
  }

  // Reset timer to initial values based on current preferences
  function resetTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
    isRunning = false;
    sessionCount = 0;
    currentSessionType = SESSION.WORK;
    remainingTime = workDuration;
    startButtonEl.textContent = '▶';
    startButtonEl.setAttribute('title', 'Start');
    postponeButtonEl.classList.add('hidden');
    postponeUsed = false;
    sessionStartTime = null;
    sessionTotalTime = null;
    // Clear any scheduled notifications when resetting
    // clearScheduledNotifications();
    // scheduleNotifications();
    updateDisplay();
    updateCurrentTaskDisplay();
    hideQuote();
  }

  // Transition to the next session based on current state
  function handleSessionEnd() {
    // Send a completion notification only if the user has enabled end notifications
    if (notifyEnd) {
      sendNotification(
        `${currentSessionType} complete!`,
        currentSessionType === SESSION.WORK ? 'Time for a break.' : 'Back to work.',
        "long"
      );
    }

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
    // Reset for next session; new startTime will be set in startTimer()
    sessionStartTime = null;
    sessionTotalTime = null;
    updateDisplay();
    if (currentSessionType === SESSION.WORK) {
      // Break just ended; let the user explicitly start the next work session.
      startButtonEl.textContent = '▶';
      startButtonEl.setAttribute('title', 'Start');
    } else {
      // Work just ended; auto-start the upcoming break.
      startTimer();
    }
  }

  // Utility to get chime duration reliably, even before metadata is loaded
  function getChimeDuration(chimeEl) {
    return new Promise((resolve) => {
      if (chimeEl.readyState >= 1 && chimeEl.duration && !isNaN(chimeEl.duration)) {
        resolve(chimeEl.duration);
      } else {
        chimeEl.onloadedmetadata = () => resolve(chimeEl.duration || 1);
      }
    });
  }

  // Modular chime playback
  function playChime({ notify_type = "short", chimeEl = null, onEnded = () => { } } = {}) {
    chimeEl = chimeEl || document.getElementById("notification-sound");
    if (!chimeEl) { onEnded(); return; }

    getChimeDuration(chimeEl).then((total) => {
      let playDuration = (notify_type === "short") ? total / 2 : total;

      if (notificationMuted || !notificationSoundsEnabled) {
        onEnded();
        return;
      }

      duckMusic(true);

      chimeEl.pause();
      chimeEl.currentTime = 0;
      let ended = false;
      function clearUp() {
        if (ended) return;
        ended = true;
        chimeEl.removeEventListener('timeupdate', timeWatcher);
        chimeEl.removeEventListener('ended', nativeEndedHandler);
        duckMusic(false);
        onEnded();
      }

      function timeWatcher() {
        if (chimeEl.currentTime >= playDuration) {
          chimeEl.pause();
          chimeEl.currentTime = 0;
          clearUp();
        }
      }
      function nativeEndedHandler() {
        clearUp();
      }

      // If playing partial, use timeupdate; if full, let 'ended' trigger cleanup.
      if (playDuration < total) {
        chimeEl.addEventListener('timeupdate', timeWatcher);
      } else {
        chimeEl.addEventListener('ended', nativeEndedHandler);
      }

      chimeEl.play()
        .then(() => {
          // Would be handled by event handlers above
        })
        .catch((e) => {
          // Clean up anyway if audio blocked
          console.warn("Audio play blocked:", e);
          clearUp();
        });
    });
  }

  // Send a notification if no other notification is active
  function sendNotification(title, body, notify_type = "short") {
    if (notificationMuted || (!notificationSoundsEnabled && !notificationVisualAlertsEnabled)) return;

    if (isNotificationActive) {
      console.warn("Notification ignored - one already running.");
      return;
    }
    isNotificationActive = true;

    const chimeEl = document.getElementById("notification-sound");
    getChimeDuration(chimeEl).then((total) => {
      let playDuration = (notify_type === "short") ? total / 2 : total;
      const releaseNotification = () => {
        isNotificationActive = false;
      };

      if (notificationSoundsEnabled) {
        playChime({
          notify_type,
          chimeEl,
          onEnded: releaseNotification
        });
      } else {
        setTimeout(releaseNotification, playDuration * 1000);
      }

      if (!notificationVisualAlertsEnabled) return;

      showToast(`${title}: ${body}`, playDuration * 1000);

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body: body,
            icon: "assets/flodoro-logo.png"
          });
        } catch (e) {
          console.warn("Notification failed:", e);
          showToast(`${title}: ${body}`, playDuration * 1000);
        }
      }
    });
  }

  // Simple toast as before
  function showToast(message, duration = 4000) {
    const toast = document.getElementById("toast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("show");
    toast.classList.remove("hidden");
    setTimeout(() => {
      toast.classList.remove("show");
      toast.classList.add("hidden");
    }, duration);
  }


  // Toggle settings panel visibility
  function openSettings() { togglePanel('settings'); }
  function closeSettings() { hidePanel('settings'); }
  function openNotifications() { togglePanel('notifications'); }
  function backToSettingsFromNotifications() {
    hidePanel('notifications');
    showPanel('settings');
  }
  function closeNotifications() { hidePanel('notifications'); }

  // Postpone the current break by adding 5 minutes; can be used only once per break
  function postponeBreak() {
    // Only allow postponing once per break and only during a break
    if (postponeUsed || currentSessionType === SESSION.WORK) return;
    // Converting break into additional work: switch to work mode and extend timer
    currentSessionType = SESSION.WORK;
    remainingTime += 5 * 60;
    // Extend total time for history recording
    if (sessionTotalTime !== null) {
      sessionTotalTime += 5 * 60;
    }
    postponeUsed = true;
    postponeButtonEl.classList.add('hidden');
    updateDisplay();
    // Hide break quote as we resumed work
    hideQuote();
    // Reschedule notifications for the extended work session
    // clearScheduledNotifications();
    // if (isRunning) {
    //   scheduleNotifications();
    // }
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
  // Load tasks from storage and normalize legacy string-only entries.
  function loadTasks() {
    const storedTasks = readStorageJson(STORAGE_KEYS.tasks, []);
    if (Array.isArray(storedTasks)) {
      tasks = storedTasks.map((t) => {
        if (typeof t === 'string') return { text: t, done: false, starred: false };
        return {
          text: t.text || '',
          done: !!t.done,
          starred: !!t.starred
        };
      });
    } else {
      tasks = [];
    }
    currentTaskIndex = 0;
    updateCurrentTaskDisplay();
    updateTasksList();
    updateFlaggedTasksDisplay();
  }

  function saveTasks() {
    writeStorageJson(STORAGE_KEYS.tasks, tasks);
  }

  // Render tasks into the tasks panel list
  function updateTasksList() {
    if (!tasksListEl) return;
    // Clear existing list
    tasksListEl.replaceChildren();
    // Render each task in its current order (no sorting) and attach drag‑and‑drop handlers
    tasks.forEach((task, index) => {
      const li = document.createElement('li');
      li.draggable = true;
      li.dataset.index = index;
      // Handle drag start
      li.addEventListener('dragstart', (ev) => {
        draggedTaskIndex = index;
        // Indicate move effect
        if (ev.dataTransfer) {
          ev.dataTransfer.effectAllowed = 'move';
        }
      });
      // Allow drag over
      li.addEventListener('dragover', (ev) => {
        ev.preventDefault();
        if (ev.dataTransfer) {
          ev.dataTransfer.dropEffect = 'move';
        }
      });
      // Handle drop to reorder
      li.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const dropIndex = parseInt(ev.currentTarget.dataset.index, 10);
        if (draggedTaskIndex !== null && !isNaN(dropIndex) && draggedTaskIndex !== dropIndex) {
          // Remove the dragged task and insert at new index
          const [moved] = tasks.splice(draggedTaskIndex, 1);
          tasks.splice(dropIndex, 0, moved);
          // Adjust currentTaskIndex to follow moved task
          if (draggedTaskIndex === currentTaskIndex) {
            currentTaskIndex = dropIndex;
          } else if (draggedTaskIndex < currentTaskIndex && dropIndex >= currentTaskIndex) {
            currentTaskIndex--;
          } else if (draggedTaskIndex > currentTaskIndex && dropIndex <= currentTaskIndex) {
            currentTaskIndex++;
          }
          saveTasks();
          updateTasksList();
          updateCurrentTaskDisplay();
          updateFlaggedTasksDisplay();
        }
        draggedTaskIndex = null;
      });
      li.addEventListener('dragend', () => {
        draggedTaskIndex = null;
      });
      // Checkbox for marking complete
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.done;
      checkbox.addEventListener('change', () => {
        const wasDone = task.done;
        task.done = checkbox.checked;
        if (!wasDone && task.done) {
          recordTaskEvent('Completed', task.text);
        }
        // Advance current task pointer if necessary
        if (checkbox.checked && index === currentTaskIndex && currentTaskIndex < tasks.length) {
          currentTaskIndex++;
          updateCurrentTaskDisplay();
        }
        saveTasks();
        updateTasksList();
        updateFlaggedTasksDisplay();
      });
      // Star button to flag important tasks
      const starBtn = document.createElement('button');
      starBtn.className = 'star-button';
      starBtn.textContent = task.starred ? '★' : '☆';
      starBtn.title = task.starred ? 'Unstar task' : 'Star task';
      starBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        task.starred = !task.starred;
        saveTasks();
        updateTasksList();
        updateFlaggedTasksDisplay();
      });
      // Task text span
      const span = document.createElement('span');
      span.textContent = task.text;
      if (task.done) {
        span.style.textDecoration = 'line-through';
        span.style.opacity = '0.6';
      }
      // Delete button
      const delBtn = document.createElement('button');
      delBtn.textContent = '🗑️';
      delBtn.className = 'delete-button';
      delBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const removed = tasks.splice(index, 1)[0];
        if (index < currentTaskIndex) {
          currentTaskIndex--;
        } else if (index === currentTaskIndex) {
          // pointer remains at same index
        }
        recordTaskEvent('Deleted', removed.text);
        saveTasks();
        updateTasksList();
        updateCurrentTaskDisplay();
        updateFlaggedTasksDisplay();
      });
      li.appendChild(checkbox);
      li.appendChild(starBtn);
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
    tasks.push({ text: value, done: false, starred: false });
    newTaskInputEl.value = '';
    saveTasks();
    updateTasksList();
    updateCurrentTaskDisplay();
    // Record task addition event
    recordTaskEvent('Added', value);
  }

  // Open and close tasks panel
  function openTasks() { togglePanel('tasks'); }
  function closeTasks() { hidePanel('tasks'); }

  function loadHistory() {
    const storedHistory = readStorageJson(STORAGE_KEYS.history, []);
    history = Array.isArray(storedHistory) ? storedHistory : [];
    updateHistoryDisplay();
  }

  function saveHistory() {
    writeStorageJson(STORAGE_KEYS.history, history);
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

  function appendHistoryCells(li, label, detail) {
    const labelSpan = document.createElement('span');
    labelSpan.textContent = label;
    const detailSpan = document.createElement('span');
    detailSpan.textContent = detail;
    li.appendChild(labelSpan);
    li.appendChild(detailSpan);
  }

  // Render history list into history panel
  function updateHistoryDisplay() {
    if (!historyListEl) return;
    historyListEl.replaceChildren();
    history.forEach((item) => {
      const li = document.createElement('li');
      // Distinguish between session entries and task events
      if (item.type === 'Task') {
        const date = new Date(item.timestamp);
        const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const action = typeof item.action === 'string' ? item.action : 'Updated';
        const text = typeof item.text === 'string' ? item.text : '';
        appendHistoryCells(li, `${action} task`, `${text} @ ${timeStr}`);
      } else {
        // Format start and end times to local time strings
        const startDate = new Date(item.start);
        const endDate = new Date(item.end);
        const startStr = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endStr = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // Use planned duration (sessionTotalTime) if available, fallback to elapsed
        const totalSeconds = typeof item.duration === 'number' ? item.duration : item.elapsed;
        const durationMinutes = Math.floor(totalSeconds / 60);
        const durationSeconds = totalSeconds % 60;
        const durationStr = `${durationMinutes}:${String(durationSeconds).padStart(2, '0')}`;
        const type = typeof item.type === 'string' ? item.type : 'Session';
        appendHistoryCells(li, type, `${startStr}–${endStr} (${durationStr})`);
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
  function openHistory() { togglePanel('history'); }
  function closeHistory() { hidePanel('history'); }

  /** Audio settings panel functions */
  function openAudio() { togglePanel('audio'); }
  function closeAudio() { hidePanel('audio'); }

  function openPlaylist() { togglePanel('playlist'); }
  function closePlaylist() { hidePanel('playlist'); }
  function backToAudioFromPlaylist() {
    hidePanel('playlist');
    showPanel('audio');
  }

  /** Statistics panel functions */
  function openStats() { togglePanel('stats'); }
  function closeStats() { hidePanel('stats'); }

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
        PANELS.forEach((_, k) => hidePanel(k));
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
        togglePlayPause();
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

  // Ask the browser for notification permission. Browser permission state
  // (granted / denied / default) is the single source of truth; we never
  // shadow it with a localStorage flag.
  function requestNotificationPermission() {
    if (notificationMuted || !notificationVisualAlertsEnabled) return;
    if (!('Notification' in window)) return;
    if (Notification.permission !== 'default') return;
    try {
      Notification.requestPermission();
    } catch (e) {
      // Older browsers throw on the promise form; ignore.
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
    if (muteToggleEl) muteToggleEl.addEventListener('click', toggleMute);
    if (audioProgressEl) audioProgressEl.addEventListener('input', seekAudio);
    if (localAudioFolderButtonEl) localAudioFolderButtonEl.addEventListener('click', chooseLocalAudioFolder);
    if (clearLocalAudioButtonEl) clearLocalAudioButtonEl.addEventListener('click', clearLocalAudioAccess);
    if (localAudioInputEl) {
      localAudioInputEl.addEventListener('change', () => loadPickedLocalAudioFiles(localAudioInputEl.files));
    }

    // Auto‑advance when the current track finishes
    audioPlayerEl.addEventListener('ended', () => {
      /* some MP3s report a duration that is shorter than reality.
         Only skip if we are really at (or extremely close to) the end. */
      if (
        audioIsPlaying &&
        audioPlayerEl.duration &&
        audioPlayerEl.currentTime >= audioPlayerEl.duration * 0.95
      ) {
        nextTrack();
      } else {
        /* false alarm – just keep playing the same file */
        audioPlayerEl.play().catch(() => { audioIsPlaying = false; });
      }
    });
    // Audio genre change updates track options
    if (audioGenreSelectEl) audioGenreSelectEl.addEventListener('change', () => {
      updateAudioSelectOptions();
    });
    // Track selection change applies audio track
    if (audioSelectEl) audioSelectEl.addEventListener('change', () => {
      const track = audioSelectEl.value;
      applyAudioTrack(track);
      updateStoredPreferences({
        audioTrack: track,
        audioGenre: audioGenreSelectEl ? audioGenreSelectEl.value : audioGenre
      });
    });
    // Audio playback controls
    if (prevTrackEl) prevTrackEl.addEventListener('click', previousTrack);
    if (nextTrackEl) nextTrackEl.addEventListener('click', nextTrack);
    if (audioPlayPauseEl) audioPlayPauseEl.addEventListener('click', togglePlayPause);
    audioPlayerEl.addEventListener('timeupdate', updateAudioProgressBar);

    document.addEventListener('click', (evt) => {
      // A‑) inside a visible panel?
      const insidePanel = [...PANELS.values()].some(
        el => !el.classList.contains('hidden') && el.contains(evt.target)
      );

      // B‑) on ANY button (tray buttons, timer controls, etc.)?
      //     `.closest` crawls up, so SVGs / emojis inside <button> still count.
      const onButton = evt.target.closest('button');

      // If it’s neither A nor B, it’s “empty space” – close everything.
      if (!insidePanel && !onButton) {
        PANELS.forEach((_, k) => hidePanel(k));
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
      updateStoredPreferences({
        baseColor: colorPickerEl.value,
        themePreset: 'custom'
      });
    });
    // Colour mode toggle button (light/dark)
    if (colorModeToggleEl) colorModeToggleEl.addEventListener('click', () => {
      toggleColorMode();
      updateStoredPreferences({ darkMode });
    });
    // Theme preset selection
    if (themePresetSelectEl) themePresetSelectEl.addEventListener('change', () => {
      const preset = normalizeThemePreset(themePresetSelectEl.value);
      if (themePresetSelectEl.value !== preset) themePresetSelectEl.value = preset;
      applyThemePreset(preset);
      const patch = { themePreset: preset };
      if (preset !== 'custom') {
        patch.baseColor = colorPickerEl.value;
      }
      updateStoredPreferences(patch);
    });

    // Background colour pickers for dynamic gradient
    if (bgColor1El) bgColor1El.addEventListener('input', () => {
      bgColor1 = bgColor1El.value;
      applyBackgroundGradient();
      updateStoredPreferences({ bgColor1 });
    });
    if (bgColor2El) bgColor2El.addEventListener('input', () => {
      bgColor2 = bgColor2El.value;
      applyBackgroundGradient();
      updateStoredPreferences({ bgColor2 });
    });
    // keyboard support
    document.addEventListener('keydown', handleKeydown);

    // Audio settings button and close button
    if (audioSettingsButtonEl) audioSettingsButtonEl.addEventListener('click', openAudio);
    if (closeAudioEl) closeAudioEl.addEventListener('click', closeAudio);
    // Stats button and close button
    if (statsButtonEl) statsButtonEl.addEventListener('click', openStats);
    if (closeStatsEl) closeStatsEl.addEventListener('click', closeStats);
    if (notificationSettingsButtonEl) notificationSettingsButtonEl.addEventListener('click', openNotifications);
    if (backNotificationsEl) backNotificationsEl.addEventListener('click', backToSettingsFromNotifications);
    if (closeNotificationsEl) closeNotificationsEl.addEventListener('click', closeNotifications);
    if (playlistManagerButtonEl) playlistManagerButtonEl.addEventListener('click', openPlaylist);
    if (backPlaylistEl) backPlaylistEl.addEventListener('click', backToAudioFromPlaylist);
    if (closePlaylistEl) closePlaylistEl.addEventListener('click', closePlaylist);
  }

  // Initialise application
  function init() {
    loadPreferences();
    requestNotificationPermission();
    attachEventListeners();
    updateDisplay();
    updateCurrentTaskDisplay();
    updateAudioProgressVisibility();
    populateGenreSelect({ persist: false });
    restoreLocalAudioDirectories().catch((error) => {
      console.warn('Local audio restore failed.', error);
      updateLocalAudioStatus();
    });
  }

  // Kick things off when DOM is ready
  document.addEventListener('DOMContentLoaded', init);
})();