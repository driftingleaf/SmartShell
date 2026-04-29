$ErrorActionPreference = 'Stop'

$InstallDir = Join-Path $env:LOCALAPPDATA 'Programs\SmartShell'
$DesktopShortcut = Join-Path ([Environment]::GetFolderPath('Desktop')) 'SmartShell.lnk'
$ProgramsShortcut = Join-Path (Join-Path ([Environment]::GetFolderPath('Programs')) 'SmartShell') 'SmartShell.lnk'
$ProgramsDir = Split-Path $ProgramsShortcut -Parent

foreach ($Path in @($DesktopShortcut, $ProgramsShortcut)) {
  if (Test-Path $Path) {
    Remove-Item $Path -Force
  }
}

if ((Test-Path $ProgramsDir) -and -not (Get-ChildItem $ProgramsDir)) {
  Remove-Item $ProgramsDir -Force
}

if (Test-Path $InstallDir) {
  Remove-Item $InstallDir -Recurse -Force
}

Write-Host 'SmartShell uninstalled.'
