import { type MouseEvent, type ReactElement, useEffect, useRef, useState } from 'react'
import { FitAddon } from '@xterm/addon-fit'
import { SearchAddon } from '@xterm/addon-search'
import { SerializeAddon } from '@xterm/addon-serialize'
import { Unicode11Addon } from '@xterm/addon-unicode11'
import { WebglAddon } from '@xterm/addon-webgl'
import { Terminal } from '@xterm/xterm'
import type { IDockviewPanelProps } from 'dockview'
import { getTerminalTheme, useSettingsStore } from '@renderer/store/settingsStore'
import { consumePendingContent, registerSerializer, unregisterSerializer } from '@renderer/store/terminalStore'
import { TerminalHeader } from './TerminalHeader'
import '@xterm/xterm/css/xterm.css'

type TerminalPanelParams = {
  sessionId: string
}

const isWindows = navigator.userAgent.includes('Windows')

export function TerminalPanel(props: IDockviewPanelProps<TerminalPanelParams>): ReactElement {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const terminalRef = useRef<Terminal | null>(null)
  const fitAddonRef = useRef<FitAddon | null>(null)
  const searchAddonRef = useRef<SearchAddon | null>(null)
  const theme = useSettingsStore((state) => state.theme)
  const sessionId = props.params.sessionId

  const [searchVisible, setSearchVisible] = useState(false)
  const [searchText, setSearchText] = useState('')
  const searchInputRef = useRef<HTMLInputElement | null>(null)

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
      smoothScrollDuration: 125,
      scrollback: 10000,
      theme: getTerminalTheme(useSettingsStore.getState().theme),
      allowProposedApi: true
    })

    const fitAddon = new FitAddon()
    const serializeAddon = new SerializeAddon()
    const searchAddon = new SearchAddon()
    const unicode11Addon = new Unicode11Addon()

    terminal.loadAddon(fitAddon)
    terminal.loadAddon(serializeAddon)
    terminal.loadAddon(searchAddon)
    terminal.loadAddon(unicode11Addon)
    terminal.unicode.activeVersion = '11'
    terminal.open(containerRef.current)

    try {
      const webglAddon = new WebglAddon()
      webglAddon.onContextLoss(() => {
        webglAddon.dispose()
      })
      terminal.loadAddon(webglAddon)
    } catch {
      // Falls back to built-in canvas renderer
    }

    searchAddonRef.current = searchAddon

    let savedScrollY = terminal.buffer.active.viewportY
    let unackedChars = 0
    let resizeTimeoutId: ReturnType<typeof setTimeout> | undefined

    const getViewport = (): HTMLElement | null =>
      containerRef.current?.querySelector('.xterm-viewport') as HTMLElement | null

    const syncViewportScroll = (): void => {
      const viewport = getViewport()
      if (!viewport) return
      const buffer = terminal.buffer.active
      const totalLines = buffer.length
      if (totalLines <= 0) return
      const rowHeight = viewport.scrollHeight / totalLines
      const expected = buffer.viewportY * rowHeight
      if (Math.abs(viewport.scrollTop - expected) > 1) {
        viewport.scrollTop = expected
      }
    }

    const resizePty = (): void => {
      window.smartShell.terminal.resize({
        id: sessionId,
        cols: terminal.cols,
        rows: terminal.rows
      })
    }

    const fit = (): void => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
      fitAddon.fit()
      if (isWindows) {
        if (resizeTimeoutId !== undefined) clearTimeout(resizeTimeoutId)
        resizeTimeoutId = setTimeout(resizePty, 1000)
      } else {
        resizePty()
      }
      syncViewportScroll()
    }

    const focusAndFit = (): void => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect || rect.width === 0 || rect.height === 0) return
      fitAddon.fit()
      resizePty()
      terminal.focus()
    }

    const frame = window.requestAnimationFrame(focusAndFit)
    const settleFrame = window.requestAnimationFrame(() => window.requestAnimationFrame(focusAndFit))
    const settleTimeout = window.setTimeout(focusAndFit, 120)
    const resizeObserver = new ResizeObserver(fit)
    resizeObserver.observe(containerRef.current)

    const visibilityDisposable = props.api.onDidVisibilityChange?.((event: { isVisible: boolean }) => {
      if (event.isVisible) {
        window.smartShell.terminal.resume(sessionId)
        const targetY = savedScrollY
        window.requestAnimationFrame(() => {
          fit()
          if (terminal.buffer.active.viewportY !== targetY) {
            terminal.scrollLines(targetY - terminal.buffer.active.viewportY)
          }
          syncViewportScroll()
          terminal.focus()
        })
      } else {
        savedScrollY = terminal.buffer.active.viewportY
        window.smartShell.terminal.pause(sessionId)
      }
    })

    terminal.attachCustomKeyEventHandler((event) => {
      if (event.ctrlKey && event.key === 'f' && event.type === 'keydown') {
        event.preventDefault()
        setSearchVisible(true)
        return false
      }
      return true
    })

    const inputDisposable = terminal.onData((data) => {
      window.smartShell.terminal.write({ id: sessionId, data })
    })

    const removeDataListener = window.smartShell.terminal.onData((event) => {
      if (event.id === sessionId) {
        terminal.write(event.data)
        unackedChars += event.data.length
        if (unackedChars >= 5000) {
          window.smartShell.terminal.ack(sessionId, unackedChars)
          unackedChars = 0
        }
        syncViewportScroll()
      }
    })

    const pendingContent = consumePendingContent(sessionId)
    if (pendingContent) {
      terminal.write(pendingContent)
    }

    registerSerializer(sessionId, serializeAddon)
    terminalRef.current = terminal
    fitAddonRef.current = fitAddon

    return () => {
      if (unackedChars > 0) {
        window.smartShell.terminal.ack(sessionId, unackedChars)
      }
      window.cancelAnimationFrame(frame)
      window.cancelAnimationFrame(settleFrame)
      window.clearTimeout(settleTimeout)
      if (resizeTimeoutId !== undefined) clearTimeout(resizeTimeoutId)
      unregisterSerializer(sessionId)
      removeDataListener()
      inputDisposable.dispose()
      visibilityDisposable?.dispose()
      resizeObserver.disconnect()
      terminal.dispose()
      terminalRef.current = null
      fitAddonRef.current = null
      searchAddonRef.current = null
    }
  }, [sessionId])

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.options.theme = getTerminalTheme(theme)
    }
  }, [theme])

  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [searchVisible])

  useEffect(() => {
    if (searchText && searchAddonRef.current) {
      searchAddonRef.current.findNext(searchText)
    }
  }, [searchText])

  return (
    <div className="terminal-panel-shell">
      <TerminalHeader sessionId={sessionId} />
      {searchVisible && (
        <div className="terminal-search-bar">
          <input
            ref={searchInputRef}
            className="terminal-search-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.shiftKey
                  ? searchAddonRef.current?.findPrevious(searchText)
                  : searchAddonRef.current?.findNext(searchText)
              }
              if (e.key === 'Escape') {
                setSearchVisible(false)
                setSearchText('')
              }
            }}
            placeholder="Find in terminal..."
          />
          <button type="button" onClick={() => searchAddonRef.current?.findPrevious(searchText)}>&#x25B2;</button>
          <button type="button" onClick={() => searchAddonRef.current?.findNext(searchText)}>&#x25BC;</button>
          <button
            type="button"
            onClick={() => {
              setSearchVisible(false)
              setSearchText('')
            }}
          >
            &times;
          </button>
        </div>
      )}
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
