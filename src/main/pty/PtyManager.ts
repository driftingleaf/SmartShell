import { mkdirSync, promises as fs } from 'node:fs'
import path from 'node:path'
import { app, BrowserWindow } from 'electron'
import type { CreateTerminalRequest, TerminalLogEntry, TerminalSession } from '@shared/types'
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
    const id = request.id || this.createSessionId()
    const title = request.title || profile?.defaultTitle || shell

    if (this.sessions.has(id)) {
      throw new Error(`Terminal session already exists: ${id}`)
    }

    this.syncSequence(id)
    const logPath = this.createLogPath(id)

    const session = new PtySession({
      id,
      title,
      shell,
      args,
      cwd: request.cwd,
      profileId: profile?.id,
      cols: request.cols,
      rows: request.rows,
      logPath
    })

    session.on('data', (data: string) => {
      this.getWindow()?.webContents.send('terminal:data', { id, data })
    })

    session.on('exit', (event: { exitCode?: number; signal?: number }) => {
      if (this.sessions.get(id) === session) {
        this.getWindow()?.webContents.send('terminal:exit', { id, ...event })
      }
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

  getLogPath(id: string): string | undefined {
    return this.requireSession(id).getMeta().logPath
  }

  async listLogs(): Promise<TerminalLogEntry[]> {
    const logsDir = this.getLogsDir()
    mkdirSync(logsDir, { recursive: true })
    const entries = await fs.readdir(logsDir, { withFileTypes: true })
    const logs = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith('.log'))
        .map(async (entry) => {
          const filePath = path.join(logsDir, entry.name)
          const stat = await fs.stat(filePath)
          return {
            name: entry.name,
            path: filePath,
            size: stat.size,
            modifiedAt: stat.mtime.toISOString()
          }
        })
    )

    return logs.sort((first, second) => second.modifiedAt.localeCompare(first.modifiedAt))
  }

  isLogPath(filePath: string): boolean {
    const logsDir = path.resolve(this.getLogsDir())
    const resolvedPath = path.resolve(filePath)
    return resolvedPath === logsDir || resolvedPath.startsWith(`${logsDir}${path.sep}`)
  }

  restart(id: string): TerminalSession {
    const metadata = this.requireSession(id).getMeta()
    this.kill(id)
    return this.create({
      id: metadata.id,
      profileId: metadata.profileId,
      shell: metadata.shell,
      args: metadata.args,
      cwd: metadata.cwd,
      title: metadata.title
    })
  }

  kill(id: string): void {
    const session = this.sessions.get(id)
    if (!session) return
    session.kill()
    this.sessions.delete(id)
  }

  private createSessionId(): string {
    let id = `terminal-${++this.sequence}`
    while (this.sessions.has(id)) {
      id = `terminal-${++this.sequence}`
    }
    return id
  }

  private syncSequence(id: string): void {
    const match = /^terminal-(\d+)$/.exec(id)
    if (!match) return

    this.sequence = Math.max(this.sequence, Number(match[1]))
  }

  private getLogsDir(): string {
    return path.join(app.getPath('userData'), 'logs')
  }

  private createLogPath(id: string): string {
    const logsDir = this.getLogsDir()
    mkdirSync(logsDir, { recursive: true })
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const safeId = id.replace(/[^a-zA-Z0-9._-]/g, '_')
    return path.join(logsDir, `${timestamp}-${safeId}.log`)
  }

  private requireSession(id: string): PtySession {
    const session = this.sessions.get(id)
    if (!session) {
      throw new Error(`Terminal session not found: ${id}`)
    }
    return session
  }
}
