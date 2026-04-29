import type { TerminalProfile } from '@shared/types'

export class ProfileManager {
  private readonly profiles: TerminalProfile[] = [
    {
      id: 'powershell',
      name: 'PowerShell',
      shell: 'powershell.exe',
      args: ['-NoExit'],
      defaultTitle: 'PowerShell'
    },
    {
      id: 'cmd',
      name: 'Command Prompt',
      shell: 'cmd.exe',
      args: [],
      defaultTitle: 'cmd'
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

  list(): TerminalProfile[] {
    return this.profiles
  }

  get(id: string): TerminalProfile | undefined {
    return this.profiles.find((profile) => profile.id === id)
  }
}
