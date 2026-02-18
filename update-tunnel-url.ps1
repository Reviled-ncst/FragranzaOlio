# Quick tunnel URL update script
# Usage: .\update-tunnel-url.ps1 https://your-new-url.trycloudflare.com

param(
    [Parameter(Mandatory=$true)]
    [string]$NewUrl,
    [switch]$Push = $false
)

$ErrorActionPreference = "Stop"

# Files to update
$proxyFile = "$PSScriptRoot\api\proxy.ts"
$imageFile = "$PSScriptRoot\api\image.ts"
$tunnelUrlFile = "$PSScriptRoot\tunnel-url.txt"

$urlPattern = "https://[a-z\-]+\.trycloudflare\.com"

Write-Host "Updating tunnel URL to: $NewUrl" -ForegroundColor Cyan

# Update proxy.ts
if (Test-Path $proxyFile) {
    $content = Get-Content $proxyFile -Raw
    $content = $content -replace $urlPattern, $NewUrl
    Set-Content $proxyFile -Value $content -NoNewline
    Write-Host "  Updated: api/proxy.ts" -ForegroundColor Green
}

# Update image.ts  
if (Test-Path $imageFile) {
    $content = Get-Content $imageFile -Raw
    $content = $content -replace $urlPattern, $NewUrl
    Set-Content $imageFile -Value $content -NoNewline
    Write-Host "  Updated: api/image.ts" -ForegroundColor Green
}

# Save reference
Set-Content $tunnelUrlFile -Value $NewUrl
Write-Host "  Saved: tunnel-url.txt" -ForegroundColor Green

if ($Push) {
    Write-Host ""
    Write-Host "Pushing to git..." -ForegroundColor Cyan
    Set-Location $PSScriptRoot
    git add api/proxy.ts api/image.ts tunnel-url.txt
    git commit -m "Update tunnel URL to $NewUrl"
    git push origin main
    Write-Host "Done! Vercel will redeploy." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "Files updated. Run with -Push to deploy, or:" -ForegroundColor Yellow
    Write-Host "  git add -A; git commit -m 'Update tunnel URL'; git push" -ForegroundColor White
}
