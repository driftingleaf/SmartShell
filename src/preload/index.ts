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
    rename: (request: TerminalRenameRequest) => ipcRenderer.invoke('terminal:rename', request),
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
    list: () => ipcRenderer.invoke('profiles:list')
  },
  workspace: {
    load: () => ipcRenderer.invoke('workspace:load'),
    save: (workspace: WorkspaceState) => ipcRenderer.invoke('workspace:save', workspace)
  }
}

contextBridge.exposeInMainWorld('smartShell', api)
