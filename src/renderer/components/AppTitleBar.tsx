import { type ReactElement, useEffect, useState } from 'react'

const MinimizeIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="M4 8h8" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
)

const MaximizeIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <rect x="4.2" y="4.2" width="7.6" height="7.6" rx="1" fill="none" stroke="currentColor" strokeWidth="1.4" />
  </svg>
)

const RestoreIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="M5.2 6.2h5.6v5.6H5.2z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.3" />
    <path d="M7 4.2h5v5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.3" />
  </svg>
)

const CloseIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="m4.5 4.5 7 7M11.5 4.5l-7 7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
  </svg>
)

export function AppTitleBar(): ReactElement {
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    void window.smartShell.window.isMaximized().then(setIsMaximized)
  }, [])

  const toggleMaximize = async (): Promise<void> => {
    setIsMaximized(await window.smartShell.window.toggleMaximize())
  }

  return (
    <header className="app-titlebar" onDoubleClick={() => void toggleMaximize()}>
      <div className="titlebar-brand">
        <span className="titlebar-mark">S</span>
        <div>
          <strong>SmartShell</strong>
          <small>AI Terminal Workbench</small>
        </div>
      </div>
      <div className="titlebar-drag-spacer" />
      <div className="window-controls" onDoubleClick={(event) => event.stopPropagation()}>
        <button type="button" aria-label="Minimize" title="Minimize" onClick={() => void window.smartShell.window.minimize()}>
          <MinimizeIcon />
        </button>
        <button type="button" aria-label={isMaximized ? 'Restore' : 'Maximize'} title={isMaximized ? 'Restore' : 'Maximize'} onClick={() => void toggleMaximize()}>
          {isMaximized ? <RestoreIcon /> : <MaximizeIcon />}
        </button>
        <button className="window-close-button" type="button" aria-label="Close" title="Close" onClick={() => void window.smartShell.window.close()}>
          <CloseIcon />
        </button>
      </div>
    </header>
  )
}
