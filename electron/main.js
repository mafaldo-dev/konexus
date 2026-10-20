const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require("fs");

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;
let updateState = { status: 'idle' };
let updateCheckInProgress = false;
let updateCheckScheduled = false;
let updateFlowStarted = false;
let manualUpdateCheck = false;
let lastUpdateErrorAt = 0;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function setUpdateState(state) {
  updateState = state;
  sendToRenderer('update_status', state);
}

function handleUpdaterError(err) {
  const message = err && err.message ? err.message : String(err);
  const now = Date.now();

  // O evento "error" e o catch da promise podem disparar para a mesma falha.
  if (now - lastUpdateErrorAt < 1500) return;
  lastUpdateErrorAt = now;

  log.error('Error in auto-updater: ' + message);

  // Falhas de verificação (sem atualização encontrada) não devem bloquear o login.
  if (updateFlowStarted || manualUpdateCheck) {
    setUpdateState({ status: 'error', message });
    sendToRenderer('update_error', message);
  } else {
    updateState = { status: 'not-available' };
  }
}

function startUpdateCheck(isManual = false) {
  if (!app.isPackaged || updateCheckInProgress) return;

  updateCheckInProgress = true;
  manualUpdateCheck = isManual;
  log.info('Verificando atualizações...');

  try {
    autoUpdater
      .checkForUpdatesAndNotify()
      .catch(handleUpdaterError)
      .finally(() => {
        updateCheckInProgress = false;
        manualUpdateCheck = false;
      });
  } catch (err) {
    updateCheckInProgress = false;
    manualUpdateCheck = false;
    handleUpdaterError(err);
  }
}

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

  if (app.isPackaged && !updateCheckScheduled) {
    updateCheckScheduled = true;
    win.webContents.once('did-finish-load', () => {
      setTimeout(() => startUpdateCheck(false), 3000);
    });
  }

  return win;
}

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
  setUpdateState({ status: 'checking' });
  sendToRenderer('update_checking');
});

autoUpdater.on('update-available', (info) => {
  updateFlowStarted = true;
  log.info(`Update available: ${info?.version || 'versão desconhecida'}`);
  setUpdateState({ status: 'available', version: info?.version });
  sendToRenderer('update_available', { version: info?.version });
});

autoUpdater.on('update-not-available', (info) => {
  updateFlowStarted = false;
  log.info(`Update not available (latest: ${info?.version || 'desconhecida'}).`);
  setUpdateState({ status: 'not-available' });
  sendToRenderer('update_not_available', { version: info?.version });
});

autoUpdater.on('error', (err) => {
  handleUpdaterError(err);
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Math.round(progressObj.percent);
  log.info(`Download: ${percent}% (${progressObj.transferred}/${progressObj.total})`);

  updateState = {
    status: 'downloading',
    version: updateState.version,
    percent,
    bytesPerSecond: progressObj.bytesPerSecond,
    transferred: progressObj.transferred,
    total: progressObj.total,
  };
  sendToRenderer('download_progress', progressObj);
});

autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded; waiting for user to install');
  setUpdateState({
    status: 'downloaded',
    version: info?.version || updateState.version,
  });
  sendToRenderer('update_downloaded', { version: info?.version });
});

ipcMain.handle('get_update_status', () => updateState);

ipcMain.on('check_for_update', () => {
  startUpdateCheck(true);
});

ipcMain.on('restart_app', () => {
  if (updateState.status === 'downloaded') {
    autoUpdater.quitAndInstall();
  } else {
    log.info('restart_app ignorado: nenhuma atualização baixada');
  }
});

// Compatibilidade com telas antigas que solicitavam o download manualmente.
ipcMain.on('download_update', () => {
  if (updateState.status === 'available' || updateState.status === 'downloading') {
    log.info('Download de atualização solicitado pela interface');
    autoUpdater.downloadUpdate().catch(handleUpdaterError);
  } else {
    log.info('download_update ignorado: nenhuma atualização disponível');
  }
});