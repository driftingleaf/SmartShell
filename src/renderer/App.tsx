import { type ReactElement, useEffect, useState } from 'react'
import { AgentPanel } from './components/AgentPanel'
import { AppTitleBar } from './components/AppTitleBar'
import { AppToolbar } from './components/AppToolbar'
import { CommandPalette } from './components/CommandPalette'
import { LayoutRoot } from './components/LayoutRoot'
import { ProfileEditor } from './components/ProfileEditor'
import { SessionHistory } from './components/SessionHistory'
import { TaskBoard } from './components/TaskBoard'
import { useOverlayStore } from './store/overlayStore'
import { useI18n, useSettingsStore } from './store/settingsStore'
import { useTerminalStore } from './store/terminalStore'

export function App(): ReactElement {
  const loadInitialState = useTerminalStore((state) => state.loadInitialState)
  const saveWorkspace = useTerminalStore((state) => state.saveWorkspace)
  const saveWorkspaceSnapshot = useTerminalStore((state) => state.saveWorkspaceSnapshot)
  const createTerminal = useTerminalStore((state) => state.createTerminal)
  const markExited = useTerminalStore((state) => state.markExited)
  const updateTerminalCwd = useTerminalStore((state) => state.updateTerminalCwd)
  const captureTerminalOutput = useTerminalStore((state) => state.captureTerminalOutput)
  const sessions = useTerminalStore((state) => state.sessions)
  const layout = useTerminalStore((state) => state.layout)
  const { t } = useI18n()
  const theme = useSettingsStore((state) => state.theme)
  const openOverlay = useOverlayStore((state) => state.open)
  const closeOverlay = useOverlayStore((state) => state.close)
  const closeTop = useOverlayStore((state) => state.closeTop)
  const closeAll = useOverlayStore((state) => state.closeAll)
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [exitConfirming, setExitConfirming] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    void loadInitialState()
      .catch((reason: unknown) => {
        const text = reason instanceof Error ? reason.message : String(reason)
        console.error(text)
        setError(text)
      })
      .finally(() => setIsReady(true))

    const removeDataListener = window.smartShell.terminal.onData((event) => {
      captureTerminalOutput(event.id, event.data)
    })

    const removeCwdListener = window.smartShell.terminal.onCwdChange((event) => {
      updateTerminalCwd(event.id, event.cwd)
    })

    const removeExitListener = window.smartShell.terminal.onExit((event) => {
      markExited(event.id)
    })

    return () => {
      removeDataListener()
      removeCwdListener()
      removeExitListener()
    }
  }, [captureTerminalOutput, loadInitialState, markExited, updateTerminalCwd])

  useEffect(() => {
    if (!isReady || error) return
    if (sessions.length === 0 && layout === undefined) return

    const timeoutId = window.setTimeout(() => {
      void saveWorkspace()
    }, 700)

    return () => window.clearTimeout(timeoutId)
  }, [isReady, error, sessions, layout, saveWorkspace])

  useEffect(() => {
    const removeCloseListener = window.smartShell.window.onCloseRequested(() => {
      setExitConfirming(true)
    })

    return removeCloseListener
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault()
        void createTerminal('powershell')
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        openOverlay('commandPalette')
      }
      if (event.key === 'Escape' && !event.ctrlKey && !event.shiftKey && !event.altKey) {
        const { stack } = useOverlayStore.getState()
        if (stack.length > 0) {
          event.preventDefault()
          closeTop()
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [closeTop, createTerminal, openOverlay])

  const handleSaveWorkspace = async (): Promise<void> => {
    await saveWorkspaceSnapshot()
    setMessage(t('workspaceSaved'))
    window.setTimeout(() => setMessage(''), 1800)
  }

  const handleConfirmExit = (): void => {
    void window.smartShell.window.confirmClose()
  }

  return (
    <div className="app-shell">
      <AppTitleBar />
      <AppToolbar
        onEditProfiles={() => openOverlay('profileEditor')}
        onOpenHistory={() => openOverlay('sessionHistory')}
        onOpenTasks={() => openOverlay('taskBoard')}
        onSaveWorkspace={() => void handleSaveWorkspace()}
      />
      <ProfileEditor onClose={() => closeOverlay('profileEditor')} />
      <SessionHistory onClose={() => closeOverlay('sessionHistory')} />
      <TaskBoard onClose={() => closeOverlay('taskBoard')} />
      <CommandPalette
        onClose={() => closeOverlay('commandPalette')}
        onEditProfiles={() => openOverlay('profileEditor')}
        onOpenTasks={() => openOverlay('taskBoard')}
        onSaveWorkspace={() => void handleSaveWorkspace()}
      />
      {message && <div className="toast">{message}</div>}
      {error ? (
        <main className="empty-workspace error-workspace">
          <div>
            <h1>{t('failedToStart')}</h1>
            <pre>{error}</pre>
          </div>
        </main>
      ) : isReady ? (
        <main className="workspace-main">
          <LayoutRoot />
          <AgentPanel />
        </main>
      ) : (
        <main className="empty-workspace app-loading">
          <div className="loading-card">
            <span className="brand-mark">S</span>
            <strong>{t('loading')}</strong>
            <p>{t('loadingDetail')}</p>
          </div>
        </main>
      )}
      {exitConfirming && (
        <div className="exit-confirm" onClick={(e) => { if (e.target === e.currentTarget) setExitConfirming(false) }}>
          <div className="exit-confirm-card">
            <h3>{t('confirmExit')}</h3>
            <p>{t('confirmExitDetail')}</p>
            <div className="exit-confirm-actions">
              <button type="button" onClick={() => setExitConfirming(false)}>{t('cancel')}</button>
              <button type="button" onClick={handleConfirmExit}>{t('exitApp')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
