const { app, BrowserWindow, ipcMain, globalShortcut } = require('electron');
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
      webSecurity: false, // ✅ Importante: desabilita webSecurity para CORS
      contextIsolation: false,
      allowRunningInsecureContent: true,
      experimentalFeatures: true,
    },
  });

  const session = win.webContents.session;
  
  // ✅ INTERCEPTA REQUISIÇÕES PARA ADICIONAR HEADERS CORS
  session.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        'Origin': 'electron://app',
      }
    });
  });

  // ✅ HEADERS SIMPLIFICADOS - Remove CSP problemático
  session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        // ✅ CSP mínimo e permissivo
        'Content-Security-Policy': ["default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;"],
        // ✅ Headers CORS essenciais
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Methods': ['*'],
        'Access-Control-Allow-Headers': ['*'],
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
  }

  return win;
}

let mainWindow;

app.whenReady().then(() => {
  // 👇 DESABILITA LIMITAÇÕES DE SEGURANÇA PARA DESENVOLVIMENTO
  app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
  app.commandLine.appendSwitch('disable-site-isolation-trials');
  app.commandLine.appendSwitch('ignore-certificate-errors'); // ✅ Para HTTPS do render.com
  
  mainWindow = createWindow();

  // ✅ REGISTRAR ATALHOS GLOBAIS F4 E F1
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

  // Auto-updater apenas em produção
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
  }
});

// ✅ DESREGISTRAR ATALHOS
app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

// ✅ ACEITA CERTIFICADOS SSL
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  event.preventDefault();
  callback(true); // ✅ Aceita todos os certificados
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