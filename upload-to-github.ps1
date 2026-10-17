param(
    [string]$RepoName = "CoThread",
    [string]$CollaboratorUsername = "hasnain-kk",
    [string]$CollaboratorEmail = "hasnainrashi@gmail.com"
)

$ErrorActionPreference = "Stop"

# 1. Load GITHUB_TOKEN from .env or environment without printing it
$EnvFile = Join-Path $PSScriptRoot ".env"
$Token = $env:GITHUB_TOKEN

if (-not $Token -and (Test-Path $EnvFile)) {
    $lines = Get-Content $EnvFile
    foreach ($line in $lines) {
        if ($line -match "^\s*GITHUB_TOKEN\s*=\s*(.+)\s*$") {
            $Token = $Matches[1].Trim().Trim('"').Trim("'")
        }
    }
}

if (-not $Token) {
    Write-Error "GITHUB_TOKEN is not set in $EnvFile. Please save your GitHub Personal Access Token to .env first."
    exit 1
}

$Headers = @{
    "Authorization" = "Bearer $Token"
    "Accept"        = "application/vnd.github+json"
    "User-Agent"    = "CoThread-AIBuilderCup-Uploader"
    "X-GitHub-Api-Version" = "2022-11-28"
}

# 2. Get Authenticated GitHub User
Write-Host "1. Verifying GitHub account..." -ForegroundColor Cyan
$Me = Invoke-RestMethod -Uri "https://api.github.com/user" -Method Get -Headers $Headers
$Owner = $Me.login
Write-Host "   Authenticated as: $Owner ($($Me.html_url))" -ForegroundColor Green

# 3. Create or Get Public Repository 'Aibuildercup'
Write-Host "2. Ensuring public repository '$Owner/$RepoName' exists..." -ForegroundColor Cyan
$RepoExists = $false
try {
    $Repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName" -Method Get -Headers $Headers
    $RepoExists = $true
    Write-Host "   Repository already exists: $($Repo.html_url)" -ForegroundColor Yellow
} catch {
    $RepoExists = $false
}

$RepoDescription = 'CoThread - Enterprise Collaborative AI Platform on Google Cloud Run, Firestore, Google ADK & MCP. Turn single-player AI (Claude, ChatGPT, Gemini) into live /s/ rooms on Host-Sponsored Token Quotas. Project Lead, Principal AI Architect: Robina Mirbahar (@RobinaMirbahar) | Original Idea, Co-Builder & Collaborator: Muhammad Hasnain (@hasnain-kk)'

if (-not $RepoExists) {
    $CreateBody = @{
        name        = $RepoName
        description = $RepoDescription
        private     = $false
        auto_init   = $true
    } | ConvertTo-Json
    $Repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $Headers -Body $CreateBody -ContentType "application/json"
    Write-Host "   Created public repository: $($Repo.html_url)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    $PatchBody = @{
        description = $RepoDescription
    } | ConvertTo-Json
    $Repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName" -Method Patch -Headers $Headers -Body $PatchBody -ContentType "application/json"
    Write-Host "   Updated repository description with Project Lead Robina Mirbahar & Original Idea / Co-Builder Muhammad Hasnain" -ForegroundColor Green
}

# 4. Upload all project files via GitHub Contents API (Zero git.exe dependency!)
Write-Host "3. Uploading project files from $PSScriptRoot to $Owner/$RepoName..." -ForegroundColor Cyan

$ExcludeDirs = @("node_modules", ".git", ".gemini")
$ExcludeFiles = @(".env", ".env.local")

$Files = Get-ChildItem -Path $PSScriptRoot -Recurse -File -Force | Where-Object {
    $rel = $_.FullName.Substring($PSScriptRoot.Length + 1).Replace("\", "/")
    $parts = $rel.Split("/")
    $skipDir = $false
    foreach ($d in $ExcludeDirs) {
        if ($parts -contains $d) { $skipDir = $true; break }
    }
    (-not $skipDir) -and ($ExcludeFiles -notcontains $_.Name)
}

foreach ($File in $Files) {
    $RelPath = $File.FullName.Substring($PSScriptRoot.Length + 1).Replace("\", "/")
    $Bytes = [System.IO.File]::ReadAllBytes($File.FullName)
    $Base64 = [Convert]::ToBase64String($Bytes)

    $ApiUrl = "https://api.github.com/repos/$Owner/$RepoName/contents/$RelPath"
    $ExistingSha = $null
    try {
        $Existing = Invoke-RestMethod -Uri $ApiUrl -Method Get -Headers $Headers
        $ExistingSha = $Existing.sha
    } catch {
        $ExistingSha = $null
    }

    $Payload = @{
        message = "Upload $RelPath (CoThread - AI Builder Cup 2026)"
        content = $Base64
    }
    if ($ExistingSha) {
        $Payload["sha"] = $ExistingSha
    }

    $BodyJson = $Payload | ConvertTo-Json -Compress
    Invoke-RestMethod -Uri $ApiUrl -Method Put -Headers $Headers -Body $BodyJson -ContentType "application/json" | Out-Null
    Write-Host "   Uploaded: $RelPath" -ForegroundColor Gray
}

# 5. Add Muhammad Hasnain (hasnain-kk) as a Collaborator
Write-Host "4. Inviting collaborator '$CollaboratorUsername' ($CollaboratorEmail)..." -ForegroundColor Cyan
$CollabUrl = "https://api.github.com/repos/$Owner/$RepoName/collaborators/$CollaboratorUsername"
$CollabBody = @{
    permission = "push"
} | ConvertTo-Json

try {
    Invoke-RestMethod -Uri $CollabUrl -Method Put -Headers $Headers -Body $CollabBody -ContentType "application/json" | Out-Null
    Write-Host "   Collaborator invitation sent to https://github.com/$CollaboratorUsername ($CollaboratorEmail)!" -ForegroundColor Green
} catch {
    Write-Warning "Could not invite collaborator '$CollaboratorUsername': $($_.Exception.Message)"
}

Write-Host ""
Write-Host "==============================================================" -ForegroundColor Green
Write-Host "SUCCESS! Repository Live at: https://github.com/$Owner/$RepoName" -ForegroundColor Green
Write-Host "Collaborator Invited:        https://github.com/$CollaboratorUsername" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
