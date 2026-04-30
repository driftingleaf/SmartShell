import { type ReactElement, useEffect, useRef, useState } from 'react'
import { DockviewReact, type DockviewReadyEvent } from 'dockview'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'
import { TerminalPanel } from './TerminalPanel'
import 'dockview/dist/styles/dockview.css'

const components = {
  terminal: TerminalPanel
}

export function LayoutRoot(): ReactElement {
  const { t } = useI18n()
  const sessions = useTerminalStore((state) => state.sessions)
  const profiles = useTerminalStore((state) => state.profiles)
  const createTerminal = useTerminalStore((state) => state.createTerminal)
  const layout = useTerminalStore((state) => state.layout)
  const activeSessionId = useTerminalStore((state) => state.activeSessionId)
  const workspaceGeneration = useTerminalStore((state) => state.workspaceGeneration)
  const setActiveSession = useTerminalStore((state) => state.setActiveSession)
  const setLayout = useTerminalStore((state) => state.setLayout)
  const closeTerminal = useTerminalStore((state) => state.closeTerminal)
  const apiRef = useRef<unknown>(null)
  const restoredRef = useRef(false)
  const knownPanelsRef = useRef(new Set<string>())
  const dockviewDisposablesRef = useRef<Array<{ dispose(): void }>>([])
  const [ready, setReady] = useState(false)

  useEffect(() => {
    return () => {
      for (const disposable of dockviewDisposablesRef.current) {
        disposable.dispose()
      }
      dockviewDisposablesRef.current = []
    }
  }, [])

  useEffect(() => {
    for (const disposable of dockviewDisposablesRef.current) {
      disposable.dispose()
    }
    dockviewDisposablesRef.current = []
    apiRef.current = null
    restoredRef.current = false
    knownPanelsRef.current.clear()
    setReady(false)
  }, [workspaceGeneration])

  useEffect(() => {
    if (sessions.length === 0) {
      apiRef.current = null
      restoredRef.current = false
      knownPanelsRef.current.clear()
      setReady(false)
      if (layout !== undefined) {
        setLayout(undefined)
      }
      return
    }

    const api = apiRef.current as DockviewReadyEvent['api'] | null
    if (!api) return

    if (!restoredRef.current) {
      restoredRef.current = true
      if (layout) {
        try {
          api.fromJSON(layout as never)
          for (const session of sessions) {
            knownPanelsRef.current.add(session.id)
          }
        } catch {
          knownPanelsRef.current.clear()
        }
      }
    }

    const sessionIds = new Set(sessions.map((session) => session.id))
    for (const panelId of Array.from(knownPanelsRef.current)) {
      if (!sessionIds.has(panelId)) {
        const panel = api.getPanel(panelId)
        knownPanelsRef.current.delete(panelId)
        if (panel) {
          api.removePanel(panel)
        }
      }
    }

    for (const session of sessions) {
      if (knownPanelsRef.current.has(session.id)) {
        const panel = api.getPanel(session.id)
        panel?.api?.setTitle?.(session.title)
        continue
      }

      api.addPanel({
        id: session.id,
        component: 'terminal',
        title: session.title,
        params: { sessionId: session.id }
      })
      knownPanelsRef.current.add(session.id)
    }
  }, [sessions, layout, ready])

  useEffect(() => {
    const api = apiRef.current as DockviewReadyEvent['api'] | null
    if (!api || !activeSessionId) return

    api.getPanel(activeSessionId)?.api.setActive()
  }, [activeSessionId, sessions.length, ready])

  if (sessions.length === 0) {
    return (
      <main className="empty-workspace">
        <div className="empty-card">
          <span className="empty-badge">{t('noTerminals')}</span>
          <h1>{t('startSession')}</h1>
          <p>{t('openTerminalBelow')}</p>
          <div className="empty-actions">
            {profiles.map((profile) => (
              <button key={profile.id} type="button" onClick={() => void createTerminal(profile.id)}>
                {profile.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    )
  }

  return (
    <div key={workspaceGeneration} className="dockview-theme-abyss layout-root">
      <DockviewReact
        key={workspaceGeneration}
        components={components}
        onReady={(event) => {
          apiRef.current = event.api
          setReady(true)

          dockviewDisposablesRef.current = [
            event.api.onDidActivePanelChange((activePanel) => {
              if (activePanel) {
                setActiveSession(activePanel.id)
              }
            }),
            event.api.onDidRemovePanel((panel) => {
              if (knownPanelsRef.current.has(panel.id)) {
                knownPanelsRef.current.delete(panel.id)
                void closeTerminal(panel.id)
              }
            }),
            event.api.onDidLayoutChange(() => {
              setLayout(event.api.toJSON())
            })
          ]
        }}
      />
    </div>
  )
}
