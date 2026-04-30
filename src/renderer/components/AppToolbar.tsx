import type { MouseEvent, ReactElement } from 'react'
import type { Language, Theme } from '@renderer/store/settingsStore'
import { useI18n, useSettingsStore } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'
import { CommandLauncher } from './CommandLauncher'

type AppToolbarProps = {
  onEditProfiles(): void
  onOpenHistory(): void
  onOpenTasks(): void
  onSaveWorkspace(): void
}

const ChevronIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="M4.2 6.2 8 10l3.8-3.8" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
  </svg>
)

const ThemeIcon = (): ReactElement => (
  <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
    <path d="M8 1.8a6.2 6.2 0 1 0 0 12.4A4.6 4.6 0 0 1 8 1.8Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.5" />
  </svg>
)

export function AppToolbar({ onEditProfiles, onOpenHistory, onOpenTasks, onSaveWorkspace }: AppToolbarProps): ReactElement {
  const { language, setLanguage, t } = useI18n()
  const sessionCount = useTerminalStore((state) => state.sessions.length)
  const activeSession = useTerminalStore((state) =>
    state.sessions.find((session) => session.id === state.activeSessionId)
  )
  const workspaceCwd = useTerminalStore((state) => state.workspaceCwd)
  const selectWorkspaceFolder = useTerminalStore((state) => state.selectWorkspaceFolder)
  const theme = useSettingsStore((state) => state.theme)
  const setTheme = useSettingsStore((state) => state.setTheme)
  const workspaceName = workspaceCwd.split(/[\\/]/).filter(Boolean).pop() || workspaceCwd || t('noFolder')
  const closeMenu = (event: MouseEvent<HTMLDivElement>): void => {
    event.currentTarget.closest('details')?.removeAttribute('open')
  }
  const changeLanguage = (value: Language): void => setLanguage(value)
  const changeTheme = (value: Theme): void => setTheme(value)
  const languageLabel = language === 'zh-CN' ? '简体' : language === 'zh-TW' ? '繁體' : 'EN'
  const themeLabel = theme === 'light' ? t('themeLight') : theme === 'midnight' ? t('themeMidnight') : t('themeAbyss')

  return (
    <header className="app-toolbar">
      <button className="workspace-button" type="button" title={workspaceCwd} onClick={() => void selectWorkspaceFolder()}>
        <span>{t('workspace')}</span>
        <strong>{workspaceName}</strong>
      </button>
      <CommandLauncher />
      <div className="toolbar-status" title={activeSession?.cwd ?? ''}>
        <span>{t('sessions', { count: sessionCount })}</span>
        {activeSession && <strong>{activeSession.title}</strong>}
        <small>{t('shortcutHint')}</small>
      </div>
      <details className="toolbar-menu language-menu language-inline">
        <summary>
          <span>{languageLabel}</span>
          <ChevronIcon />
        </summary>
        <div className="toolbar-more-menu" onClick={closeMenu}>
          <button type="button" onClick={() => changeLanguage('en')}>English</button>
          <button type="button" onClick={() => changeLanguage('zh-CN')}>简体中文</button>
          <button type="button" onClick={() => changeLanguage('zh-TW')}>繁體中文</button>
        </div>
      </details>
      <details className="toolbar-menu theme-menu theme-inline">
        <summary title={t('theme')}>
          <ThemeIcon />
          <span>{themeLabel}</span>
          <ChevronIcon />
        </summary>
        <div className="toolbar-more-menu" onClick={closeMenu}>
          <button type="button" onClick={() => changeTheme('abyss')}>{t('themeAbyss')}</button>
          <button type="button" onClick={() => changeTheme('midnight')}>{t('themeMidnight')}</button>
          <button type="button" onClick={() => changeTheme('light')}>{t('themeLight')}</button>
        </div>
      </details>
      <div className="toolbar-actions">
        <button className="save-button" type="button" onClick={onEditProfiles}>
          {t('profiles')}
        </button>
        <button className="save-button" type="button" onClick={onOpenHistory}>
          {t('history')}
        </button>
        <button className="save-button" type="button" onClick={onOpenTasks}>
          {t('tasks')}
        </button>
        <button className="save-button" type="button" onClick={onSaveWorkspace}>
          {t('saveWorkspace')}
        </button>
      </div>
      <details className="toolbar-menu toolbar-more">
        <summary>
          <span>{t('more')}</span>
          <ChevronIcon />
        </summary>
        <div className="toolbar-more-menu" onClick={closeMenu}>
          <button type="button" onClick={onEditProfiles}>{t('profiles')}</button>
          <button type="button" onClick={onOpenHistory}>{t('history')}</button>
          <button type="button" onClick={onOpenTasks}>{t('tasks')}</button>
          <button type="button" onClick={onSaveWorkspace}>{t('saveWorkspace')}</button>
          <div className="toolbar-language-group">
            <span>{t('language')}</span>
            <button type="button" onClick={() => changeLanguage('en')}>English</button>
            <button type="button" onClick={() => changeLanguage('zh-CN')}>简体中文</button>
            <button type="button" onClick={() => changeLanguage('zh-TW')}>繁體中文</button>
          </div>
          <div className="toolbar-language-group">
            <span>{t('theme')}</span>
            <button type="button" onClick={() => changeTheme('abyss')}>{t('themeAbyss')}</button>
            <button type="button" onClick={() => changeTheme('midnight')}>{t('themeMidnight')}</button>
            <button type="button" onClick={() => changeTheme('light')}>{t('themeLight')}</button>
          </div>
        </div>
      </details>
    </header>
  )
}
