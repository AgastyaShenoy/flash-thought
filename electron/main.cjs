const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

// Keep a global reference of the window object to prevent garbage collection
let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1000,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            nodeIntegration: false,
            contextIsolation: true,
        },
        titleBarStyle: 'hidden', // Give it a sleek modern look
        titleBarOverlay: {
            color: '#1e293b',
            symbolColor: '#7f68c7',
            height: 30
        }
    });

    // Determine if we are in development or production
    const isDev = !app.isPackaged;

    if (isDev) {
        // Load the vite dev server URL
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        // Load the production build
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();

    // Configure autoUpdater
    // We use the default configuration which checks for the 'latest.yml' file in our GitHub Releases
    autoUpdater.checkForUpdatesAndNotify();

    app.on('activate', function () {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') app.quit();
});

// Auto-Updater Events
autoUpdater.on('update-available', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update_available');
    }
});

autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
        mainWindow.webContents.send('update_downloaded');
    }
});

// IPC handler to restart app to apply update
ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});
