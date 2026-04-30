import { randomUUID } from 'node:crypto'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { TerminalProfile } from '@shared/types'

const builtInProfileIds = new Set(['powershell', 'cmd'])

const defaultProfiles: TerminalProfile[] = [
  {
    id: 'powershell',
    name: 'PowerShell',
    shell: 'powershell.exe',
    args: ['-NoExit'],
    defaultTitle: 'PowerShell',
    builtIn: true
  },
  {
    id: 'cmd',
    name: 'Command Prompt',
    shell: 'cmd.exe',
    args: [],
    defaultTitle: 'cmd',
    builtIn: true
  },
  {
    id: 'claude',
    name: 'Claude Code',
    shell: 'powershell.exe',
    args: ['-NoExit', '-Command', 'claude'],
    defaultTitle: 'Claude Code'
  },
  {
    id: 'codex',
    name: 'Codex',
    shell: 'powershell.exe',
    args: ['-NoExit', '-Command', 'codex'],
    defaultTitle: 'Codex'
  }
]

const normalizeProfiles = (profiles: TerminalProfile[]): TerminalProfile[] => {
  const defaultBuiltIns = defaultProfiles.filter((profile) => profile.builtIn)
  const editableProfiles = profiles
    .filter((profile) => !builtInProfileIds.has(profile.id))
    .map((profile) => ({
      ...profile,
      id: profile.id || randomUUID(),
      args: profile.args ?? [],
      builtIn: false
    }))

  return [...defaultBuiltIns, ...editableProfiles]
}

export class ProfileManager {
  private profiles: TerminalProfile[] = defaultProfiles

  private get filePath(): string {
    return path.join(app.getPath('userData'), 'profiles.json')
  }

  async load(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      const profiles = JSON.parse(raw) as TerminalProfile[]
      this.profiles = profiles.length > 0 ? normalizeProfiles(profiles) : defaultProfiles
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error
      }
      this.profiles = defaultProfiles
    }
  }

  list(): TerminalProfile[] {
    return this.profiles
  }

  async save(profiles: TerminalProfile[]): Promise<TerminalProfile[]> {
    this.profiles = normalizeProfiles(profiles)
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(this.profiles, null, 2), 'utf8')
    return this.profiles
  }

  get(id: string): TerminalProfile | undefined {
    return this.profiles.find((profile) => profile.id === id)
  }
}
