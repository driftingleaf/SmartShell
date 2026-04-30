import { type ReactElement, useEffect, useState } from 'react'
import type { TerminalProfile } from '@shared/types'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

type ProfileDraft = TerminalProfile & {
  argsText: string
}

type ProfileEditorProps = {
  isOpen: boolean
  onClose(): void
}

export function ProfileEditor({ isOpen, onClose }: ProfileEditorProps): ReactElement | null {
  const { t } = useI18n()
  const profiles = useTerminalStore((state) => state.profiles)
  const saveProfiles = useTerminalStore((state) => state.saveProfiles)
  const [drafts, setDrafts] = useState<ProfileDraft[]>([])

  useEffect(() => {
    if (isOpen) {
      setDrafts(profiles.map((profile) => ({ ...profile, argsText: profile.args.join(' ') })))
    }
  }, [isOpen, profiles])

  if (!isOpen) return null

  const updateDraft = (id: string, patch: Partial<ProfileDraft>): void => {
    setDrafts((items) => items.map((item) => (item.id === id ? { ...item, ...patch } : item)))
  }

  const addProfile = (): void => {
    setDrafts((items) => [
      ...items,
      {
        id: crypto.randomUUID(),
        name: 'Custom Command',
        shell: 'powershell.exe',
        args: [],
        argsText: '-NoExit',
        defaultTitle: 'Custom'
      }
    ])
  }

  const removeProfile = (id: string): void => {
    setDrafts((items) => items.filter((item) => item.id !== id))
  }

  const submit = async (): Promise<void> => {
    await saveProfiles(
      drafts.map(({ argsText, ...profile }) => ({
        ...profile,
        name: profile.name.trim() || 'Untitled',
        shell: profile.shell.trim() || 'powershell.exe',
        defaultTitle: profile.defaultTitle.trim() || profile.name.trim() || 'Terminal',
        args: argsText.split(' ').map((item) => item.trim()).filter(Boolean)
      }))
    )
    onClose()
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="profile-editor" role="dialog" aria-modal="true" aria-label="Profile editor">
        <header className="profile-editor-header">
          <div>
            <h2>{t('profiles')}</h2>
            <p>{t('profilesDescription')}</p>
          </div>
          <button type="button" onClick={onClose}>×</button>
        </header>

        <div className="profile-list">
          {drafts.map((profile) => (
            <article className="profile-row" key={profile.id}>
              <label>
                {t('name')}
                <input disabled={profile.builtIn} value={profile.name} onChange={(event) => updateDraft(profile.id, { name: event.target.value })} />
              </label>
              <label>
                {t('shell')}
                <input disabled={profile.builtIn} value={profile.shell} onChange={(event) => updateDraft(profile.id, { shell: event.target.value })} />
              </label>
              <label>
                {t('args')}
                <input disabled={profile.builtIn} value={profile.argsText} onChange={(event) => updateDraft(profile.id, { argsText: event.target.value })} />
              </label>
              <label>
                {t('title')}
                <input disabled={profile.builtIn} value={profile.defaultTitle} onChange={(event) => updateDraft(profile.id, { defaultTitle: event.target.value })} />
              </label>
              {profile.builtIn ? (
                <span className="profile-built-in">{t('builtIn')}</span>
              ) : (
                <button className="profile-remove" type="button" onClick={() => removeProfile(profile.id)}>
                  {t('remove')}
                </button>
              )}
            </article>
          ))}
        </div>

        <footer className="profile-editor-footer">
          <button type="button" onClick={addProfile}>{t('addProfile')}</button>
          <div>
            <button type="button" onClick={onClose}>{t('cancel')}</button>
            <button className="primary-button" type="button" onClick={() => void submit()}>{t('saveProfiles')}</button>
          </div>
        </footer>
      </section>
    </div>
  )
}
