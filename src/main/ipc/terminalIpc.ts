import { ipcMain } from 'electron'
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

  ipcMain.handle('terminal:rename', (_event, request: TerminalRenameRequest) => {
    return ptyManager.rename(request.id, request.title)
  })

  ipcMain.handle('profiles:list', () => {
    return profileManager.list()
  })

  ipcMain.handle('workspace:load', () => {
    return workspaceManager.load()
  })

  ipcMain.handle('workspace:save', (_event, workspace: WorkspaceState) => {
    return workspaceManager.save(workspace)
  })
}
