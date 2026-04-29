import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app } from 'electron'
import type { WorkspaceState } from '@shared/types'

export class WorkspaceManager {
  private get filePath(): string {
    return path.join(app.getPath('userData'), 'workspace.json')
  }

  async load(): Promise<WorkspaceState> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8')
      return JSON.parse(raw) as WorkspaceState
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { terminals: [] }
      }
      throw error
    }
  }

  async save(workspace: WorkspaceState): Promise<void> {
    await fs.mkdir(path.dirname(this.filePath), { recursive: true })
    await fs.writeFile(this.filePath, JSON.stringify(workspace, null, 2), 'utf8')
  }
}
