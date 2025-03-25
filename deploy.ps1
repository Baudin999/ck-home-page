# GitHub Pages Deployment Script
# This script deploys the current directory to GitHub Pages

# Configuration
$mainBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $mainBranch" -ForegroundColor Cyan

# Ensure we have the latest changes
Write-Host "Pulling latest changes from remote..." -ForegroundColor Cyan
git pull

# Create a temporary directory for deployment
$tempDir = "temp-deploy"
Write-Host "Creating temporary directory for deployment: $tempDir" -ForegroundColor Cyan

# Remove temp directory if it exists
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

# Create fresh temp directory
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copy deployment files to temp directory
Write-Host "Copying files to temporary directory..." -ForegroundColor Cyan
Copy-Item "app.js" -Destination $tempDir
Copy-Item "index.html" -Destination $tempDir
Copy-Item "mars.jpg" -Destination $tempDir
Copy-Item "styles.css" -Destination $tempDir

# Switch to gh-pages branch or create it if it doesn't exist
Write-Host "Checking for gh-pages branch..." -ForegroundColor Cyan
$branchExists = git show-ref --verify --quiet refs/heads/gh-pages

if ($branchExists -eq $false) {
    Write-Host "Creating gh-pages branch..." -ForegroundColor Green
    git checkout --orphan gh-pages
} else {
    Write-Host "Switching to gh-pages branch..." -ForegroundColor Green
    git checkout gh-pages
}

# Remove existing files from gh-pages branch
Write-Host "Cleaning gh-pages branch..." -ForegroundColor Cyan
Get-ChildItem -Path . -Exclude @(".git", $tempDir) | ForEach-Object {
    Remove-Item -Path $_.FullName -Recurse -Force
}

# Copy files from temp directory to root
Write-Host "Moving files from temporary directory to root..." -ForegroundColor Cyan
Get-ChildItem -Path $tempDir | ForEach-Object {
    Copy-Item -Path $_.FullName -Destination .
}

# Remove temp directory
Remove-Item -Path $tempDir -Recurse -Force

# Add all files to git
Write-Host "Adding files to git..." -ForegroundColor Cyan
git add .

# Commit changes
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Committing changes..." -ForegroundColor Cyan
git commit -m "Deploy to GitHub Pages: $timestamp"

# Push to GitHub Pages
Write-Host "Pushing to GitHub Pages..." -ForegroundColor Green
git push -u origin gh-pages

# Switch back to main branch
Write-Host "Switching back to $mainBranch branch..." -ForegroundColor Cyan
git checkout $mainBranch

Write-Host "Deployment complete! Your site should be available shortly at your GitHub Pages URL." -ForegroundColor Green
Write-Host "Typically: https://[username].github.io/[repository-name]/" -ForegroundColor Yellow
