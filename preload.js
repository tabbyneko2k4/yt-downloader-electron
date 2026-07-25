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
  miniShowMain: () => ipcRenderer.invoke('mini:show-main'),
  miniGetDownloadsMeta: () => ipcRenderer.invoke('mini:get-downloads-meta'),
  miniRequestHistory: () => ipcRenderer.invoke('mini:request-history'),
  miniStartDownload: (options) => ipcRenderer.invoke('mini:start-download', options),

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

  // Sync: main renderer pushes history to main process
  syncPushHistory: (history) => ipcRenderer.invoke('sync:push-history', history),

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
  showNotification: (options) => ipcRenderer.invoke('show-notification', options)
});

