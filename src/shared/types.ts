export type TerminalStatus = 'starting' | 'running' | 'exited'

export type TerminalSession = {
  id: string
  title: string
  shell: string
  args: string[]
  cwd: string
  profileId?: string
  status: TerminalStatus
  customTitle: boolean
  logPath?: string
}

export type TerminalProfile = {
  id: string
  name: string
  shell: string
  args: string[]
  defaultTitle: string
  builtIn?: boolean
}

export type CreateTerminalRequest = {
  id?: string
  profileId?: string
  shell?: string
  args?: string[]
  cwd?: string
  title?: string
  cols?: number
  rows?: number
}

export type TerminalWriteRequest = {
  id: string
  data: string
}

export type TerminalResizeRequest = {
  id: string
  cols: number
  rows: number
}

export type TerminalRenameRequest = {
  id: string
  title: string
}

export type TerminalDataEvent = {
  id: string
  data: string
}

export type TerminalExitEvent = {
  id: string
  exitCode?: number
  signal?: number
}

export type TerminalCwdEvent = {
  id: string
  cwd: string
}

export type TerminalLogEntry = {
  name: string
  path: string
  size: number
  modifiedAt: string
}

export type WorkspaceState = {
  cwd?: string
  layout?: unknown
  terminals: TerminalSession[]
}

export type WorkspaceSnapshot = {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  state: WorkspaceState
}

export type SmartShellApi = {
  terminal: {
    create(request: CreateTerminalRequest): Promise<TerminalSession>
    list(): Promise<TerminalSession[]>
    write(request: TerminalWriteRequest): Promise<void>
    resize(request: TerminalResizeRequest): Promise<void>
    kill(id: string): Promise<void>
    restart(id: string): Promise<TerminalSession>
    rename(request: TerminalRenameRequest): Promise<TerminalSession>
    listLogs(): Promise<TerminalLogEntry[]>
    openLog(id: string): Promise<void>
    openLogFile(path: string): Promise<void>
    onData(callback: (event: TerminalDataEvent) => void): () => void
    onCwdChange(callback: (event: TerminalCwdEvent) => void): () => void
    onExit(callback: (event: TerminalExitEvent) => void): () => void
  }
  profiles: {
    list(): Promise<TerminalProfile[]>
    save(profiles: TerminalProfile[]): Promise<TerminalProfile[]>
  }
  workspace: {
    getDefaultCwd(): Promise<string>
    selectFolder(): Promise<string | undefined>
    load(): Promise<WorkspaceState>
    save(workspace: WorkspaceState): Promise<void>
    listSnapshots(): Promise<WorkspaceSnapshot[]>
    saveSnapshot(workspace: WorkspaceState): Promise<WorkspaceSnapshot>
  }
  window: {
    minimize(): Promise<void>
    toggleMaximize(): Promise<boolean>
    close(): Promise<void>
    isMaximized(): Promise<boolean>
  }
}
