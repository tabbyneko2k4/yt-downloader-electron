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
  }
});
