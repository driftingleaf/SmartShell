import { contextBridge, ipcRenderer } from 'electron'
import type {
  CreateTerminalRequest,
  SmartShellApi,
  TerminalDataEvent,
  TerminalExitEvent,
  TerminalRenameRequest,
  TerminalResizeRequest,
  TerminalWriteRequest,
  WorkspaceState
} from '@shared/types'

const api: SmartShellApi = {
  terminal: {
    create: (request: CreateTerminalRequest) => ipcRenderer.invoke('terminal:create', request),
    list: () => ipcRenderer.invoke('terminal:list'),
    write: (request: TerminalWriteRequest) => ipcRenderer.invoke('terminal:write', request),
    resize: (request: TerminalResizeRequest) => ipcRenderer.invoke('terminal:resize', request),
    kill: (id: string) => ipcRenderer.invoke('terminal:kill', id),
    restart: (id: string) => ipcRenderer.invoke('terminal:restart', id),
    rename: (request: TerminalRenameRequest) => ipcRenderer.invoke('terminal:rename', request),
    listLogs: () => ipcRenderer.invoke('terminal:list-logs'),
    openLog: (id: string) => ipcRenderer.invoke('terminal:open-log', id),
    openLogFile: (path: string) => ipcRenderer.invoke('terminal:open-log-file', path),
    onData: (callback: (event: TerminalDataEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: TerminalDataEvent): void => callback(payload)
      ipcRenderer.on('terminal:data', listener)
      return () => ipcRenderer.off('terminal:data', listener)
    },
    onExit: (callback: (event: TerminalExitEvent) => void) => {
      const listener = (_event: Electron.IpcRendererEvent, payload: TerminalExitEvent): void => callback(payload)
      ipcRenderer.on('terminal:exit', listener)
      return () => ipcRenderer.off('terminal:exit', listener)
    }
  },
  profiles: {
    list: () => ipcRenderer.invoke('profiles:list'),
    save: (profiles) => ipcRenderer.invoke('profiles:save', profiles)
  },
  workspace: {
    getDefaultCwd: () => ipcRenderer.invoke('workspace:get-default-cwd'),
    selectFolder: () => ipcRenderer.invoke('workspace:select-folder'),
    load: () => ipcRenderer.invoke('workspace:load'),
    save: (workspace: WorkspaceState) => ipcRenderer.invoke('workspace:save', workspace)
  }
}

contextBridge.exposeInMainWorld('smartShell', api)
