import { type FormEvent, type ReactElement, useState } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'

type TerminalHeaderProps = {
  sessionId: string
}

const EditIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="m3 11.9-.5 1.6 1.6-.5 7.3-7.3-1.1-1.1L3 11.9Z" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
    <path d="m9.7 4 1-1a1.2 1.2 0 0 1 1.7 0l.6.6a1.2 1.2 0 0 1 0 1.7l-1 1" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.4" />
  </svg>
)

export function TerminalHeader({ sessionId }: TerminalHeaderProps): ReactElement {
  const session = useTerminalStore((state) => state.sessions.find((item) => item.id === sessionId))
  const renameTerminal = useTerminalStore((state) => state.renameTerminal)
  const closeTerminal = useTerminalStore((state) => state.closeTerminal)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(session?.title ?? 'Terminal')

  if (!session) return <span>Terminal</span>

  const cwdLabel = session.cwd.split(/[\\/]/).filter(Boolean).slice(-2).join('/') || session.cwd

  const startEditing = (): void => {
    setDraft(session.title)
    setIsEditing(true)
  }

  const submit = async (event?: FormEvent): Promise<void> => {
    event?.preventDefault()
    await renameTerminal(session.id, draft)
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <form className="terminal-title-form" onSubmit={submit}>
        <input
          autoFocus
          className="terminal-title-input"
          value={draft}
          onBlur={() => void submit()}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              setDraft(session.title)
              setIsEditing(false)
            }
          }}
        />
      </form>
    )
  }

  return (
    <div className="terminal-title-bar">
      <button
        className="terminal-title-button"
        type="button"
        title="Double click to rename"
        onDoubleClick={startEditing}
      >
        <span className={`status-dot status-${session.status}`} />
        <span className="terminal-title-text">{session.title}</span>
        <span className="terminal-cwd" title={session.cwd}>{cwdLabel}</span>
      </button>
      <button
        className="terminal-title-action"
        type="button"
        aria-label="Rename terminal"
        title="Rename terminal"
        onClick={startEditing}
      >
        <EditIcon />
      </button>
      <button
        className="terminal-close-button"
        type="button"
        title="Close terminal"
        onClick={() => void closeTerminal(session.id)}
      >
        ×
      </button>
    </div>
  )
}
