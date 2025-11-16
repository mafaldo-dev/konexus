const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron'); // 👈 ADICIONE globalShortcut
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 768,
    minWidth: 1360,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      contextIsolation: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
    },
  });

  const session = win.webContents.session;
  
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https://backend-oi68.onrender.com http://localhost:3010 data: blob: ws: wss:"
        ],
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, PATCH, OPTIONS'],
        'Access-Control-Allow-Headers': ['Content-Type, Authorization'],
      }
    });
  });

  session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        'Origin': 'electron://app',
      }
    });
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

  // ✅ REGISTRAR ATALHOS GLOBAIS F4 E F1
  const registerShortcuts = () => {
    // Registra F4 para Kardex
    const f4Registered = globalShortcut.register('F4', () => {
      console.log('🔔 Atalho F4 pressionado - Kardex');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-shortcut-f4');
      }
    });

    // Registra F1 para Ajuda
    const f1Registered = globalShortcut.register('F1', () => {
      console.log('🔔 Atalho F1 pressionado - Ajuda');
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('global-shortcut-f1');
      }
    });

    // Verifica se os atalhos foram registrados com sucesso
    console.log('F4 registered:', f4Registered);
    console.log('F1 registered:', f1Registered);
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
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
    
    // ✅ RE-REGISTRAR ATALHOS QUANDO NOVA JANELA FOR CRIADA
    setTimeout(() => {
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
    }, 1000);
  }
});

// ✅ DESREGISTRAR ATALHOS QUANDO A APP FECHAR
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  console.log('🔔 Atalhos globais desregistrados');
});

app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
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