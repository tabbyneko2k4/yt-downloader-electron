const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('dialog:select-directory'),
  getVideoInfo: (url) => ipcRenderer.invoke('yt-dlp:get-info', url),
  downloadVideo: (options) => ipcRenderer.invoke('yt-dlp:download', options),
  cancelDownload: (id) => ipcRenderer.invoke('yt-dlp:cancel', id),
  openFolder: (path) => ipcRenderer.invoke('shell:open-folder', path),
  
  // Listeners for progress and logs
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  },
  onDownloadLog: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-log', subscription);
    return () => ipcRenderer.removeListener('download-log', subscription);
  }
});
