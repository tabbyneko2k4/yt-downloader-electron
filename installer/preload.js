const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  minimize: () => ipcRenderer.send('window:minimize'),
  close: () => ipcRenderer.send('window:close'),
  
  selectDirectory: (defaultPath) => ipcRenderer.invoke('dialog:select-directory', defaultPath),
  getDefaultPaths: () => ipcRenderer.invoke('app:get-default-paths'),
  
  downloadFile: (options) => ipcRenderer.invoke('install:download-file', options),
  extractApp: (options) => ipcRenderer.invoke('install:extract-app', options),
  unzipFile: (options) => ipcRenderer.invoke('install:unzip-file', options),
  
  createShortcuts: (options) => ipcRenderer.invoke('install:create-shortcuts', options),
  pinTaskbar: (options) => ipcRenderer.invoke('install:pin-taskbar', options),
  launchApp: (options) => ipcRenderer.invoke('install:launch-app', options),
  
  onDownloadProgress: (callback) => {
    const subscription = (event, data) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => ipcRenderer.removeListener('download-progress', subscription);
  }
});
