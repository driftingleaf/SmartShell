import { type ReactElement, useEffect, useState } from 'react'
import type { TerminalLogEntry, WorkspaceSnapshot } from '@shared/types'
import { useOverlayStore } from '@renderer/store/overlayStore'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

type SessionHistoryProps = {
  onClose(): void
}

const formatSize = (size: number): string => {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / 1024 / 1024).toFixed(1)} MB`
}

export function SessionHistory({ onClose }: SessionHistoryProps): ReactElement | null {
  const { t } = useI18n()
  const isOpen = useOverlayStore((state) => state.isOpen('sessionHistory'))
  const zIndex = useOverlayStore((state) => state.zIndex('sessionHistory'))
  const bringToTop = useOverlayStore((state) => state.bringToTop)
  const restoreWorkspaceSnapshot = useTerminalStore((state) => state.restoreWorkspaceSnapshot)
  const [logs, setLogs] = useState<TerminalLogEntry[]>([])
  const [snapshots, setSnapshots] = useState<WorkspaceSnapshot[]>([])
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (!isOpen) return
    setConfirming(false)

    void Promise.all([
      window.smartShell.workspace.listSnapshots(),
      window.smartShell.terminal.listLogs()
    ]).then(([workspaceSnapshots, terminalLogs]) => {
      setSnapshots(workspaceSnapshots)
      setLogs(terminalLogs)
    })
  }, [isOpen])

  const restoreSnapshot = async (snapshot: WorkspaceSnapshot): Promise<void> => {
    onClose()
    await new Promise((resolve) => window.setTimeout(resolve, 0))
    await restoreWorkspaceSnapshot(snapshot)
  }

  if (!isOpen) return null

  const requestClose = (): void => {
    setConfirming(true)
  }

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      bringToTop('sessionHistory')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" style={{ '--z-overlay': zIndex } as React.CSSProperties} onClick={handleBackdropClick}>
      <section className="history-modal" role="dialog" aria-modal="true" aria-label={t('sessionHistory')}>
        <header className="history-header">
          <div>
            <h2>{t('sessionHistory')}</h2>
            <p>{t('sessionHistoryDescription')}</p>
          </div>
          <button type="button" onClick={requestClose}>
            {t('close')}
          </button>
        </header>
        <div className="history-content">
          <section className="history-section">
            <h3>{t('savedWorkspaces')}</h3>
            <div className="history-list">
              {snapshots.length === 0 ? (
                <div className="history-empty">{t('noSavedWorkspaces')}</div>
              ) : (
                snapshots.map((snapshot) => (
                  <button key={snapshot.id} type="button" onClick={() => void restoreSnapshot(snapshot)}>
                    <strong>{snapshot.name}</strong>
                    <span>{new Date(snapshot.updatedAt).toLocaleString()}</span>
                    <small>{t('terminalCount', { count: snapshot.state.terminals.length })} · {t('restoreWorkspace')}</small>
                  </button>
                ))
              )}
            </div>
          </section>
          <section className="history-section">
            <h3>{t('terminalLogs')}</h3>
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
        {confirming && (
          <div className="close-confirm">
            <span>{t('confirmClose')}</span>
            <div className="close-confirm-actions">
              <button type="button" onClick={() => setConfirming(false)}>{t('cancel')}</button>
              <button type="button" onClick={onClose}>{t('close')}</button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
