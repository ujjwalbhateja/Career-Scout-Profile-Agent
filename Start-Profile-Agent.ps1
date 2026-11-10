param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$port = 5175
$localEnv = Join-Path $projectRoot '.env.local'
if (Test-Path -LiteralPath $localEnv) {
    $portLine = Get-Content -LiteralPath $localEnv | Where-Object { $_ -match '^PROFILE_WEB_PORT=' } | Select-Object -Last 1
    if ($portLine) {
        $configuredPort = ($portLine -split '=', 2)[1].Trim()
        if ($configuredPort -notmatch '^\d+$' -or [int]$configuredPort -lt 1 -or [int]$configuredPort -gt 65535) { throw 'PROFILE_WEB_PORT must be a valid TCP port.' }
        $port = [int]$configuredPort
    }
}
$linkFile = Join-Path $projectRoot ".local\web-access-$port.txt"
$listener = New-Object System.Net.Sockets.TcpClient
try {
    $connected = $listener.ConnectAsync('127.0.0.1', $port).Wait(500) -and $listener.Connected
} catch { $connected = $false } finally { $listener.Dispose() }
if ($connected) {
    if (-not (Test-Path -LiteralPath $linkFile)) { throw "Port $port is already in use. Stop that process before starting Profile Agent." }
    $existingLink = (Get-Content -LiteralPath $linkFile -Raw).Trim()
    if (-not $existingLink.StartsWith("http://127.0.0.1:$port/?access=")) { throw 'The saved local access link is invalid.' }
    $response = Invoke-WebRequest -Uri $existingLink -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 3 -ErrorAction SilentlyContinue
    $valid = $response -and $response.StatusCode -eq 302
    if (-not $valid) { throw "Port $port is in use, but the Profile Agent access link is stale. Stop that process and retry." }
    Write-Host "Career Scout Profile Agent website: $existingLink"
    if (-not $NoBrowser) { Start-Process -FilePath 'rundll32.exe' -ArgumentList @('url.dll,FileProtocolHandler', $existingLink) -WindowStyle Hidden }
    return
}
$nodePath = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $nodePath) {
    $nodePath = Join-Path $env:USERPROFILE 'job_search\.local\tools\node-x64\node-v22.14.0-win-x64\node.exe'
}
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Install Node.js 22.13 or newer, then run this launcher again.' }
Push-Location -LiteralPath $projectRoot
try {
    if ($NoBrowser) { & $nodePath --env-file-if-exists=.env.local src/web-server.mjs --no-browser }
    else { & $nodePath --env-file-if-exists=.env.local src/web-server.mjs }
} finally { Pop-Location }
