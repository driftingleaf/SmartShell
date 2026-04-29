import { type ReactElement, useEffect, useState } from 'react'
import { AgentPanel } from './components/AgentPanel'
import { AppToolbar } from './components/AppToolbar'
import { CommandPalette } from './components/CommandPalette'
import { LayoutRoot } from './components/LayoutRoot'
import { ProfileEditor } from './components/ProfileEditor'
import { SessionHistory } from './components/SessionHistory'
import { TaskBoard } from './components/TaskBoard'
import { useTerminalStore } from './store/terminalStore'

export function App(): ReactElement {
  const loadInitialState = useTerminalStore((state) => state.loadInitialState)
  const saveWorkspace = useTerminalStore((state) => state.saveWorkspace)
  const createTerminal = useTerminalStore((state) => state.createTerminal)
  const markExited = useTerminalStore((state) => state.markExited)
  const captureTerminalOutput = useTerminalStore((state) => state.captureTerminalOutput)
  const sessions = useTerminalStore((state) => state.sessions)
  const layout = useTerminalStore((state) => state.layout)
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [isProfileEditorOpen, setIsProfileEditorOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isTaskBoardOpen, setIsTaskBoardOpen] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

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

    const removeExitListener = window.smartShell.terminal.onExit((event) => {
      markExited(event.id)
    })

    return () => {
      removeDataListener()
      removeExitListener()
    }
  }, [captureTerminalOutput, loadInitialState, markExited])

  useEffect(() => {
    if (!isReady || error) return

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
    await saveWorkspace()
    setMessage('Workspace saved')
    window.setTimeout(() => setMessage(''), 1800)
  }

  return (
    <div className="app-shell">
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
            <h1>SmartShell failed to start</h1>
            <pre>{error}</pre>
          </div>
        </main>
      ) : isReady ? (
        <main className="workspace-main">
          <LayoutRoot />
          <AgentPanel />
        </main>
      ) : (
        <main className="empty-workspace">Loading SmartShell...</main>
      )}
    </div>
  )
}
