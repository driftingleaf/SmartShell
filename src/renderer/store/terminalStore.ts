import { create } from 'zustand'
import type { CreateTerminalRequest, TerminalProfile, TerminalSession, WorkspaceState } from '@shared/types'

type TerminalState = {
  sessions: TerminalSession[]
  profiles: TerminalProfile[]
  layout?: unknown
  activeSessionId?: string
  loadInitialState(): Promise<void>
  createTerminal(profileId?: string): Promise<TerminalSession>
  createTerminalFromRequest(request: CreateTerminalRequest): Promise<TerminalSession>
  renameTerminal(id: string, title: string): Promise<void>
  closeTerminal(id: string): Promise<void>
  markExited(id: string): void
  setActiveSession(id: string): void
  setLayout(layout: unknown): void
  saveWorkspace(layout?: unknown): Promise<void>
}

export const useTerminalStore = create<TerminalState>((set, get) => ({
  sessions: [],
  profiles: [],

  async loadInitialState() {
    const [profiles, workspace, sessions] = await Promise.all([
      window.smartShell.profiles.list(),
      window.smartShell.workspace.load(),
      window.smartShell.terminal.list()
    ])

    set({
      profiles,
      layout: workspace.layout,
      sessions,
      activeSessionId: sessions[0]?.id
    })

    if (sessions.length === 0 && workspace.terminals.length > 0) {
      const restoredSessions: TerminalSession[] = []
      for (const savedSession of workspace.terminals) {
        restoredSessions.push(
          await window.smartShell.terminal.create({
            id: savedSession.id,
            profileId: savedSession.profileId,
            shell: savedSession.shell,
            args: savedSession.args,
            cwd: savedSession.cwd,
            title: savedSession.title
          })
        )
      }
      set({
        sessions: restoredSessions,
        activeSessionId: restoredSessions[0]?.id
      })
      return
    }

    if (sessions.length === 0) {
      await get().createTerminal('powershell')
    }
  },

  async createTerminal(profileId?: string) {
    return get().createTerminalFromRequest({ profileId })
  },

  async createTerminalFromRequest(request: CreateTerminalRequest) {
    const session = await window.smartShell.terminal.create(request)
    set((state) => ({
      sessions: [...state.sessions, session],
      activeSessionId: session.id
    }))
    return session
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
      return {
        sessions,
        activeSessionId: state.activeSessionId === id ? sessions[0]?.id : state.activeSessionId
      }
    })
  },

  markExited(id: string) {
    set((state) => ({
      sessions: state.sessions.map((session) =>
        session.id === id ? { ...session, status: 'exited' } : session
      )
    }))
  },

  setActiveSession(id: string) {
    set({ activeSessionId: id })
  },

  setLayout(layout: unknown) {
    set({ layout })
  },

  async saveWorkspace(layout?: unknown) {
    const state = get()
    const workspace: WorkspaceState = {
      layout: layout ?? state.layout,
      terminals: state.sessions
    }
    await window.smartShell.workspace.save(workspace)
    set({ layout: workspace.layout })
  }
}))
