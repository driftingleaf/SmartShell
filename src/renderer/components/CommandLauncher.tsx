import type { ReactElement } from 'react'
import { useTerminalStore } from '@renderer/store/terminalStore'

export function CommandLauncher(): ReactElement {
  const profiles = useTerminalStore((state) => state.profiles)
  const createTerminal = useTerminalStore((state) => state.createTerminal)

  return (
    <div className="command-launcher">
      {profiles.map((profile) => (
        <button key={profile.id} type="button" onClick={() => void createTerminal(profile.id)}>
          {profile.name}
        </button>
      ))}
    </div>
  )
}
