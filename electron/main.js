const { app, BrowserWindow, ipcMain, globalShortcut, dialog } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');
const log = require('electron-log');
const fs = require("fs");
const {
  DEFAULT_ARTIFACT_NAME_TEMPLATE,
  DEFAULT_PRODUCT_NAME,
  selectWindowsInstallerFromUpdateInfo,
  toRendererAsset,
} = require('./updateAssets');
const packageJson = require('../package.json');

const APP_PRODUCT_NAME = packageJson.productName || DEFAULT_PRODUCT_NAME;
const ARTIFACT_NAME_TEMPLATE =
  packageJson.build && packageJson.build.win && packageJson.build.win.artifactName
    ? packageJson.build.win.artifactName
    : DEFAULT_ARTIFACT_NAME_TEMPLATE;
const AUTO_DOWNLOAD_DELAY_MS = 1500;

autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';

// O download só é iniciado depois que o instalador declarado no latest.yml é
// validado. A biblioteca continua sendo a responsável por baixar e validar o
// SHA-512; o processo principal apenas controla o momento e o asset escolhido.
autoUpdater.autoDownload = false;
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.allowPrerelease = false;
autoUpdater.allowDowngrade = false;

let mainWindow;
let updateState = { status: 'idle' };
let updateCheckInProgress = false;
let updateCheckScheduled = false;
let updateFlowStarted = false;
let manualUpdateCheck = false;
let lastUpdateErrorAt = 0;
let automaticDownloadTimer = null;
let updateDownloadPromise = null;

function sendToRenderer(channel, payload) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, payload);
  }
}

function setUpdateState(state) {
  updateState = state;
  sendToRenderer('update_status', state);
}

function clearAutomaticDownload() {
  if (automaticDownloadTimer) {
    clearTimeout(automaticDownloadTimer);
    automaticDownloadTimer = null;
  }
}

function handleUpdaterError(err) {
  clearAutomaticDownload();

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

// Chamado pelo timer automático e pelo botão "Baixar atualização". Não recebe
// nenhuma URL do renderer: o electron-updater usa o latest.yml já verificado.
function startUpdateDownload(origin = 'manual') {
  clearAutomaticDownload();

  if (updateState.status === 'downloaded') {
    log.info('Download de atualização ignorado: a atualização já foi baixada.');
    return null;
  }

  if (updateState.status !== 'available' && updateState.status !== 'downloading') {
    log.info(`Download de atualização ignorado: nenhuma atualização disponível (estado: ${updateState.status}).`);
    return null;
  }

  if (updateDownloadPromise) {
    log.info('Download de atualização ignorado: já existe um download em andamento.');
    return updateDownloadPromise;
  }

  const assetName = updateState.asset && updateState.asset.name
    ? updateState.asset.name
    : 'instalador';

  log.info(`Iniciando download da atualização (${origin}): ${assetName}`);

  updateDownloadPromise = autoUpdater
    .downloadUpdate()
    .catch(handleUpdaterError)
    .finally(() => {
      updateDownloadPromise = null;
    });

  return updateDownloadPromise;
}

function scheduleAutomaticDownload() {
  clearAutomaticDownload();

  automaticDownloadTimer = setTimeout(() => {
    automaticDownloadTimer = null;
    startUpdateDownload('automatic');
  }, AUTO_DOWNLOAD_DELAY_MS);
}

function startUpdateCheck(isManual = false) {
  if (!app.isPackaged || updateCheckInProgress) return;

  updateCheckInProgress = true;
  manualUpdateCheck = isManual;
  log.info('Verificando atualizações...');

  try {
    autoUpdater
      .checkForUpdates()
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
  clearAutomaticDownload();
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
  clearAutomaticDownload();

  let asset;
  try {
    asset = selectWindowsInstallerFromUpdateInfo(info, {
      version: info && info.version,
      artifactNameTemplate: ARTIFACT_NAME_TEMPLATE,
      productName: APP_PRODUCT_NAME,
      arch: process.arch,
    });
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    const code = err && err.code ? err.code : 'INVALID_UPDATE_ASSET';
    log.error(`Atualização rejeitada (${code}): ${message}`);
    setUpdateState({
      status: 'error',
      message: `Atualização cancelada: ${message}`,
    });
    sendToRenderer('update_error', message);
    return;
  }

  const rendererAsset = toRendererAsset(asset);
  log.info(
    `Update available: ${info.version} (${asset.name}, ${asset.size} bytes, sha512=${asset.sha512.slice(0, 12)}...)`
  );
  setUpdateState({
    status: 'available',
    version: info.version,
    asset: rendererAsset,
  });
  sendToRenderer('update_available', {
    version: info.version,
    asset: rendererAsset,
  });

  // Mantém o download automático já existente, mas somente depois de validar
  // que o feed aponta para o instalador Windows esperado.
  scheduleAutomaticDownload();
});

autoUpdater.on('update-not-available', (info) => {
  updateFlowStarted = false;
  clearAutomaticDownload();
  log.info(`Update not available (latest: ${info?.version || 'desconhecida'}).`);
  setUpdateState({ status: 'not-available' });
  sendToRenderer('update_not_available', { version: info?.version });
});

autoUpdater.on('error', (err) => {
  handleUpdaterError(err);
});

autoUpdater.on('download-progress', (progressObj) => {
  const percent = Number.isFinite(progressObj?.percent)
    ? Math.max(0, Math.min(100, Math.round(progressObj.percent)))
    : 0;
  log.info(`Download: ${percent}% (${progressObj.transferred}/${progressObj.total})`);

  const state = {
    status: 'downloading',
    version: updateState.version,
    asset: updateState.asset,
    percent,
    bytesPerSecond: progressObj.bytesPerSecond,
    transferred: progressObj.transferred,
    total: progressObj.total,
  };
  setUpdateState(state);
  sendToRenderer('download_progress', {
    ...progressObj,
    percent,
    version: state.version,
    asset: state.asset,
  });
});

autoUpdater.on('update-downloaded', (info) => {
  clearAutomaticDownload();
  log.info('Update downloaded; waiting for user to install');
  setUpdateState({
    status: 'downloaded',
    version: info?.version || updateState.version,
    asset: updateState.asset,
  });
  sendToRenderer('update_downloaded', {
    version: info?.version || updateState.version,
    asset: updateState.asset,
  });
});

ipcMain.handle('get_update_status', () => updateState);

ipcMain.on('check_for_update', () => {
  clearAutomaticDownload();
  startUpdateCheck(true);
});

ipcMain.on('restart_app', () => {
  clearAutomaticDownload();
  if (updateState.status === 'downloaded') {
    autoUpdater.quitAndInstall();
  } else {
    log.info('restart_app ignorado: nenhuma atualização baixada');
  }
});

// O renderer não envia URL, nome de arquivo nem tag. A seleção do asset e a
// resolução da URL oficial ficam no processo principal/electron-updater.
ipcMain.on('download_update', () => {
  log.info('Download de atualização solicitado pela interface');
  startUpdateDownload('manual');
});