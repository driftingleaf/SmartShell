import { type FormEvent, type ReactElement, useState } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'

type TerminalHeaderProps = {
  sessionId: string
}

export function TerminalHeader({ sessionId }: TerminalHeaderProps): ReactElement {
  const session = useTerminalStore((state) => state.sessions.find((item) => item.id === sessionId))
  const renameTerminal = useTerminalStore((state) => state.renameTerminal)
  const closeTerminal = useTerminalStore((state) => state.closeTerminal)
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(session?.title ?? 'Terminal')

  if (!session) return <span>Terminal</span>

  const cwdLabel = session.cwd.split(/[\\/]/).filter(Boolean).slice(-2).join('/') || session.cwd

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
        onDoubleClick={() => {
          setDraft(session.title)
          setIsEditing(true)
        }}
      >
        <span className={`status-dot status-${session.status}`} />
        <span className="terminal-title-text">{session.title}</span>
        <span className="terminal-cwd" title={session.cwd}>{cwdLabel}</span>
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
