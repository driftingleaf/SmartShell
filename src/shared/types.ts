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
}

export type TerminalProfile = {
  id: string
  name: string
  shell: string
  args: string[]
  defaultTitle: string
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

export type WorkspaceState = {
  layout?: unknown
  terminals: TerminalSession[]
}

export type SmartShellApi = {
  terminal: {
    create(request: CreateTerminalRequest): Promise<TerminalSession>
    list(): Promise<TerminalSession[]>
    write(request: TerminalWriteRequest): Promise<void>
    resize(request: TerminalResizeRequest): Promise<void>
    kill(id: string): Promise<void>
    rename(request: TerminalRenameRequest): Promise<TerminalSession>
    onData(callback: (event: TerminalDataEvent) => void): () => void
    onExit(callback: (event: TerminalExitEvent) => void): () => void
  }
  profiles: {
    list(): Promise<TerminalProfile[]>
  }
  workspace: {
    load(): Promise<WorkspaceState>
    save(workspace: WorkspaceState): Promise<void>
  }
}
