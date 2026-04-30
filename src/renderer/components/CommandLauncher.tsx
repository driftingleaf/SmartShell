import type { MouseEvent, ReactElement } from 'react'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

const PlusIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="M8 3.2v9.6M3.2 8h9.6" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" />
  </svg>
)

const ChevronIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="M4.2 6.2 8 10l3.8-3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
)

export function CommandLauncher(): ReactElement {
  const { t } = useI18n()
  const profiles = useTerminalStore((state) => state.profiles)
  const createTerminal = useTerminalStore((state) => state.createTerminal)
  const closeMenu = (event: MouseEvent<HTMLDivElement>): void => {
    event.currentTarget.closest('details')?.removeAttribute('open')
  }

  return (
    <div className="command-launcher">
      <details className="split-launcher" title={t('newTerminal')}>
        <summary className="split-launcher-main" aria-label={t('newTerminal')} title={t('newTerminal')}>
          <PlusIcon />
          <span>{t('newTerminal')}</span>
          <ChevronIcon />
        </summary>
        <div className="split-launcher-options" onClick={closeMenu}>
          {profiles.map((profile) => (
            <button key={profile.id} type="button" onClick={() => void createTerminal(profile.id)}>
              {profile.name}
            </button>
          ))}
        </div>
      </details>
    </div>
  )
}
