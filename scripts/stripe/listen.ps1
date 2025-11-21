# Uses your fixed Stripe CLI path
$ErrorActionPreference = 'Stop'
$Exe     = 'C:\stripe.exe'   # <— your path
$EnvFile = Join-Path $PSScriptRoot '..\..\server\.env' | Resolve-Path
$ForwardTo = 'http://localhost:4000/webhooks/stripe'
$Events    = 'checkout.session.completed'

if (-not (Test-Path $Exe)) { throw "Stripe CLI not found at $Exe" }
if (-not (Test-Path $EnvFile)) { New-Item -ItemType File -Path $EnvFile | Out-Null }

# Login if needed
try { & $Exe status | Out-Null } catch { & $Exe login }

# Get a fresh secret
$secret = & $Exe listen --print-secret
if (-not $secret -or $secret -notmatch '^whsec_') { throw "Failed to get webhook secret: $secret" }

# Replace/add in .env
$content = Get-Content $EnvFile -Raw -ErrorAction SilentlyContinue
$content = ($content -replace '^\s*STRIPE_WEBHOOK_SECRET\s*=.*\s*','')
if ($content.Length -gt 0 -and -not $content.EndsWith("`n")) { $content += "`n" }
$content += "STRIPE_WEBHOOK_SECRET=$secret`n"
Set-Content -Path $EnvFile -Value $content -NoNewline

Write-Host "Wrote STRIPE_WEBHOOK_SECRET to $EnvFile"
Write-Host "Forwarding $Events -> $ForwardTo (Ctrl+C to stop)"
& $Exe listen --events $Events --forward-to $ForwardTo
