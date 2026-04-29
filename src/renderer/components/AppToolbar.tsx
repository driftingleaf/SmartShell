import type { ReactElement } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'
import { CommandLauncher } from './CommandLauncher'

type AppToolbarProps = {
  onSaveWorkspace(): void
}

export function AppToolbar({ onSaveWorkspace }: AppToolbarProps): ReactElement {
  const sessionCount = useTerminalStore((state) => state.sessions.length)
  const activeSession = useTerminalStore((state) =>
    state.sessions.find((session) => session.id === state.activeSessionId)
  )

  return (
    <header className="app-toolbar">
      <div className="brand">
        <span className="brand-mark">S</span>
        <div>
          <strong>SmartShell</strong>
          <span>AI terminal workspace · Ctrl+Shift+T</span>
        </div>
      </div>
      <CommandLauncher />
      <div className="session-pill" title={activeSession?.cwd ?? ''}>
        <span>{sessionCount} sessions</span>
        {activeSession && <strong>{activeSession.title}</strong>}
      </div>
      <button className="save-button" type="button" onClick={onSaveWorkspace}>
        Save Workspace
      </button>
    </header>
  )
}
