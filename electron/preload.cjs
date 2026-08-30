const { contextBridge, ipcRenderer } = require('electron')

/**
 * The renderer checks for `window.desktop` to decide between writing real files
 * and falling back to a browser zip download.
 */
contextBridge.exposeInMainWorld('desktop', {
  platform: process.platform,
  chooseFolder: () => ipcRenderer.invoke('choose-folder'),
  writeFiles: (dir, folder, files) => ipcRenderer.invoke('write-files', dir, folder, files),
  revealPath: (target) => ipcRenderer.invoke('reveal-path', target),
})
