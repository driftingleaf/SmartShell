$ErrorActionPreference = 'Stop'

$SourceDir = Join-Path $PSScriptRoot 'SmartShell-win32-x64'
$InstallDir = Join-Path $env:LOCALAPPDATA 'Programs\SmartShell'
$ExePath = Join-Path $InstallDir 'SmartShell.exe'
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'SmartShell.lnk'
$ProgramsDir = Join-Path ([Environment]::GetFolderPath('Programs')) 'SmartShell'
$ProgramsShortcut = Join-Path $ProgramsDir 'SmartShell.lnk'

if (-not (Test-Path $SourceDir)) {
  throw "Portable app folder not found: $SourceDir"
}

if (Test-Path $InstallDir) {
  Remove-Item $InstallDir -Recurse -Force
}

New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
Copy-Item -Path (Join-Path $SourceDir '*') -Destination $InstallDir -Recurse -Force
New-Item -ItemType Directory -Path $ProgramsDir -Force | Out-Null

$Shell = New-Object -ComObject WScript.Shell
foreach ($ShortcutPath in @($DesktopShortcut, $ProgramsShortcut)) {
  $Shortcut = $Shell.CreateShortcut($ShortcutPath)
  $Shortcut.TargetPath = $ExePath
  $Shortcut.WorkingDirectory = $InstallDir
  $Shortcut.Description = 'SmartShell'
  $Shortcut.Save()
}

Write-Host "SmartShell installed to $InstallDir"
Write-Host "Shortcuts created on Desktop and Start Menu."
