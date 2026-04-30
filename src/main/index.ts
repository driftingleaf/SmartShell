import { app, BrowserWindow, ipcMain, Menu } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/terminalIpc'
import { ProfileManager } from './profiles/ProfileManager'
import { PtyManager } from './pty/PtyManager'
import { WorkspaceManager } from './workspace/WorkspaceManager'

let mainWindow: BrowserWindow | null = null
let allowClose = false

const profileManager = new ProfileManager()
const workspaceManager = new WorkspaceManager()
const ptyManager = new PtyManager(profileManager, () => mainWindow)
const appIcon = join(__dirname, '../../build/icon.ico')

function registerWindowIpc(): void {
  ipcMain.handle('window:minimize', () => {
    mainWindow?.minimize()
  })

  ipcMain.handle('window:toggle-maximize', () => {
    if (!mainWindow) return false

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
      return false
    }

    mainWindow.maximize()
    return true
  })

  ipcMain.handle('window:close', () => {
    mainWindow?.close()
  })

  ipcMain.handle('window:confirm-close', () => {
    allowClose = true
    mainWindow?.close()
  })

  ipcMain.handle('window:is-maximized', () => mainWindow?.isMaximized() ?? false)
}

function createWindow(): void {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'SmartShell',
    icon: appIcon,
    frame: false,
    titleBarStyle: 'hidden',
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('close', (event) => {
    if (!allowClose) {
      event.preventDefault()
      mainWindow?.webContents.send('window:close-requested')
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  if (is.dev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  await profileManager.load()
  registerWindowIpc()
  registerIpcHandlers(ptyManager, profileManager, workspaceManager)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
