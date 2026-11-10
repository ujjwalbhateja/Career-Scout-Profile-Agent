param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$projectRoot = Join-Path $PSScriptRoot 'career-scout-app'
$url = 'http://127.0.0.1:5176/'
$nodePath = Get-Command node -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source -First 1
if (-not $nodePath) { $nodePath = Join-Path $env:USERPROFILE 'job_search\.local\tools\node-x64\node-v22.14.0-win-x64\node.exe' }
if (-not (Test-Path -LiteralPath $nodePath)) { throw 'Install Node.js 22.13 or newer.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot 'node_modules'))) { throw 'Install dependencies in career-scout-app with npm ci.' }
if (-not (Test-Path -LiteralPath (Join-Path $projectRoot '.env.local'))) { throw 'Create career-scout-app\.env.local with the Profile Agent provider settings.' }
$running = $false
try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; $running = $response.StatusCode -eq 200 } catch {}
if (-not $running) {
    $logDir = Join-Path $projectRoot '.local'
    New-Item -ItemType Directory -Path $logDir -Force | Out-Null
    $logOut = Join-Path $logDir 'profile-agent.stdout.log'
    $logErr = Join-Path $logDir 'profile-agent.stderr.log'
    Start-Process -FilePath $nodePath -ArgumentList @('scripts/start-pipeline.mjs') -WorkingDirectory $projectRoot -WindowStyle Hidden -RedirectStandardOutput $logOut -RedirectStandardError $logErr | Out-Null
    for ($attempt = 0; $attempt -lt 80; $attempt++) {
        Start-Sleep -Milliseconds 500
        try { $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 2; if ($response.StatusCode -eq 200) { $running = $true; break } } catch {}
    }
}
if (-not $running) { throw "Profile Agent did not start. Check $projectRoot\.local\profile-agent.stderr.log" }
Write-Host "Profile Agent website: $url"
if (-not $NoBrowser) { Start-Process -FilePath 'rundll32.exe' -ArgumentList @('url.dll,FileProtocolHandler', $url) -WindowStyle Hidden }
