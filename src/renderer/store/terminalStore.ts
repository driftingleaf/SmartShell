import { create } from 'zustand'
import type { CreateTerminalRequest, TerminalProfile, TerminalSerializedData, TerminalSession, WorkspaceSnapshot, WorkspaceState } from '@shared/types'

export type AgentSignal = {
  label: string
  detail: string
  updatedAt: string
}

const stripAnsi = (value: string): string => value.replace(/\x1b\[[0-9;?]*[ -/]*[@-~]/g, '')

const ACTIVE_SIGNAL_MIN_INTERVAL_MS = 2000
const lastActiveUpdate = new Map<string, number>()

const serializeRegistry = new Map<string, { serialize(): string }>()
const pendingSerializedContent = new Map<string, string>()

export function registerSerializer(id: string, addon: { serialize(): string }): void {
  serializeRegistry.set(id, addon)
}

export function unregisterSerializer(id: string): void {
  serializeRegistry.delete(id)
}

export function consumePendingContent(id: string): string | undefined {
  const content = pendingSerializedContent.get(id)
  if (content) pendingSerializedContent.delete(id)
  return content
}

const remapLayoutIds = (value: unknown, idMap: Record<string, string>): unknown => {
  if (typeof value === 'string') {
    return idMap[value] ?? value
  }

  if (Array.isArray(value)) {
    return value.map((item) => remapLayoutIds(item, idMap))
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, item]) => [idMap[key] ?? key, remapLayoutIds(item, idMap)])
    )
  }

  return value
}

const parseAgentSignal = (data: string): Pick<AgentSignal, 'label' | 'detail'> | undefined => {
  const text = stripAnsi(data)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .pop()

  if (!text) return undefined

  const normalized = text.toLowerCase()
  if (/\b(error|failed|exception|traceback)\b/.test(normalized)) {
    return { label: 'Needs attention', detail: text }
  }
  if (/\b(waiting|approve|permission|confirm|continue\?)\b/.test(normalized)) {
    return { label: 'Waiting for input', detail: text }
  }
  if (/\b(done|completed|success|finished)\b/.test(normalized)) {
    return { label: 'Completed', detail: text }
  }

  return { label: 'Active', detail: text }
}

type TerminalState = {
  sessions: TerminalSession[]
  profiles: TerminalProfile[]
  workspaceCwd: string
  layout?: unknown
  activeSessionId?: string
  workspaceGeneration: number
  agentSignals: Record<string, AgentSignal>
  loadInitialState(): Promise<void>
  createTerminal(profileId?: string): Promise<TerminalSession>
  createTerminalFromRequest(request: CreateTerminalRequest): Promise<TerminalSession>
  selectWorkspaceFolder(): Promise<void>
  saveProfiles(profiles: TerminalProfile[]): Promise<void>
  renameTerminal(id: string, title: string): Promise<void>
  closeTerminal(id: string): Promise<void>
  restartTerminal(id: string): Promise<void>
  duplicateTerminal(id: string): Promise<void>
  markExited(id: string): void
  updateTerminalCwd(id: string, cwd: string): void
  captureTerminalOutput(id: string, data: string): void
  setActiveSession(id: string): void
  setLayout(layout: unknown): void
  saveWorkspace(layout?: unknown): Promise<void>
  saveWorkspaceSnapshot(layout?: unknown): Promise<WorkspaceSnapshot>
  restoreWorkspaceSnapshot(snapshot: WorkspaceSnapshot): Promise<void>
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: [],
  profiles: [],
  workspaceCwd: '',
  workspaceGeneration: 0,
  agentSignals: {},

  async loadInitialState() {
    const [profiles, workspace, sessions, defaultCwd] = await Promise.all([
      window.smartShell.profiles.list(),
      window.smartShell.workspace.load(),
      window.smartShell.terminal.list(),
      window.smartShell.workspace.getDefaultCwd()
    ])
    const workspaceCwd = workspace.cwd || defaultCwd

    set({
      profiles,
      workspaceCwd,
      layout: sessions.length > 0 ? workspace.layout : undefined,
      sessions,
      activeSessionId: sessions[0]?.id
    })
  },

  async createTerminal(profileId?: string) {
    return get().createTerminalFromRequest({ profileId })
  },

  async createTerminalFromRequest(request: CreateTerminalRequest) {
    const session = await window.smartShell.terminal.create({
      cwd: get().workspaceCwd || undefined,
      ...request
    })
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id
    }))
    return session
  },

  async selectWorkspaceFolder() {
    const cwd = await window.smartShell.workspace.selectFolder()
    if (cwd) {
      set({ workspaceCwd: cwd })
    }
  },

  async saveProfiles(profiles: TerminalProfile[]) {
    const savedProfiles = await window.smartShell.profiles.save(profiles)
    set({ profiles: savedProfiles })
  },

  async renameTerminal(id: string, title: string) {
    const updated = await window.smartShell.terminal.rename({ id, title })
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === id ? updated : session))
    }))
  },

  async closeTerminal(id: string) {
    await window.smartShell.terminal.kill(id)
    set((state) => {
      const sessions = state.sessions.filter((session) => session.id !== id)
      const { [id]: _removedSignal, ...agentSignals } = state.agentSignals
      return {
        sessions,
        agentSignals,
        activeSessionId: state.activeSessionId === id ? sessions[0]?.id : state.activeSessionId
      }
    })
  },

  async restartTerminal(id: string) {
    const restarted = await window.smartShell.terminal.restart(id)
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === id ? restarted : session)),
      activeSessionId: id
    }))
  },

  async duplicateTerminal(id: string) {
    const source = get().sessions.find((session) => session.id === id)
    if (!source) return

    await get().createTerminalFromRequest({
      profileId: source.profileId,
      shell: source.shell,
      args: source.args,
      cwd: source.cwd,
      title: `${source.title} Copy`
    })
  },

  markExited(id: string) {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === id ? { ...session, status: 'exited' } : session
      )
    }))
  },

  updateTerminalCwd(id: string, cwd: string) {
    set((state) => ({
      sessions: state.sessions.map((session) => (session.id === id ? { ...session, cwd } : session))
    }))
  },

  captureTerminalOutput(id: string, data: string) {
    const signal = parseAgentSignal(data)
    if (!signal) return

    if (signal.label === 'Active') {
      const now = Date.now()
      const last = lastActiveUpdate.get(id) ?? 0
      if (now - last < ACTIVE_SIGNAL_MIN_INTERVAL_MS) return
      lastActiveUpdate.set(id, now)
    }

    set((state) => {
      const prev = state.agentSignals[id]
      if (prev && prev.label === signal.label && prev.detail === signal.detail) {
        return state
      }
      return {
        agentSignals: {
          ...state.agentSignals,
          [id]: {
            ...signal,
            updatedAt: new Date().toISOString()
          }
        }
      }
    })
  },

  setActiveSession(id: string) {
    set({ activeSessionId: id })
  },

  setLayout(layout: unknown) {
    set({ layout })
  },

  async saveWorkspace(layout?: unknown) {
    const state = get()
    const serializedData: TerminalSerializedData[] = []
    for (const session of state.sessions) {
      const addon = serializeRegistry.get(session.id)
      if (addon) {
        try {
          const content = addon.serialize()
          if (content) serializedData.push({ id: session.id, content })
        } catch { /* skip failed serialization */ }
      }
    }
    const workspace: WorkspaceState = {
      cwd: state.workspaceCwd,
      layout: layout ?? state.layout,
      terminals: state.sessions,
      serializedData
    }
    await window.smartShell.workspace.save(workspace)
    set({ layout: workspace.layout })
  },

  async saveWorkspaceSnapshot(layout?: unknown) {
    const state = get()
    const serializedData: TerminalSerializedData[] = []
    for (const session of state.sessions) {
      const addon = serializeRegistry.get(session.id)
      if (addon) {
        try {
          const content = addon.serialize()
          if (content) serializedData.push({ id: session.id, content })
        } catch { /* skip failed serialization */ }
      }
    }
    const workspace: WorkspaceState = {
      cwd: state.workspaceCwd,
      layout: layout ?? state.layout,
      terminals: state.sessions,
      serializedData
    }
    const snapshot = await window.smartShell.workspace.saveSnapshot(workspace)
    set({ layout: workspace.layout })
    return snapshot
  },

  async restoreWorkspaceSnapshot(snapshot: WorkspaceSnapshot) {
    const currentSessions = get().sessions
    for (const session of currentSessions) {
      await window.smartShell.terminal.kill(session.id)
    }

    const workspaceCwd = snapshot.state.cwd || get().workspaceCwd

    set((state) => ({
      sessions: [],
      activeSessionId: undefined,
      agentSignals: {},
      workspaceCwd,
      layout: undefined,
      workspaceGeneration: state.workspaceGeneration + 1
    }))

    await new Promise((resolve) => window.setTimeout(resolve, 0))

    const restoredSessions: TerminalSession[] = []
    const idMap: Record<string, string> = {}

    for (const savedSession of snapshot.state.terminals) {
      const restoredSession = await window.smartShell.terminal.create({
        profileId: savedSession.profileId,
        shell: savedSession.shell,
        args: savedSession.args,
        cwd: savedSession.cwd || workspaceCwd,
        title: savedSession.title
      })
      restoredSessions.push(restoredSession)
      idMap[savedSession.id] = restoredSession.id

      const serializedEntry = snapshot.state.serializedData?.find(
        (entry) => entry.id === savedSession.id
      )
      if (serializedEntry) {
        pendingSerializedContent.set(restoredSession.id, serializedEntry.content)
      }
    }

    set({
      layout: remapLayoutIds(snapshot.state.layout, idMap),
      sessions: restoredSessions,
      activeSessionId: restoredSessions[0]?.id
    })
  }
}))
