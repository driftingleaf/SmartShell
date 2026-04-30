import { type FormEvent, type ReactElement, useState } from 'react'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

export function AgentPanel(): ReactElement {
  const { t } = useI18n()
  const sessions = useTerminalStore((state) => state.sessions)
  const profiles = useTerminalStore((state) => state.profiles)
  const activeSessionId = useTerminalStore((state) => state.activeSessionId)
  const agentSignals = useTerminalStore((state) => state.agentSignals)
  const setActiveSession = useTerminalStore((state) => state.setActiveSession)
  const restartTerminal = useTerminalStore((state) => state.restartTerminal)
  const duplicateTerminal = useTerminalStore((state) => state.duplicateTerminal)
  const closeTerminal = useTerminalStore((state) => state.closeTerminal)
  const [broadcastText, setBroadcastText] = useState('')

  const runningSessions = sessions.filter((session) => session.status !== 'exited')

  const sendBroadcast = (event: FormEvent): void => {
    event.preventDefault()
    const command = broadcastText.trim()
    if (!command) return

    for (const session of runningSessions) {
      void window.smartShell.terminal.write({ id: session.id, data: `${command}\r` })
    }
    setBroadcastText('')
  }

  const getProfileName = (profileId?: string): string => {
    return profiles.find((profile) => profile.id === profileId)?.name ?? t('customTerminal')
  }

  const getCwdLabel = (cwd: string): string => {
    return cwd.split(/[\\/]/).filter(Boolean).slice(-2).join('/') || cwd
  }

  return (
    <aside className="agent-panel" aria-label="Agent sessions">
      <div className="agent-panel-header">
        <div>
          <strong>{t('agents')}</strong>
          <span>{t('runningSessions', { count: runningSessions.length })}</span>
        </div>
      </div>
      <form className="agent-broadcast" onSubmit={sendBroadcast}>
        <input
          value={broadcastText}
          placeholder={t('broadcastCommand')}
          onChange={(event) => setBroadcastText(event.target.value)}
        />
        <button type="submit" disabled={runningSessions.length === 0}>
          {t('send')}
        </button>
      </form>
      <div className="agent-list">
        {sessions.length === 0 ? (
          <div className="agent-empty">{t('noSessions')}</div>
        ) : (
          sessions.map((session) => {
            const signal = agentSignals[session.id]

            return (
              <article
                key={session.id}
                className={`agent-card${session.id === activeSessionId ? ' agent-card-active' : ''}`}
              >
                <button
                  className="agent-card-main"
                  type="button"
                  title={session.cwd}
                  onClick={() => setActiveSession(session.id)}
                >
                  <span className={`status-dot status-${session.status}`} />
                  <span className="agent-card-content">
                    <strong>{session.title}</strong>
                    <span>{getProfileName(session.profileId)}</span>
                    <small>{getCwdLabel(session.cwd)}</small>
                    {signal && <em title={signal.detail}>{signal.label}: {signal.detail}</em>}
                  </span>
                </button>
                <div className="agent-card-actions">
                  <button type="button" onClick={() => void restartTerminal(session.id)}>
                    {t('restart')}
                  </button>
                  <button type="button" onClick={() => void duplicateTerminal(session.id)}>
                    {t('duplicate')}
                  </button>
                  <button type="button" onClick={() => void window.smartShell.terminal.openLog(session.id)}>
                    {t('log')}
                  </button>
                  <button type="button" onClick={() => void closeTerminal(session.id)}>
                    {t('close')}
                  </button>
                </div>
              </article>
            )
          })
        )}
      </div>
    </aside>
  )
}
