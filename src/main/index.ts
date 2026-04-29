import { app, BrowserWindow, Menu } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/terminalIpc'
import { ProfileManager } from './profiles/ProfileManager'
import { PtyManager } from './pty/PtyManager'
import { WorkspaceManager } from './workspace/WorkspaceManager'

let mainWindow: BrowserWindow | null = null

const profileManager = new ProfileManager()
const workspaceManager = new WorkspaceManager()
const ptyManager = new PtyManager(profileManager, () => mainWindow)
const appIcon = join(__dirname, '../../build/icon.ico')

function createWindow(): void {
  Menu.setApplicationMenu(null)

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'SmartShell',
    icon: appIcon,
    autoHideMenuBar: true,
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
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
