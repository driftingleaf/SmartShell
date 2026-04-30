import { type ReactElement, useEffect, useState } from 'react'
import type { TerminalLogEntry } from '@shared/types'
import { useI18n } from '@renderer/store/settingsStore'

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
  const { t } = useI18n()
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
            <h2>{t('sessionHistory')}</h2>
            <p>{t('sessionHistoryDescription')}</p>
          </div>
          <button type="button" onClick={onClose}>
            {t('close')}
          </button>
        </header>
        <div className="history-list">
          {logs.length === 0 ? (
            <div className="history-empty">{t('noLogs')}</div>
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
