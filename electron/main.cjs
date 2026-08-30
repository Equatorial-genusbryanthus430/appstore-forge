const { app, BrowserWindow, dialog, ipcMain, shell } = require('electron')
const fs = require('node:fs/promises')
const path = require('node:path')

const DEV_SERVER = process.env.VITE_DEV_SERVER_URL

/** @type {BrowserWindow | null} */
let win = null

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 940,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    backgroundColor: '#f6f6f7',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  win.once('ready-to-show', () => win?.show())

  if (DEV_SERVER) {
    win.loadURL(DEV_SERVER)
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  // Anything that isn't the app itself belongs in the user's real browser.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

ipcMain.handle('choose-folder', async () => {
  if (!win) return null
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Choose where to save the screenshots',
    buttonLabel: 'Save here',
    properties: ['openDirectory', 'createDirectory'],
  })
  return canceled || !filePaths.length ? null : filePaths[0]
})

/**
 * Write a batch of rendered screenshots into `<dir>/<folder>/`, replacing any previous
 * run of the same export so re-exports don't pile up stale numbering.
 */
ipcMain.handle('write-files', async (_event, dir, folder, files) => {
  const target = path.join(dir, folder)
  await fs.rm(target, { recursive: true, force: true })
  await fs.mkdir(target, { recursive: true })
  for (const file of files) {
    await fs.writeFile(path.join(target, file.name), Buffer.from(file.data))
  }
  return target
})

ipcMain.handle('reveal-path', async (_event, target) => {
  shell.openPath(target)
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
