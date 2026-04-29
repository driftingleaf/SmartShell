import { createWriteStream, type WriteStream } from 'node:fs'
import { EventEmitter } from 'node:events'
import os from 'node:os'
import path from 'node:path'
import { spawn, type IPty } from 'node-pty'
import type { TerminalSession } from '@shared/types'

export type PtySessionOptions = {
  id: string
  title: string
  shell: string
  args: string[]
  cwd?: string
  profileId?: string
  cols?: number
  rows?: number
  logPath?: string
}

export class PtySession extends EventEmitter {
  private readonly pty: IPty
  private readonly logStream?: WriteStream
  private metadata: TerminalSession

  constructor(options: PtySessionOptions) {
    super()

    const cwd = options.cwd || process.cwd() || process.env.USERPROFILE || os.homedir()
    const cols = Math.max(options.cols || 80, 2)
    const rows = Math.max(options.rows || 24, 2)
    const env = Object.fromEntries(
      Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string')
    )

    this.metadata = {
      id: options.id,
      title: options.title,
      shell: options.shell,
      args: options.args,
      cwd,
      profileId: options.profileId,
      status: 'starting',
      customTitle: Boolean(options.title),
      logPath: options.logPath
    }

    if (options.logPath) {
      this.logStream = createWriteStream(options.logPath, { flags: 'a' })
      this.logStream.write(`SmartShell session started: ${new Date().toISOString()}\n`)
      this.logStream.write(`cwd: ${cwd}\ncommand: ${options.shell} ${options.args.join(' ')}\n\n`)
    }

    this.pty = spawn(options.shell, options.args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd: path.resolve(cwd),
      env
    })

    this.metadata = { ...this.metadata, status: 'running' }

    this.pty.onData((data) => {
      this.logStream?.write(data)
      this.emit('data', data)
    })

    this.pty.onExit(({ exitCode, signal }) => {
      this.metadata = { ...this.metadata, status: 'exited' }
      this.logStream?.write(`\nSmartShell session exited: ${new Date().toISOString()} code=${exitCode} signal=${signal}\n`)
      this.logStream?.end()
      this.emit('exit', { exitCode, signal })
    })
  }

  getMeta(): TerminalSession {
    return this.metadata
  }

  write(data: string): void {
    this.pty.write(data)
  }

  resize(cols: number, rows: number): void {
    this.pty.resize(Math.max(cols, 2), Math.max(rows, 2))
  }

  rename(title: string): TerminalSession {
    this.metadata = {
      ...this.metadata,
      title,
      customTitle: true
    }
    return this.metadata
  }

  kill(): void {
    this.pty.kill()
  }
}
