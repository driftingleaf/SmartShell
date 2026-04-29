import { type ReactElement, useEffect, useState } from 'react'
import { AppToolbar } from './components/AppToolbar'
import { LayoutRoot } from './components/LayoutRoot'
import { useTerminalStore } from './store/terminalStore'

export function App(): ReactElement {
  const loadInitialState = useTerminalStore((state) => state.loadInitialState)
  const saveWorkspace = useTerminalStore((state) => state.saveWorkspace)
  const createTerminal = useTerminalStore((state) => state.createTerminal)
  const markExited = useTerminalStore((state) => state.markExited)
  const sessions = useTerminalStore((state) => state.sessions)
  const layout = useTerminalStore((state) => state.layout)
  const [isReady, setIsReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    void loadInitialState()
      .catch((reason: unknown) => {
        const text = reason instanceof Error ? reason.message : String(reason)
        console.error(text)
        setError(text)
      })
      .finally(() => setIsReady(true))

    const removeExitListener = window.smartShell.terminal.onExit((event) => {
      markExited(event.id)
    })

    return () => {
      removeExitListener()
    }
  }, [loadInitialState, markExited])

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
      <AppToolbar onSaveWorkspace={() => void handleSaveWorkspace()} />
      {message && <div className="toast">{message}</div>}
      {error ? (
        <main className="empty-workspace error-workspace">
          <div>
            <h1>SmartShell failed to start</h1>
            <pre>{error}</pre>
          </div>
        </main>
      ) : isReady ? (
        <LayoutRoot />
      ) : (
        <main className="empty-workspace">Loading SmartShell...</main>
      )}
    </div>
  )
}
