const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  // Window Controls
  minimizeWindow: () => ipcRenderer.invoke('window:minimize'),
  maximizeWindow: () => ipcRenderer.invoke('window:maximize'),
  closeWindow: () => ipcRenderer.invoke('window:close'),

  // Downloads & IPC
  getVideoInfo: (url) => ipcRenderer.invoke('yt-dlp:get-info', url),
  downloadVideo: (options) => ipcRenderer.invoke('yt-dlp:download', options),
  cancelDownload: (id) => ipcRenderer.invoke('yt-dlp:cancel', id),
  pauseDownload: (id) => ipcRenderer.invoke('yt-dlp:pause', id),
  selectLogFile: () => ipcRenderer.invoke('dialog:select-log-file'),
  readLogFile: (filePath) => ipcRenderer.invoke('yt-dlp:read-log-file', filePath),
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  getDownloadsPath: () => ipcRenderer.invoke('app:get-downloads-path'),
  openFolder: (path) => ipcRenderer.invoke('shell:open-folder', path),
  openFile: (path) => ipcRenderer.invoke('shell:open-file', path),
  copyFile: (path) => ipcRenderer.invoke('clipboard:copy-file', path),
  deleteFile: (path) => ipcRenderer.invoke('file:delete', path),

  // Events
  onDownloadProgress: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('download-progress', handler);
    return () => ipcRenderer.removeListener('download-progress', handler);
  },
  onDownloadLog: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('download-log', handler);
    return () => ipcRenderer.removeListener('download-log', handler);
  },
  onDownloadItemChange: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('download-item-change', handler);
    return () => ipcRenderer.removeListener('download-item-change', handler);
  },
  startDrag: (filePath) => {
    ipcRenderer.send('ondragstart', filePath);
  },

  // Mini Window Controls
  miniClose: () => ipcRenderer.invoke('mini:close'),
  miniShowMain: (draft) => ipcRenderer.invoke('mini:show-main', draft),
  miniGetDownloadsMeta: () => ipcRenderer.invoke('mini:get-downloads-meta'),
  miniRequestHistory: () => ipcRenderer.invoke('mini:request-history'),
  miniStartDownload: (options) => ipcRenderer.invoke('mini:start-download', options),

  // App & Window Actions
  quitApp: () => ipcRenderer.invoke('app:quit-app'),
  hideWindow: () => ipcRenderer.invoke('window:hide'),

  // Sync: mini window events
  onMiniActiveUpdate: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('mini:active-update', handler);
    return () => ipcRenderer.removeListener('mini:active-update', handler);
  },
  onMiniActiveRemoved: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('mini:active-removed', handler);
    return () => ipcRenderer.removeListener('mini:active-removed', handler);
  },
  onSyncHistory: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('sync:history', handler);
    return () => ipcRenderer.removeListener('sync:history', handler);
  },

  // Sync: draft state between main app and mini app
  syncPushDraft: (draft) => ipcRenderer.invoke('sync:push-draft', draft),
  syncGetDraft: () => ipcRenderer.invoke('sync:get-draft'),
  onSyncDraft: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('sync:draft', handler);
    return () => ipcRenderer.removeListener('sync:draft', handler);
  },

  // Close Confirmation Dialog Event Listener
  onPromptCloseDialog: (callback) => {
    const handler = (_event) => callback();
    ipcRenderer.on('prompt-close-dialog', handler);
    return () => ipcRenderer.removeListener('prompt-close-dialog', handler);
  },

  // Sync: main renderer pushes history & settings to main process
  syncPushHistory: (history) => ipcRenderer.invoke('sync:push-history', history),
  syncPushSettings: (settings) => ipcRenderer.invoke('sync:push-settings', settings),

  // Sync: listen for real-time settings updates
  onSyncSettings: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('sync:settings', handler);
    return () => ipcRenderer.removeListener('sync:settings', handler);
  },

  // Sync: main renderer listens for request-push-history (from mini asking for fresh data)
  onRequestPushHistory: (callback) => {
    const handler = (_event) => callback();
    ipcRenderer.on('request:push-history', handler);
    return () => ipcRenderer.removeListener('request:push-history', handler);
  },

  // Mini: listen for download requests from mini window
  onMiniDownloadRequest: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('mini:download-request', handler);
    return () => ipcRenderer.removeListener('mini:download-request', handler);
  },

  // Desktop Notifications & Tab Navigation
  onNavigateTab: (callback) => {
    const handler = (_event, tab) => callback(tab);
    ipcRenderer.on('navigate-to-tab', handler);
    return () => ipcRenderer.removeListener('navigate-to-tab', handler);
  },
  showNotification: (options) => ipcRenderer.invoke('show-notification', options),

  // JSON Database (User Documents/YTDownloader)
  getDbPath: () => ipcRenderer.invoke('db:get-path'),
  loadOptionsDb: () => ipcRenderer.invoke('db:load-options'),
  saveOptionsDb: (data) => ipcRenderer.invoke('db:save-options', data),
  loadPresetsDb: () => ipcRenderer.invoke('db:load-presets'),
  savePresetsDb: (data) => ipcRenderer.invoke('db:save-presets', data),
  loadDownloadsDb: () => ipcRenderer.invoke('db:load-downloads'),
  saveDownloadsDb: (data) => ipcRenderer.invoke('db:save-downloads', data),
  addDownloadDbItem: (item) => ipcRenderer.invoke('db:add-download', item),
  deleteDownloadDbItem: (id) => ipcRenderer.invoke('db:delete-download', id),
  clearDownloadsDb: () => ipcRenderer.invoke('db:clear-downloads'),

  onSyncDownloadsDb: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('db:sync-downloads', handler);
    return () => ipcRenderer.removeListener('db:sync-downloads', handler);
  },
  onSyncPresetsDb: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('db:sync-presets', handler);
    return () => ipcRenderer.removeListener('db:sync-presets', handler);
  },
  onSyncOptionsDb: (callback) => {
    const handler = (_event, value) => callback(value);
    ipcRenderer.on('db:sync-options', handler);
    return () => ipcRenderer.removeListener('db:sync-options', handler);
  }
});


