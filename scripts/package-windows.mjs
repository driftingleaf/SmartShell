import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const packageJson = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'))
const productName = 'SmartShell'
const appName = `${productName}-win32-x64`
const releaseRoot = path.join(root, 'release')
const appRoot = path.join(releaseRoot, appName)
const appDir = path.join(appRoot, 'resources', 'app')
const electronDist = path.join(root, 'node_modules', 'electron', 'dist')

if (!existsSync(electronDist)) {
  throw new Error('Electron runtime not found. Run npm install first.')
}

await rm(appRoot, { recursive: true, force: true })
await mkdir(releaseRoot, { recursive: true })
await cp(electronDist, appRoot, { recursive: true })

const electronExe = path.join(appRoot, 'electron.exe')
if (existsSync(electronExe)) {
  await rename(electronExe, path.join(appRoot, `${productName}.exe`))
}

await mkdir(appDir, { recursive: true })
await cp(path.join(root, 'out'), path.join(appDir, 'out'), { recursive: true })
await mkdir(path.join(appDir, 'build'), { recursive: true })
await cp(path.join(root, 'build', 'icon.ico'), path.join(appDir, 'build', 'icon.ico'))

await writeFile(
  path.join(appDir, 'package.json'),
  JSON.stringify(
    {
      name: packageJson.name,
      version: packageJson.version,
      description: packageJson.description,
      main: packageJson.main,
      type: packageJson.type,
      dependencies: {
        '@electron-toolkit/utils': packageJson.dependencies['@electron-toolkit/utils'],
        'node-pty': packageJson.dependencies['node-pty']
      }
    },
    null,
    2
  )
)

const runtimePackages = [
  ['node-pty'],
  ['node-addon-api'],
  ['@electron-toolkit', 'utils']
]

for (const packagePath of runtimePackages) {
  const from = path.join(root, 'node_modules', ...packagePath)
  const to = path.join(appDir, 'node_modules', ...packagePath)
  if (!existsSync(from)) {
    throw new Error(`Runtime dependency not found: ${packagePath.join('/')}`)
  }
  await cp(from, to, { recursive: true })
}

const zipPath = path.join(releaseRoot, `${productName}-${packageJson.version}-win32-x64.zip`)
await cp(path.join(root, 'scripts', 'install-smartshell.ps1'), path.join(releaseRoot, 'install-smartshell.ps1'))
await cp(path.join(root, 'scripts', 'uninstall-smartshell.ps1'), path.join(releaseRoot, 'uninstall-smartshell.ps1'))

await rm(zipPath, { force: true })
const archivePaths = [
  appRoot,
  path.join(releaseRoot, 'install-smartshell.ps1'),
  path.join(releaseRoot, 'uninstall-smartshell.ps1')
]
  .map((item) => `'${item.replaceAll("'", "''")}'`)
  .join(',')
const zipResult = spawnSync(
  'powershell.exe',
  [
    '-NoProfile',
    '-Command',
    `Compress-Archive -Path @(${archivePaths}) -DestinationPath '${zipPath.replaceAll("'", "''")}' -Force`
  ],
  { stdio: 'inherit' }
)

if (zipResult.error || zipResult.status !== 0) {
  console.warn(`Portable app created at ${appRoot}`)
  console.warn('Zip archive was not created. You can zip the folder manually.')
} else {
  console.log(`Portable app created at ${appRoot}`)
  console.log(`Zip archive created at ${zipPath}`)
}
