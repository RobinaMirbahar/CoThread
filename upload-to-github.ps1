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

# 3. Create or Get Public Repository 'CoThread'
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
$RepoHomepage = 'https://robinamirbahar.github.io/CoThread/'

if (-not $RepoExists) {
    $CreateBody = @{
        name        = $RepoName
        description = $RepoDescription
        homepage    = $RepoHomepage
        private     = $false
        auto_init   = $true
    } | ConvertTo-Json
    $Repo = Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Method Post -Headers $Headers -Body $CreateBody -ContentType "application/json"
    Write-Host "   Created public repository: $($Repo.html_url)" -ForegroundColor Green
    Start-Sleep -Seconds 2
} else {
    $PatchBody = @{
        description = $RepoDescription
        homepage    = $RepoHomepage
    } | ConvertTo-Json
    $Repo = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName" -Method Patch -Headers $Headers -Body $PatchBody -ContentType "application/json"
    Write-Host "   Updated repository description & live homepage ($RepoHomepage)" -ForegroundColor Green
}

# 4. Upload all project files in ONE single atomic commit via GitHub Git Data API
Write-Host "3. Uploading project files in a single atomic commit to $Owner/$RepoName..." -ForegroundColor Cyan

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

$Ref = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/git/ref/heads/main" -Method Get -Headers $Headers
$LatestCommitSha = $Ref.object.sha
$LatestCommit = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/git/commits/$LatestCommitSha" -Method Get -Headers $Headers
$BaseTreeSha = $LatestCommit.tree.sha

$TreeItems = @()
foreach ($File in $Files) {
    $RelPath = $File.FullName.Substring($PSScriptRoot.Length + 1).Replace("\", "/")
    $Bytes = [System.IO.File]::ReadAllBytes($File.FullName)
    $Base64 = [Convert]::ToBase64String($Bytes)

    $BlobBody = @{
        content  = $Base64
        encoding = "base64"
    } | ConvertTo-Json -Compress

    $Blob = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/git/blobs" -Method Post -Headers $Headers -Body $BlobBody -ContentType "application/json"
    $TreeItems += @{
        path = $RelPath
        mode = "100644"
        type = "blob"
        sha  = $Blob.sha
    }
    Write-Host "   Staged blob: $RelPath" -ForegroundColor Gray
}

$TreePayload = @{
    base_tree = $BaseTreeSha
    tree      = $TreeItems
} | ConvertTo-Json -Depth 5 -Compress

$NewTree = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/git/trees" -Method Post -Headers $Headers -Body $TreePayload -ContentType "application/json"

$CommitPayload = @{
    message = "Deploy CoThread with fixed GitHub Pages CSS/JS asset paths, .nojekyll, socials & Gemini Agent"
    tree    = $NewTree.sha
    parents = @($LatestCommitSha)
} | ConvertTo-Json -Compress

$NewCommit = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/git/commits" -Method Post -Headers $Headers -Body $CommitPayload -ContentType "application/json"

$UpdateRefPayload = @{
    sha   = $NewCommit.sha
    force = $true
} | ConvertTo-Json -Compress

Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/git/refs/heads/main" -Method Patch -Headers $Headers -Body $UpdateRefPayload -ContentType "application/json" | Out-Null
Write-Host "   Committed & pushed single atomic commit: $($NewCommit.sha)" -ForegroundColor Green

# Trigger a clean GitHub Pages build
try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/pages/builds" -Method Post -Headers $Headers | Out-Null
    Write-Host "   Triggered GitHub Pages build for $RepoHomepage" -ForegroundColor Green
} catch {
    Write-Host "   GitHub Pages build automatically queued." -ForegroundColor Yellow
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
Write-Host "Live Website (GitHub Pages): $RepoHomepage" -ForegroundColor Green
Write-Host "==============================================================" -ForegroundColor Green
