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
    terminalRef.current?.focus()
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
      scrollback: 10000,
      theme: getTerminalTheme(useSettingsStore.getState().theme),
      allowProposedApi: false
    })
    const fitAddon = new FitAddon()

    terminal.loadAddon(fitAddon)
    terminal.open(containerRef.current)

    let savedScrollY = terminal.buffer.active.viewportY

    const fit = (): void => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
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
    }

    const frame = window.requestAnimationFrame(focusAndFit)
    const settleFrame = window.requestAnimationFrame(() => window.requestAnimationFrame(focusAndFit))
    const settleTimeout = window.setTimeout(focusAndFit, 120)
    const resizeObserver = new ResizeObserver(fit)
    resizeObserver.observe(containerRef.current)

    const visibilityDisposable = props.api.onDidVisibilityChange?.((event: { isVisible: boolean }) => {
      if (event.isVisible) {
        window.requestAnimationFrame(() => {
          fit()
          terminal.scrollLines(savedScrollY - terminal.buffer.active.viewportY)
          terminal.refresh(0, terminal.rows - 1)
          terminal.focus()
        })
      } else {
        savedScrollY = terminal.buffer.active.viewportY
      }
    })

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
      window.cancelAnimationFrame(settleFrame)
      window.clearTimeout(settleTimeout)
      removeDataListener()
      inputDisposable.dispose()
      visibilityDisposable?.dispose()
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
