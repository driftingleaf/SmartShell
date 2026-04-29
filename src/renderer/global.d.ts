import type { SmartShellApi } from '@shared/types'

declare global {
  interface Window {
    smartShell: SmartShellApi
  }
}

export {}
