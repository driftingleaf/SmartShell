import { type ReactElement, useEffect, useState } from 'react'
import { AgentPanel } from './components/AgentPanel'
import { AppTitleBar } from './components/AppTitleBar'
import { AppToolbar } from './components/AppToolbar'
import { CommandPalette } from './components/CommandPalette'
import { LayoutRoot } from './components/LayoutRoot'
import { ProfileEditor } from './components/ProfileEditor'
import { SessionHistory } from './components/SessionHistory'
import { TaskBoard } from './components/TaskBoard'
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
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isTaskBoardOpen, setIsTaskBoardOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

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
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 't') {
        event.preventDefault()
        void createTerminal('powershell')
      }
      if (event.ctrlKey && event.shiftKey && event.key.toLowerCase() === 'p') {
        event.preventDefault()
        setIsCommandPaletteOpen(true)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [createTerminal])

  const handleSaveWorkspace = async (): Promise<void> => {
    await saveWorkspaceSnapshot()
    setMessage(t('workspaceSaved'))
    window.setTimeout(() => setMessage(''), 1800)
  }

  return (
    <div className="app-shell">
      <AppTitleBar />
      <AppToolbar
        onEditProfiles={() => setIsProfileEditorOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenTasks={() => setIsTaskBoardOpen(true)}
        onSaveWorkspace={() => void handleSaveWorkspace()}
      />
      <ProfileEditor isOpen={isProfileEditorOpen} onClose={() => setIsProfileEditorOpen(false)} />
      <SessionHistory isOpen={isHistoryOpen} onClose={() => setIsHistoryOpen(false)} />
      <TaskBoard isOpen={isTaskBoardOpen} onClose={() => setIsTaskBoardOpen(false)} />
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onEditProfiles={() => setIsProfileEditorOpen(true)}
        onOpenTasks={() => setIsTaskBoardOpen(true)}
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
    </div>
  )
}
