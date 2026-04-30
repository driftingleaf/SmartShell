import { type FormEvent, type ReactElement, useEffect, useMemo, useState } from 'react'
import { useOverlayStore } from '@renderer/store/overlayStore'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

type TaskStatus = 'todo' | 'doing' | 'done'

type BoardTask = {
  id: string
  title: string
  status: TaskStatus
  sessionId?: string
}

type TaskBoardProps = {
  onClose(): void
}

const storageKey = 'smartshell.taskBoard'
const columns = [
  { status: 'todo', label: 'todo' },
  { status: 'doing', label: 'doing' },
  { status: 'done', label: 'done' }
] satisfies { status: TaskStatus; label: 'todo' | 'doing' | 'done' }[]

const loadTasks = (): BoardTask[] => {
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return []

  try {
    return JSON.parse(raw) as BoardTask[]
  } catch {
    return []
  }
}

export function TaskBoard({ onClose }: TaskBoardProps): ReactElement | null {
  const { t } = useI18n()
  const isOpen = useOverlayStore((state) => state.isOpen('taskBoard'))
  const zIndex = useOverlayStore((state) => state.zIndex('taskBoard'))
  const bringToTop = useOverlayStore((state) => state.bringToTop)
  const sessions = useTerminalStore((state) => state.sessions)
  const setActiveSession = useTerminalStore((state) => state.setActiveSession)
  const [tasks, setTasks] = useState<BoardTask[]>(loadTasks)
  const [title, setTitle] = useState('')
  const [sessionId, setSessionId] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    if (isOpen) setConfirming(false)
  }, [isOpen])

  const sessionTitles = useMemo(() => {
    return new Map(sessions.map((session) => [session.id, session.title]))
  }, [sessions])

  if (!isOpen) return null

  const requestClose = (): void => {
    setConfirming(true)
  }

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

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      bringToTop('taskBoard')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" style={{ '--z-overlay': zIndex } as React.CSSProperties} onClick={handleBackdropClick}>
      <section className="task-board-modal" role="dialog" aria-modal="true" aria-label="Task board">
        <header className="task-board-header">
          <div>
            <h2>{t('taskBoard')}</h2>
            <p>{t('taskBoardDescription')}</p>
          </div>
          <button type="button" onClick={requestClose}>
            {t('close')}
          </button>
        </header>
        <form className="task-board-form" onSubmit={addTask}>
          <input value={title} placeholder={t('addTask')} onChange={(event) => setTitle(event.target.value)} />
          <select value={sessionId} onChange={(event) => setSessionId(event.target.value)}>
            <option value="">{t('noSession')}</option>
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {session.title}
              </option>
            ))}
          </select>
          <button type="submit">{t('add')}</button>
        </form>
        <div className="task-board-columns">
          {columns.map((column) => (
            <section key={column.status} className="task-column">
              <h3>{t(column.label)}</h3>
              {tasks
                .filter((task) => task.status === column.status)
                .map((task) => (
                  <article key={task.id} className="task-card">
                    <strong>{task.title}</strong>
                    {task.sessionId && (
                      <button type="button" onClick={() => setActiveSession(task.sessionId!)}>
                        {sessionTitles.get(task.sessionId) ?? t('missingSession')}
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
                          {t(target.label)}
                        </button>
                      ))}
                      <button type="button" onClick={() => removeTask(task.id)}>
                        {t('remove')}
                      </button>
                    </div>
                  </article>
                ))}
            </section>
          ))}
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
