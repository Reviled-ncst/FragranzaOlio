# Fragranza Cloudflare Tunnel Auto-Updater
# This script starts cloudflared, detects the tunnel URL, and auto-updates the codebase

param(
    [switch]$AutoPush = $false,  # Add -AutoPush to automatically git push after URL update
    [switch]$Watch = $false       # Add -Watch to continuously monitor for URL changes
)

$ErrorActionPreference = "Continue"

# Colors for output
function Write-Success { param($msg) Write-Host $msg -ForegroundColor Green }
function Write-Info { param($msg) Write-Host $msg -ForegroundColor Cyan }
function Write-Warn { param($msg) Write-Host $msg -ForegroundColor Yellow }
function Write-Err { param($msg) Write-Host $msg -ForegroundColor Red }

# Files that contain the tunnel URL
$proxyFile = "$PSScriptRoot\api\proxy.ts"
$imageFile = "$PSScriptRoot\api\image.ts"
$tunnelUrlFile = "$PSScriptRoot\tunnel-url.txt"

# Current URL pattern to find
$urlPattern = "https://[a-z\-]+\.trycloudflare\.com"

function Get-CurrentTunnelUrl {
    if (Test-Path $proxyFile) {
        $content = Get-Content $proxyFile -Raw
        if ($content -match "($urlPattern)") {
            return $matches[1]
        }
    }
    return $null
}

function Update-TunnelUrl {
    param([string]$NewUrl)
    
    $oldUrl = Get-CurrentTunnelUrl
    if (-not $oldUrl) {
        Write-Err "Could not find current tunnel URL in proxy.ts"
        return $false
    }
    
    if ($oldUrl -eq $NewUrl) {
        Write-Info "Tunnel URL unchanged: $NewUrl"
        return $false
    }
    
    Write-Info "Updating tunnel URL..."
    Write-Info "  Old: $oldUrl"
    Write-Success "  New: $NewUrl"
    
    # Update proxy.ts
    if (Test-Path $proxyFile) {
        $content = Get-Content $proxyFile -Raw
        $content = $content -replace $urlPattern, $NewUrl
        Set-Content $proxyFile -Value $content -NoNewline
        Write-Success "  Updated: api/proxy.ts"
    }
    
    # Update image.ts
    if (Test-Path $imageFile) {
        $content = Get-Content $imageFile -Raw
        $content = $content -replace $urlPattern, $NewUrl
        Set-Content $imageFile -Value $content -NoNewline
        Write-Success "  Updated: api/image.ts"
    }
    
    # Save to tunnel-url.txt for reference
    Set-Content $tunnelUrlFile -Value $NewUrl
    
    return $true
}

function Push-Changes {
    Write-Info "Committing and pushing changes..."
    
    Set-Location $PSScriptRoot
    git add api/proxy.ts api/image.ts tunnel-url.txt 2>$null
    $commitResult = git commit -m "Auto-update tunnel URL to $(Get-Content $tunnelUrlFile)" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        git push origin main 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Changes pushed! Vercel will redeploy automatically."
        } else {
            Write-Err "Git push failed"
        }
    } else {
        Write-Warn "No changes to commit (URL may not have changed)"
    }
}

function Start-TunnelWithMonitor {
    Write-Info "Starting Cloudflare Tunnel..."
    Write-Info "Monitoring for tunnel URL..."
    Write-Host ""
    
    # Start cloudflared and capture output
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "cloudflared"
    $psi.Arguments = "tunnel --url http://localhost:80"
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $false
    
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $psi
    
    # Event handler for stderr (cloudflared outputs URL to stderr)
    $urlFound = $false
    
    $process.Start() | Out-Null
    
    Write-Info "Cloudflared started (PID: $($process.Id))"
    Write-Info "Waiting for tunnel URL..."
    Write-Host ""
    
    # Read stderr line by line
    while (-not $process.HasExited) {
        $line = $process.StandardError.ReadLine()
        if ($line) {
            # Look for the tunnel URL
            if ($line -match "($urlPattern)") {
                $newUrl = $matches[1]
                Write-Host ""
                Write-Success "========================================="
                Write-Success "  TUNNEL URL DETECTED!"
                Write-Success "  $newUrl"
                Write-Success "========================================="
                Write-Host ""
                
                $updated = Update-TunnelUrl -NewUrl $newUrl
                
                if ($updated -and $AutoPush) {
                    Push-Changes
                } elseif ($updated) {
                    Write-Warn "Run with -AutoPush to automatically deploy, or manually:"
                    Write-Host "  git add -A; git commit -m 'Update tunnel URL'; git push"
                }
                
                $urlFound = $true
                
                if (-not $Watch) {
                    Write-Host ""
                    Write-Info "Tunnel is running. Press Ctrl+C to stop."
                }
            }
            
            # Show cloudflared output
            if ($line -match "error|fail|warn" -and $line -notmatch "graceful") {
                Write-Warn $line
            }
        }
        Start-Sleep -Milliseconds 100
    }
    
    if (-not $urlFound) {
        Write-Err "Tunnel exited without providing a URL"
    }
}

# Main execution
Write-Host ""
Write-Host "============================================" -ForegroundColor Magenta
Write-Host "  Fragranza Cloudflare Tunnel Manager" -ForegroundColor Magenta
Write-Host "============================================" -ForegroundColor Magenta
Write-Host ""

$currentUrl = Get-CurrentTunnelUrl
if ($currentUrl) {
    Write-Info "Current tunnel URL: $currentUrl"
}
Write-Host ""

if ($AutoPush) {
    Write-Warn "Auto-push enabled: Changes will be pushed to git automatically"
}

Write-Host ""

# Start the tunnel
Start-TunnelWithMonitor
