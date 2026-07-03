# Syncs notification bell component + types from user-web to all other apps.
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root "apps\user-web\src\app\shared\notification-bell"

$apps = @(
  'admin-web','doctor-web','store','store-manager-web','hr-web','receptionist-web',
  'clinic-manager-web','accountant-web','supplier-web','warehouse-web','delivery-web',
  'diagnostic-web','branch-owner-web','coordinator-web','callcenter-web','marketing-web',
  'corporate-wellness-web','insurance-web'
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
  $hostPath = Join-Path $root "apps\$app\src\app\shared\notification-bell-host\notification-bell-host.ts"
  if (Test-Path $hostPath) {
    $content = Get-Content $hostPath -Raw
    if ($content -notmatch 'socketEnabled') {
      if ($app -eq 'store') {
        $content = $content -replace "apiPath: '/store/notifications'", "apiPath: '/store/notifications',`n    socketEnabled: true,`n    socketAuth: 'store-staff' as const"
      } else {
        $content = $content -replace "apiPath: '/notifications'", "apiPath: '/notifications',`n    socketEnabled: true,`n    socketAuth: 'user' as const"
      }
      Set-Content $hostPath $content
      Write-Host "Updated host -> $app"
    }
  }
}

Write-Host 'Done.'
