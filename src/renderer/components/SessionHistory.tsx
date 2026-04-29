import { type ReactElement, useEffect, useState } from 'react'
import type { TerminalLogEntry } from '@shared/types'

type SessionHistoryProps = {
  isOpen: boolean
  onClose(): void
}

const formatSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function SessionHistory({ isOpen, onClose }: SessionHistoryProps): ReactElement | null {
  const [logs, setLogs] = useState<TerminalLogEntry[]>([])

  useEffect(() => {
    if (!isOpen) return

    void window.smartShell.terminal.listLogs().then(setLogs)
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="history-modal" role="dialog" aria-modal="true" aria-label="Session history">
        <header className="history-header">
          <div>
            <h2>Session History</h2>
            <p>Open persisted terminal logs from previous and current sessions.</p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <div className="history-list">
          {logs.length === 0 ? (
            <div className="history-empty">No logs yet.</div>
          ) : (
            logs.map((log) => (
              <button key={log.path} type="button" onClick={() => void window.smartShell.terminal.openLogFile(log.path)}>
                <strong>{log.name}</strong>
                <span>{new Date(log.modifiedAt).toLocaleString()}</span>
                <small>{formatSize(log.size)}</small>
              </button>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
