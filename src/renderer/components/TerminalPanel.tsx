import { type ReactElement, useEffect, useRef, useState } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import type { IDockviewPanelProps } from 'dockview'
import { getTerminalTheme, useSettingsStore } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'
import { TerminalHeader } from './TerminalHeader'
import '@xterm/xterm/css/xterm.css'

type TerminalPanelParams = {
  sessionId: string
}

export function TerminalPanel(props: IDockviewPanelProps<TerminalPanelParams>): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const restartTerminal = useTerminalStore((state) => state.restartTerminal)
  const duplicateTerminal = useTerminalStore((state) => state.duplicateTerminal)
  const closeTerminal = useTerminalStore((state) => state.closeTerminal)
  const theme = useSettingsStore((state) => state.theme)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const sessionId = props.params.sessionId

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'Cascadia Mono, Consolas, monospace',
      fontSize: 13,
      theme: getTerminalTheme(useSettingsStore.getState().theme),
      allowProposedApi: false
    })
    const fitAddon = new FitAddon()

    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)
    terminal.focus()

    const fit = (): void => {
      fitAddon.fit()
      window.smartShell.terminal.resize({
        id: sessionId,
        cols: terminal.cols,
        rows: terminal.rows
      })
    }

    const frame = window.requestAnimationFrame(fit)
    const resizeObserver = new ResizeObserver(fit)
    resizeObserver.observe(containerRef.current)

    const inputDisposable = terminal.onData((data) => {
      window.smartShell.terminal.write({ id: sessionId, data })
    })

    const removeDataListener = window.smartShell.terminal.onData((event) => {
      if (event.id === sessionId) {
        terminal.write(event.data)
      }
    })

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    return () => {
      window.cancelAnimationFrame(frame)
      removeDataListener()
      inputDisposable.dispose()
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
    }
  }, [sessionId])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = getTerminalTheme(theme)
    }
  }, [theme])

  const copySelection = async (): Promise<void> => {
    const selection = terminalRef.current?.getSelection()
    if (selection) {
      await navigator.clipboard.writeText(selection)
    }
  }

  const pasteClipboard = async (): Promise<void> => {
    const text = await navigator.clipboard.readText()
    if (text) {
      await window.smartShell.terminal.write({ id: sessionId, data: text })
    }
  }

  return (
    <div className="terminal-panel-shell" onClick={() => setMenu(null)}>
      <TerminalHeader sessionId={sessionId} />
      <div
        ref={containerRef}
        className="terminal-panel"
        onContextMenu={(event) => {
          event.preventDefault()
          setMenu({ x: event.clientX, y: event.clientY })
        }}
      />
      {menu && (
        <div className="terminal-context-menu" style={{ left: menu.x, top: menu.y }}>
          <button type="button" onClick={() => void copySelection()}>Copy</button>
          <button type="button" onClick={() => void pasteClipboard()}>Paste</button>
          <button type="button" onClick={() => terminalRef.current?.clear()}>Clear</button>
          <hr />
          <button type="button" onClick={() => void restartTerminal(sessionId)}>Restart</button>
          <button type="button" onClick={() => void duplicateTerminal(sessionId)}>Duplicate</button>
          <button type="button" onClick={() => void closeTerminal(sessionId)}>Close</button>
        </div>
      )}
    </div>
  )
}
