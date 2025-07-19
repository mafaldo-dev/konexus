const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1300,
    height: 935,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,  // IMPORTANTE PRA CARREGAR OS ARQUIVOS
      contextIsolation: false
    }
  })

  // Modo desenvolvimento
  if (process.env.NODE_ENV === 'development') {
    win.loadURL('http://localhost:3000')
    win.webContents.openDevTools()
  } 
  // Modo produção
  else {
    win.loadFile(path.join(__dirname, '../build/index.html'))
    
    // Gambiarra sagrada pra garantir que carrega
    win.webContents.on('did-finish-load', () => {
      win.webContents.insertCSS(`
        body { background-color: #fff !important; }
      `)
    })
  }
}

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
