import { type ReactElement, useMemo, useState } from 'react'
import { useOverlayStore } from '@renderer/store/overlayStore'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

type CommandPaletteProps = {
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
  onClose,
  onEditProfiles,
  onOpenTasks,
  onSaveWorkspace
}: CommandPaletteProps): ReactElement | null {
  const { t } = useI18n()
  const isOpen = useOverlayStore((state) => state.isOpen('commandPalette'))
  const zIndex = useOverlayStore((state) => state.zIndex('commandPalette'))
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
      label: t('newProfile', { name: profile.name }),
      description: t('startProfile', { title: profile.defaultTitle }),
      run: () => void createTerminal(profile.id)
    }))

    return [
      ...terminalCommands,
      {
        label: t('openFolder'),
        description: t('openFolderDescription'),
        run: () => void selectWorkspaceFolder()
      },
      {
        label: t('editProfiles'),
        description: t('editProfilesDescription'),
        run: onEditProfiles
      },
      {
        label: t('openTaskBoard'),
        description: t('openTaskBoardDescription'),
        run: onOpenTasks
      },
      {
        label: t('saveWorkspace'),
        description: t('saveWorkspaceDescription'),
        run: onSaveWorkspace
      },
      {
        label: t('restartActiveTerminal'),
        description: t('restartActiveTerminalDescription'),
        run: () => activeSessionId && void restartTerminal(activeSessionId)
      },
      {
        label: t('duplicateActiveTerminal'),
        description: t('duplicateActiveTerminalDescription'),
        run: () => activeSessionId && void duplicateTerminal(activeSessionId)
      },
      {
        label: t('closeActiveTerminal'),
        description: t('closeActiveTerminalDescription'),
        run: () => activeSessionId && void closeTerminal(activeSessionId)
      }
    ]
  }, [activeSessionId, closeTerminal, createTerminal, duplicateTerminal, onEditProfiles, onOpenTasks, onSaveWorkspace, profiles, restartTerminal, selectWorkspaceFolder, t])

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
    <div className="modal-backdrop command-palette-backdrop" role="presentation" style={{ '--z-overlay': zIndex } as React.CSSProperties}>
      <section className="command-palette" role="dialog" aria-modal="true" aria-label="Command palette">
        <input
          autoFocus
          value={query}
          placeholder={t('typeCommand')}
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
