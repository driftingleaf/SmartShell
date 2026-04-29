import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'

type TaskStatus = 'todo' | 'doing' | 'done'

type BoardTask = {
  id: string
  title: string
  status: TaskStatus
  sessionId?: string
}

type TaskBoardProps = {
  isOpen: boolean
  onClose(): void
}

const storageKey = 'smartshell.taskBoard'
const columns: { status: TaskStatus; label: string }[] = [
  { status: 'todo', label: 'Todo' },
  { status: 'doing', label: 'Doing' },
  { status: 'done', label: 'Done' }
]

const loadTasks = (): BoardTask[] => {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return []

  try {
    return JSON.parse(raw) as BoardTask[]
  } catch {
    return []
  }
}

export function TaskBoard({ isOpen, onClose }: TaskBoardProps): ReactElement | null {
  const sessions = useTerminalStore((state) => state.sessions)
  const setActiveSession = useTerminalStore((state) => state.setActiveSession)
  const [tasks, setTasks] = useState<BoardTask[]>(loadTasks)
  const [title, setTitle] = useState('')
  const [sessionId, setSessionId] = useState('')

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(tasks))
  }, [tasks])

  const sessionTitles = useMemo(() => {
    return new Map(sessions.map((session) => [session.id, session.title]))
  }, [sessions])

  if (!isOpen) return null

  const addTask = (event: FormEvent): void => {
    event.preventDefault()
    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    setTasks((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        title: trimmedTitle,
        status: 'todo',
        sessionId: sessionId || undefined
      }
    ])
    setTitle('')
  }

  const updateTask = (id: string, status: TaskStatus): void => {
    setTasks((current) => current.map((task) => (task.id === id ? { ...task, status } : task)))
  }

  const removeTask = (id: string): void => {
    setTasks((current) => current.filter((task) => task.id !== id))
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="task-board-modal" role="dialog" aria-modal="true" aria-label="Task board">
        <header className="task-board-header">
          <div>
            <h2>Task Board</h2>
            <p>Track work across parallel terminal agents.</p>
          </div>
          <button type="button" onClick={onClose}>
            Close
          </button>
        </header>
        <form className="task-board-form" onSubmit={addTask}>
          <input value={title} placeholder="Add a task..." onChange={(event) => setTitle(event.target.value)} />
          <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
            <option value="">No session</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title}
              </option>
            ))}
          </select>
          <button type="submit">Add</button>
        </form>
        <div className="task-board-columns">
          {columns.map((column) => (
            <section key={column.status} className="task-column">
              <h3>{column.label}</h3>
              {tasks
                .filter((task) => task.status === column.status)
                .map((task) => (
                  <article key={task.id} className="task-card">
                    <strong>{task.title}</strong>
                    {task.sessionId && (
                      <button type="button" onClick={() => setActiveSession(task.sessionId!)}>
                        {sessionTitles.get(task.sessionId) ?? 'Missing session'}
                      </button>
                    )}
                    <div className="task-card-actions">
                      {columns.map((target) => (
                        <button
                          key={target.status}
                          type="button"
                          disabled={task.status === target.status}
                          onClick={() => updateTask(task.id, target.status)}
                        >
                          {target.label}
                        </button>
                      ))}
                      <button type="button" onClick={() => removeTask(task.id)}>
                        Remove
                      </button>
                    </div>
                  </article>
                ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
