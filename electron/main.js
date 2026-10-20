const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require("fs");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

function startNetworkMonitor(win) {
  const dns = require("dns");
  let lastOnline = true;

  setInterval(() => {
    dns.resolve("google.com", (err) => {
      const online = !err;
      if (online !== lastOnline) {
        lastOnline = online;
        win.webContents.send("network-status", online);
      }
    });
  }, 3000);
}

// ✅ HANDLER PARA SALVAR EXCEL
ipcMain.on("save-excel-file", async (event, { fileName, buffer }) => {
  try {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title: 'Salvar Relatório Excel',
      defaultPath: path.join(app.getPath('documents'), fileName),
      filters: [
        { name: "Arquivos Excel", extensions: ["xlsx"] },
        { name: "Todos os arquivos", extensions: ["*"] }
      ],
    });

    if (canceled || !filePath) {
      console.warn('❌ Usuário cancelou o salvamento');
      return;
    }

    fs.writeFile(filePath, Buffer.from(buffer), (err) => {
      if (err) {
        console.error("❌ Erro ao salvar arquivo:", err);
        event.reply('save-excel-error', err.message);
      } else {
        console.info('✅ Arquivo salvo com sucesso:', filePath);
        event.reply('save-excel-success', filePath);
      }
    });
  } catch (error) {
    console.error("❌ Erro no dialog:", error);
    event.reply('save-excel-error', error.message);
  }
});

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 768,
    minWidth: 1360,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false, 
      webSecurity: false,
      enableRemoteModule: true, 
    },
  });

  win.webContents.on('did-finish-load', () => {
    win.webContents.executeJavaScript(`
      if (typeof window !== 'undefined' && typeof require !== 'undefined') {
        window.ipcRenderer = require('electron').ipcRenderer;
      }
    `);
  });

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    log.error('Failed to load:', errorCode, errorDescription);
  });

  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../build/index.html'));
    win.webContents.on('did-finish-load', () => {
      win.webContents.insertCSS(`
        body { background-color: #fff !important; }
      `);
    });
  }

  return win;
}

let mainWindow;

app.whenReady().then(() => {
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  app.commandLine.appendSwitch('disable-site-isolation-trials');

  mainWindow = createWindow();
  startNetworkMonitor(mainWindow);

  const registerShortcuts = () => {
    globalShortcut.register('F4', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-shortcut-f4');
      }
    });

    globalShortcut.register('F1', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-shortcut-f1');
      }
    });
  };

  registerShortcuts();

  if (process.env.NODE_ENV !== 'development') {
    autoUpdater.checkForUpdatesAndNotify();
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) mainWindow = createWindow();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('certificate-error', (event, url, callback) => {
  if (url.startsWith('https://backend-oi68.onrender.com')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});

// Eventos do autoUpdater
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
  if (mainWindow) {
    mainWindow.webContents.send('update_available');
  }
});

autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available.');
});

autoUpdater.on('error', (err) => {
  log.error('Error in auto-updater: ' + err);
});

autoUpdater.on('download-progress', (progressObj) => {
  let log_message = "Download speed: " + progressObj.bytesPerSecond;
  log_message = log_message + ' - Downloaded ' + progressObj.percent + '%';
  log_message = log_message + ' (' + progressObj.transferred + "/" + progressObj.total + ')';
  log.info(log_message);

  if (mainWindow) {
    mainWindow.webContents.send('download_progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded; waiting for user to install');
  if (mainWindow) {
    mainWindow.webContents.send('update_downloaded');
  }
});

ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});

// Handler para iniciar download de atualização solicitado pelo usuário
ipcMain.on('download_update', () => {
  log.info('Usuário solicitou download de atualização');
  autoUpdater.downloadUpdate();
});