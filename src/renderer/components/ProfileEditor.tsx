import { type ReactElement, useEffect, useState } from 'react'
import type { TerminalProfile } from '@shared/types'
import { useOverlayStore } from '@renderer/store/overlayStore'
import { useI18n } from '@renderer/store/settingsStore'
import { useTerminalStore } from '@renderer/store/terminalStore'

type ProfileDraft = TerminalProfile & {
  argsText: string
}

type ProfileEditorProps = {
  onClose(): void
}

function isDirty(drafts: ProfileDraft[], profiles: TerminalProfile[]): boolean {
  if (drafts.length !== profiles.length) return true
  return drafts.some((draft) => {
    const original = profiles.find((p) => p.id === draft.id)
    if (!original) return true
    return (
      draft.name !== original.name ||
      draft.shell !== original.shell ||
      draft.argsText !== original.args.join(' ') ||
      draft.defaultTitle !== original.defaultTitle
    )
  })
}

export function ProfileEditor({ onClose }: ProfileEditorProps): ReactElement | null {
  const { t } = useI18n()
  const profiles = useTerminalStore((state) => state.profiles)
  const saveProfiles = useTerminalStore((state) => state.saveProfiles)
  const isOpen = useOverlayStore((state) => state.isOpen('profileEditor'))
  const zIndex = useOverlayStore((state) => state.zIndex('profileEditor'))
  const bringToTop = useOverlayStore((state) => state.bringToTop)
  const [drafts, setDrafts] = useState<ProfileDraft[]>([])
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setDrafts(profiles.map((profile) => ({ ...profile, argsText: profile.args.join(' ') })))
      setConfirming(false)
    }
  }, [isOpen, profiles])

  if (!isOpen) return null

  const requestClose = (): void => {
    if (isDirty(drafts, profiles)) {
      setConfirming(true)
    } else {
      onClose()
    }
  }

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

  const handleBackdropClick = (e: React.MouseEvent): void => {
    if (e.target === e.currentTarget) {
      bringToTop('profileEditor')
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" style={{ '--z-overlay': zIndex } as React.CSSProperties} onClick={handleBackdropClick}>
      <section className="profile-editor" role="dialog" aria-modal="true" aria-label="Profile editor">
        <header className="profile-editor-header">
          <div>
            <h2>{t('profiles')}</h2>
            <p>{t('profilesDescription')}</p>
          </div>
          <button type="button" onClick={requestClose}>×</button>
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

        {confirming ? (
          <div className="close-confirm">
            <span>{t('discardChanges')}</span>
            <div className="close-confirm-actions">
              <button type="button" onClick={() => setConfirming(false)}>{t('cancel')}</button>
              <button type="button" onClick={onClose}>{t('discard')}</button>
            </div>
          </div>
        ) : (
          <footer className="profile-editor-footer">
            <button type="button" onClick={addProfile}>{t('addProfile')}</button>
            <div>
              <button type="button" onClick={requestClose}>{t('cancel')}</button>
              <button className="primary-button" type="button" onClick={() => void submit()}>{t('saveProfiles')}</button>
            </div>
          </footer>
        )}
      </section>
    </div>
  )
}
