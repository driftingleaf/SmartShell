import { type ReactElement, useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import type { IDockviewPanelProps } from 'dockview'
import { TerminalHeader } from './TerminalHeader'
import '@xterm/xterm/css/xterm.css'

type TerminalPanelParams = {
  sessionId: string
}

export function TerminalPanel(props: IDockviewPanelProps<TerminalPanelParams>): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const sessionId = props.params.sessionId

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'Cascadia Mono, Consolas, monospace',
      fontSize: 13,
      theme: {
        background: '#0f1117',
        foreground: '#d6deeb',
        cursor: '#80cbc4',
        selectionBackground: '#2d3f57'
      },
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

  return (
    <div className="terminal-panel-shell">
      <TerminalHeader sessionId={sessionId} />
      <div ref={containerRef} className="terminal-panel" />
    </div>
  )
}
