const { contextBridge, ipcRenderer } = require('electron');

// Expose safe APIs for the renderer (React) to call
contextBridge.exposeInMainWorld('electronAPI', {
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
});
