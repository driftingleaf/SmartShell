import type { ReactElement } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'
import { CommandLauncher } from './CommandLauncher'

type AppToolbarProps = {
  onEditProfiles(): void
  onOpenHistory(): void
  onOpenTasks(): void
  onSaveWorkspace(): void
}

export function AppToolbar({ onEditProfiles, onOpenHistory, onOpenTasks, onSaveWorkspace }: AppToolbarProps): ReactElement {
  const sessionCount = useTerminalStore((state) => state.sessions.length)
  const activeSession = useTerminalStore((state) =>
    state.sessions.find((session) => session.id === state.activeSessionId)
  )
  const workspaceCwd = useTerminalStore((state) => state.workspaceCwd)
  const selectWorkspaceFolder = useTerminalStore((state) => state.selectWorkspaceFolder)
  const workspaceName = workspaceCwd.split(/[\\/]/).filter(Boolean).pop() || workspaceCwd || 'No folder'

  return (
    <header className="app-toolbar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <div>
          <strong>SmartShell</strong>
          <span>Ctrl+Shift+T new · Ctrl+Shift+P commands</span>
        </div>
      </div>
      <button className="workspace-button" type="button" title={workspaceCwd} onClick={() => void selectWorkspaceFolder()}>
        <span>Workspace</span>
        <strong>{workspaceName}</strong>
      </button>
      <CommandLauncher />
      <div className="session-pill" title={activeSession?.cwd ?? ''}>
        <span>{sessionCount} sessions</span>
        {activeSession && <strong>{activeSession.title}</strong>}
      </div>
      <button className="save-button" type="button" onClick={onEditProfiles}>
        Profiles
      </button>
      <button className="save-button" type="button" onClick={onOpenHistory}>
        History
      </button>
      <button className="save-button" type="button" onClick={onOpenTasks}>
        Tasks
      </button>
      <button className="save-button" type="button" onClick={onSaveWorkspace}>
        Save Workspace
      </button>
    </header>
  )
}
