import { BrowserWindow, Menu, app, ipcMain } from 'electron'
import { join } from 'node:path'
import { is } from '@electron-toolkit/utils'
import { registerIpcHandlers } from './ipc/terminalIpc'
import { ProfileManager } from './profiles/ProfileManager'
import { PtyManager } from './pty/PtyManager'
import { WorkspaceManager } from './workspace/WorkspaceManager'

let mainWindow: BrowserWindow | null = null
let splashWindow: BrowserWindow | null = null
let allowClose = false

const profileManager = new ProfileManager()
const workspaceManager = new WorkspaceManager()
const ptyManager = new PtyManager(profileManager, () => mainWindow)
const appIcon = join(__dirname, '../../build/icon.ico')

const splashHtml = `<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#0f1117;overflow:hidden}
.s{display:grid;width:100vw;height:100vh;place-items:center;color:#d6deeb;font-family:Inter,Segoe UI,system-ui,sans-serif;background:radial-gradient(circle at 50% 35%,rgb(93 228 199/10%),transparent 28%),#0f1117}
.c{display:grid;justify-items:center;gap:14px}
.c p{margin:0;color:#7f8ca8;font-size:13px}
.m{display:grid;width:56px;height:56px;place-items:center;border-radius:16px;background:linear-gradient(135deg,#5de4c7,#82aaff);color:#07111f;font-weight:800;font-size:24px;animation:p 1.6s ease-in-out infinite;box-shadow:0 0 30px rgb(93 228 199/25%)}
.t{animation:f .5s ease-out .3s both}
.u{animation:f .5s ease-out .5s both}
.b{width:120px;height:3px;border-radius:2px;background:#23283a;overflow:hidden;animation:f .4s ease-out .6s both}
.i{width:40%;height:100%;border-radius:2px;background:linear-gradient(90deg,#5de4c7,#82aaff);animation:l 1.2s ease-in-out infinite}
@keyframes p{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.06);opacity:.85}}
@keyframes f{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
@keyframes l{0%{transform:translateX(-100%)}50%{transform:translateX(200%)}100%{transform:translateX(-100%)}}
</style>
</head>
<body>
<div class="s"><div class="c"><span class="m">S</span><strong class="t">SmartShell</strong><p class="u">Loading workspace...</p><div class="b"><div class="i"></div></div></div></div>
</body>
</html>`

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

function createMainWindow(): void {
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
    splashWindow?.close()
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

app.whenReady().then(() => {
  splashWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    frame: false,
    backgroundColor: '#0f1117',
    center: true,
    show: false,
    webPreferences: { sandbox: true }
  })

  splashWindow.on('closed', () => {
    splashWindow = null
  })

  splashWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHtml)}`)

  splashWindow.once('ready-to-show', () => {
    splashWindow?.show()
    createMainWindow()
    void profileManager.load().then(() => {
      registerWindowIpc()
      registerIpcHandlers(ptyManager, profileManager, workspaceManager)
    })
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
