const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Methods to listen to auto-updater events
    onUpdateAvailable: (callback) => ipcRenderer.on('update_available', callback),
    onUpdateDownloaded: (callback) => ipcRenderer.on('update_downloaded', callback),
    removeAllListeners: (channel) => ipcRenderer.removeAllListeners(channel),

    // Method to trigger restart
    restartApp: () => ipcRenderer.send('restart_app'),
});
