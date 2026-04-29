import { type ReactElement, useMemo, useState } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'

type CommandPaletteProps = {
  isOpen: boolean
  onClose(): void
  onEditProfiles(): void
  onOpenTasks(): void
  onSaveWorkspace(): void
}

type Command = {
  label: string
  description: string
  run(): void
}

export function CommandPalette({
  isOpen,
  onClose,
  onEditProfiles,
  onOpenTasks,
  onSaveWorkspace
}: CommandPaletteProps): ReactElement | null {
  const createTerminal = useTerminalStore((state) => state.createTerminal)
  const closeTerminal = useTerminalStore((state) => state.closeTerminal)
  const restartTerminal = useTerminalStore((state) => state.restartTerminal)
  const duplicateTerminal = useTerminalStore((state) => state.duplicateTerminal)
  const selectWorkspaceFolder = useTerminalStore((state) => state.selectWorkspaceFolder)
  const activeSessionId = useTerminalStore((state) => state.activeSessionId)
  const profiles = useTerminalStore((state) => state.profiles)
  const [query, setQuery] = useState('')

  const commands = useMemo<Command[]>(() => {
    const terminalCommands = profiles.map((profile) => ({
      label: `New ${profile.name}`,
      description: `Start ${profile.defaultTitle}`,
      run: () => void createTerminal(profile.id)
    }))

    return [
      ...terminalCommands,
      {
        label: 'Open Folder',
        description: 'Choose the workspace folder used by new terminals',
        run: () => void selectWorkspaceFolder()
      },
      {
        label: 'Edit Profiles',
        description: 'Configure terminal launch commands',
        run: onEditProfiles
      },
      {
        label: 'Open Task Board',
        description: 'Track work across parallel agent sessions',
        run: onOpenTasks
      },
      {
        label: 'Save Workspace',
        description: 'Save layout and sessions now',
        run: onSaveWorkspace
      },
      {
        label: 'Restart Active Terminal',
        description: 'Restart the current terminal session',
        run: () => activeSessionId && void restartTerminal(activeSessionId)
      },
      {
        label: 'Duplicate Active Terminal',
        description: 'Create a copy of the current terminal profile and cwd',
        run: () => activeSessionId && void duplicateTerminal(activeSessionId)
      },
      {
        label: 'Close Active Terminal',
        description: 'Close the current terminal session',
        run: () => activeSessionId && void closeTerminal(activeSessionId)
      }
    ]
  }, [activeSessionId, closeTerminal, createTerminal, duplicateTerminal, onEditProfiles, onOpenTasks, onSaveWorkspace, profiles, restartTerminal, selectWorkspaceFolder])

  if (!isOpen) return null

  const filteredCommands = commands.filter((command) =>
    `${command.label} ${command.description}`.toLowerCase().includes(query.toLowerCase())
  )

  const runCommand = (command: Command): void => {
    command.run()
    setQuery('')
    onClose()
  }

  return (
    <div className="modal-backdrop command-palette-backdrop" role="presentation">
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          autoFocus
          value={query}
          placeholder="Type a command..."
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              onClose()
            }
            if (event.key === 'Enter' && filteredCommands[0]) {
              runCommand(filteredCommands[0])
            }
          }}
        />
        <div className="command-list">
          {filteredCommands.map((command) => (
            <button key={command.label} type="button" onClick={() => runCommand(command)}>
              <strong>{command.label}</strong>
              <span>{command.description}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
