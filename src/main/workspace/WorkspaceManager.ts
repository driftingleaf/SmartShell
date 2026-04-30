import { promises as fs } from 'node:fs'
import path from 'node:path'
import { app, dialog } from 'electron'
import type { WorkspaceSnapshot, WorkspaceState } from '@shared/types'

export class WorkspaceManager {
  private get filePath(): string {
    return path.join(app.getPath('userData'), 'workspace.json')
  }

  private get snapshotsPath(): string {
    return path.join(app.getPath('userData'), 'workspace-snapshots.json')
  }

  getDefaultCwd(): string {
    return process.cwd()
  }

  async selectFolder(): Promise<string | undefined> {
    const result = await dialog.showOpenDialog({
      title: 'Open Workspace Folder',
      properties: ['openDirectory']
    })

    return result.canceled ? undefined : result.filePaths[0]
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

  async listSnapshots(): Promise<WorkspaceSnapshot[]> {
    const snapshots = await this.readSnapshots()
    return snapshots.sort((first, second) => second.updatedAt.localeCompare(first.updatedAt))
  }

  async saveSnapshot(workspace: WorkspaceState): Promise<WorkspaceSnapshot> {
    await this.save(workspace)

    const now = new Date()
    const snapshots = await this.readSnapshots()
    const snapshot: WorkspaceSnapshot = {
      id: `workspace-${now.toISOString().replace(/[:.]/g, '-')}`,
      name: this.createSnapshotName(workspace, now),
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
      state: workspace
    }

    snapshots.unshift(snapshot)
    await this.writeSnapshots(snapshots.slice(0, 30))
    return snapshot
  }

  private async readSnapshots(): Promise<WorkspaceSnapshot[]> {
    try {
      const raw = await fs.readFile(this.snapshotsPath, 'utf8')
      return JSON.parse(raw) as WorkspaceSnapshot[]
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return []
      }
      throw error
    }
  }

  private async writeSnapshots(snapshots: WorkspaceSnapshot[]): Promise<void> {
    await fs.mkdir(path.dirname(this.snapshotsPath), { recursive: true })
    await fs.writeFile(this.snapshotsPath, JSON.stringify(snapshots, null, 2), 'utf8')
  }

  private createSnapshotName(workspace: WorkspaceState, createdAt: Date): string {
    const folderName = workspace.cwd ? path.basename(workspace.cwd) : 'Workspace'
    return `${folderName || 'Workspace'} · ${createdAt.toLocaleString()}`
  }
}
