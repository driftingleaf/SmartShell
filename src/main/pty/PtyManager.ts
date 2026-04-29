import { BrowserWindow } from 'electron'
import type { CreateTerminalRequest, TerminalSession } from '@shared/types'
import { ProfileManager } from '../profiles/ProfileManager'
import { PtySession } from './PtySession'

export class PtyManager {
  private readonly sessions = new Map<string, PtySession>()
  private sequence = 0

  constructor(
    private readonly profileManager: ProfileManager,
    private readonly getWindow: () => BrowserWindow | null
  ) {}

  create(request: CreateTerminalRequest = {}): TerminalSession {
    const profile = request.profileId ? this.profileManager.get(request.profileId) : undefined
    const shell = request.shell || profile?.shell || 'powershell.exe'
    const args = request.args || profile?.args || ['-NoExit']
    const id = request.id || `terminal-${++this.sequence}`
    const title = request.title || profile?.defaultTitle || shell

    if (this.sessions.has(id)) {
      throw new Error(`Terminal session already exists: ${id}`)
    }

    const session = new PtySession({
      id,
      title,
      shell,
      args,
      cwd: request.cwd,
      profileId: profile?.id,
      cols: request.cols,
      rows: request.rows
    })

    session.on('data', (data: string) => {
      this.getWindow()?.webContents.send('terminal:data', { id, data })
    })

    session.on('exit', (event: { exitCode?: number; signal?: number }) => {
      this.getWindow()?.webContents.send('terminal:exit', { id, ...event })
    })

    this.sessions.set(id, session)
    return session.getMeta()
  }

  list(): TerminalSession[] {
    return Array.from(this.sessions.values()).map((session) => session.getMeta())
  }

  write(id: string, data: string): void {
    this.sessions.get(id)?.write(data)
  }

  resize(id: string, cols: number, rows: number): void {
    this.sessions.get(id)?.resize(cols, rows)
  }

  rename(id: string, title: string): TerminalSession {
    return this.requireSession(id).rename(title.trim() || 'Terminal')
  }

  kill(id: string): void {
    const session = this.sessions.get(id)
    if (!session) return
    session.kill()
    this.sessions.delete(id)
  }

  private requireSession(id: string): PtySession {
    const session = this.sessions.get(id)
    if (!session) {
      throw new Error(`Terminal session not found: ${id}`)
    }
    return session
  }
}
