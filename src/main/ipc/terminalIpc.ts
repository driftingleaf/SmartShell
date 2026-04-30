import { ipcMain, shell } from 'electron'
import type {
  CreateTerminalRequest,
  TerminalRenameRequest,
  TerminalResizeRequest,
  TerminalWriteRequest,
  WorkspaceState
} from '@shared/types'
import { ProfileManager } from '../profiles/ProfileManager'
import { PtyManager } from '../pty/PtyManager'
import { WorkspaceManager } from '../workspace/WorkspaceManager'

export function registerIpcHandlers(
  ptyManager: PtyManager,
  profileManager: ProfileManager,
  workspaceManager: WorkspaceManager
): void {
  ipcMain.handle('terminal:create', (_event, request: CreateTerminalRequest) => {
    return ptyManager.create(request)
  })

  ipcMain.handle('terminal:list', () => {
    return ptyManager.list()
  })

  ipcMain.handle('terminal:write', (_event, request: TerminalWriteRequest) => {
    ptyManager.write(request.id, request.data)
  })

  ipcMain.handle('terminal:resize', (_event, request: TerminalResizeRequest) => {
    ptyManager.resize(request.id, request.cols, request.rows)
  })

  ipcMain.handle('terminal:kill', (_event, id: string) => {
    ptyManager.kill(id)
  })

  ipcMain.handle('terminal:restart', (_event, id: string) => {
    return ptyManager.restart(id)
  })

  ipcMain.handle('terminal:rename', (_event, request: TerminalRenameRequest) => {
    return ptyManager.rename(request.id, request.title)
  })

  ipcMain.handle('terminal:list-logs', () => {
    return ptyManager.listLogs()
  })

  ipcMain.handle('terminal:open-log', async (_event, id: string) => {
    const logPath = ptyManager.getLogPath(id)
    if (!logPath) return

    const error = await shell.openPath(logPath)
    if (error) {
      throw new Error(error)
    }
  })

  ipcMain.handle('terminal:open-log-file', async (_event, logPath: string) => {
    if (!ptyManager.isLogPath(logPath)) {
      throw new Error('Log path is outside the SmartShell log directory')
    }

    const error = await shell.openPath(logPath)
    if (error) {
      throw new Error(error)
    }
  })

  ipcMain.handle('profiles:list', () => {
    return profileManager.list()
  })

  ipcMain.handle('profiles:save', (_event, profiles) => {
    return profileManager.save(profiles)
  })

  ipcMain.handle('workspace:get-default-cwd', () => {
    return workspaceManager.getDefaultCwd()
  })

  ipcMain.handle('workspace:select-folder', () => {
    return workspaceManager.selectFolder()
  })

  ipcMain.handle('workspace:load', () => {
    return workspaceManager.load()
  })

  ipcMain.handle('workspace:save', (_event, workspace: WorkspaceState) => {
    return workspaceManager.save(workspace)
  })

  ipcMain.handle('workspace:list-snapshots', () => {
    return workspaceManager.listSnapshots()
  })

  ipcMain.handle('workspace:save-snapshot', (_event, workspace: WorkspaceState) => {
    return workspaceManager.saveSnapshot(workspace)
  })
}
