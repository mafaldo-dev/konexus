const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 768,
    minWidth: 1360, // largura mínima
    minHeight: 768,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
      contextIsolation: false,
    },
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
  mainWindow = createWindow();

  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F4') {
      event.preventDefault();
      mainWindow.webContents.send('shortcut:f4');
    }
  });

  // Só roda o autoUpdater em produção, pra evitar problema no dev
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

// Eventos para debug e controle da atualização
autoUpdater.on('checking-for-update', () => {
  log.info('Checking for update...');
});

autoUpdater.on('update-available', (info) => {
  log.info('Update available.');
  // Envia evento para o renderer avisar usuário
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
  // Opcional: envie progresso para renderer se quiser mostrar barra de progresso
  if (mainWindow) {
    mainWindow.webContents.send('download_progress', progressObj);
  }
});

autoUpdater.on('update-downloaded', () => {
  log.info('Update downloaded; waiting for user to install');
  // Envia evento para o renderer avisar que atualização está pronta
  if (mainWindow) {
    mainWindow.webContents.send('update_downloaded');
  }
});

// Escuta do renderer pedindo para reiniciar e instalar a atualização
ipcMain.on('restart_app', () => {
  autoUpdater.quitAndInstall();
});
