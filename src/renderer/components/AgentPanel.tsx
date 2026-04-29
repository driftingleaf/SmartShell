import { type FormEvent, type ReactElement, useState } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'

export function AgentPanel(): ReactElement {
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
    return profiles.find((profile) => profile.id === profileId)?.name ?? 'Custom terminal'
  }

  const getCwdLabel = (cwd: string): string => {
    return cwd.split(/[\\/]/).filter(Boolean).slice(-2).join('/') || cwd
  }

  return (
    <aside className="agent-panel" aria-label="Agent sessions">
      <div className="agent-panel-header">
        <div>
          <strong>Agents</strong>
          <span>{runningSessions.length} running sessions</span>
        </div>
      </div>
      <form className="agent-broadcast" onSubmit={sendBroadcast}>
        <input
          value={broadcastText}
          placeholder="Broadcast command..."
          onChange={(event) => setBroadcastText(event.target.value)}
        />
        <button type="submit" disabled={runningSessions.length === 0}>
          Send
        </button>
      </form>
      <div className="agent-list">
        {sessions.length === 0 ? (
          <div className="agent-empty">No sessions yet.</div>
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
                    Restart
                  </button>
                  <button type="button" onClick={() => void duplicateTerminal(session.id)}>
                    Duplicate
                  </button>
                  <button type="button" onClick={() => void window.smartShell.terminal.openLog(session.id)}>
                    Log
                  </button>
                  <button type="button" onClick={() => void closeTerminal(session.id)}>
                    Close
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
