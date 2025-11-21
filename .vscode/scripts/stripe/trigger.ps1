$ErrorActionPreference = 'Stop'
$Exe = 'C:\stripe.exe'   # <— your path
if (-not (Test-Path $Exe)) { throw "Stripe CLI not found at $Exe" }
& $Exe trigger checkout.session.completed
