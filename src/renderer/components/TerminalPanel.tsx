import { type MouseEvent, type ReactElement, useEffect, useRef } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from '@xterm/xterm'
import type { IDockviewPanelProps } from 'dockview'
import { getTerminalTheme, useSettingsStore } from '@renderer/store/settingsStore'
import { TerminalHeader } from './TerminalHeader'
import '@xterm/xterm/css/xterm.css'

type TerminalPanelParams = {
  sessionId: string
}

export function TerminalPanel(props: IDockviewPanelProps<TerminalPanelParams>): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const theme = useSettingsStore((state) => state.theme)
  const sessionId = props.params.sessionId

  const focusTerminal = (): void => {
    const terminal = terminalRef.current
    if (!terminal) return

    terminal.focus()
    terminal.refresh(0, terminal.rows - 1)
  }

  const handleContextMenu = async (event: MouseEvent<HTMLDivElement>): Promise<void> => {
    event.preventDefault()
    const terminal = terminalRef.current
    if (!terminal) return

    const selection = terminal.getSelection()
    if (selection) {
      await navigator.clipboard.writeText(selection)
      terminal.clearSelection()
    } else {
      const text = await navigator.clipboard.readText()
      if (text) {
        terminal.paste(text)
      }
    }

    terminal.focus()
  }

  useEffect(() => {
    if (!containerRef.current) return

    const terminal = new Terminal({
      cursorBlink: true,
      fontFamily: 'Cascadia Mono, Consolas, monospace',
      fontSize: 13,
      smoothScrollDuration: 0,
      theme: getTerminalTheme(useSettingsStore.getState().theme),
      allowProposedApi: false
    })
    const fitAddon = new FitAddon()

    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)

    const fit = (): void => {
      fitAddon.fit()
      window.smartShell.terminal.resize({
        id: sessionId,
        cols: terminal.cols,
        rows: terminal.rows
      })
    }

    const focusAndFit = (): void => {
      fit()
      terminal.focus()
      terminal.refresh(0, terminal.rows - 1)
    }

    const frame = window.requestAnimationFrame(focusAndFit)
    const settleFrame = window.requestAnimationFrame(() => window.requestAnimationFrame(focusAndFit))
    const settleTimeout = window.setTimeout(focusAndFit, 120)
    const resizeObserver = new ResizeObserver(fit)
    resizeObserver.observe(containerRef.current)

    let refreshFrame: number | null = null
    const scheduleRefresh = (stabilizeAlternateBuffer = false): void => {
      if (refreshFrame !== null) return

      refreshFrame = window.requestAnimationFrame(() => {
        refreshFrame = null
        if (stabilizeAlternateBuffer && terminal.buffer.active.type === 'alternate') {
          terminal.scrollToBottom()
        }
        terminal.refresh(0, terminal.rows - 1)
      })
    }

    const inputDisposable = terminal.onData((data) => {
      window.smartShell.terminal.write({ id: sessionId, data })
    })

    const scrollDisposable = terminal.onScroll(() => {
      scheduleRefresh(true)
    })

    const bufferDisposable = terminal.buffer.onBufferChange(() => {
      scheduleRefresh(true)
    })

    const removeDataListener = window.smartShell.terminal.onData((event) => {
      if (event.id === sessionId) {
        terminal.write(event.data, () => scheduleRefresh(terminal.buffer.active.type === 'alternate'))
      }
    })

    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    return () => {
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(settleFrame)
      window.clearTimeout(settleTimeout)
      if (refreshFrame !== null) {
        window.cancelAnimationFrame(refreshFrame)
      }
      removeDataListener()
      inputDisposable.dispose()
      scrollDisposable.dispose()
      bufferDisposable.dispose()
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

  return (
    <div className="terminal-panel-shell">
      <TerminalHeader sessionId={sessionId} />
      <div
        ref={containerRef}
        className="terminal-panel"
        onPointerDown={focusTerminal}
        onFocus={focusTerminal}
        onContextMenu={(event) => void handleContextMenu(event)}
      />
    </div>
  )
}
