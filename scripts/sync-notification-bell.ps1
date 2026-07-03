# Syncs notification bell component + types from user-web to other apps.
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "apps\user-web\src\app\shared\notification-bell"

$apps = @(
  'admin-web','doctor-web','operations-web','user-web'
)

foreach ($app in $apps) {
  $bellDst = Join-Path $root "apps\$app\src\app\shared\notification-bell"
  if (Test-Path $bellDst) {
    Copy-Item (Join-Path $source "notification-bell.component.ts") $bellDst -Force
    Copy-Item (Join-Path $source "types.ts") $bellDst -Force
    Write-Host "Synced bell -> $app"
  }
  $pkg = Join-Path $root "apps\$app\package.json"
  if (Test-Path $pkg) {
    $json = Get-Content $pkg -Raw | ConvertFrom-Json
    if (-not $json.dependencies.'socket.io-client') {
      $json.dependencies | Add-Member -NotePropertyName 'socket.io-client' -NotePropertyValue '^4.8.1' -Force
      $json | ConvertTo-Json -Depth 10 | Set-Content $pkg
      Write-Host "Added socket.io-client -> $app"
    }
  }
}

Write-Host 'Done.'
