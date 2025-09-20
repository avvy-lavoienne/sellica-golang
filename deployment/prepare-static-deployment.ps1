# SELLY Phase 1 Static Deployment Preparation Script
# This script prepares all static files for CDN deployment

Write-Host "🚀 SELLY Phase 1 Static Deployment Preparation" -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# Create deployment directory structure
$deploymentDir = "deployment/static-build"
$frontendDir = "frontend"

Write-Host "📁 Creating deployment directory structure..." -ForegroundColor Yellow

# Remove existing deployment directory if it exists
if (Test-Path $deploymentDir) {
    Remove-Item -Path $deploymentDir -Recurse -Force
    Write-Host "   ✅ Cleaned existing deployment directory" -ForegroundColor Green
}

# Create new deployment directory
New-Item -ItemType Directory -Path $deploymentDir -Force | Out-Null
New-Item -ItemType Directory -Path "$deploymentDir/_next" -Force | Out-Null
New-Item -ItemType Directory -Path "$deploymentDir/_next/static" -Force | Out-Null

Write-Host "   ✅ Created deployment directory structure" -ForegroundColor Green

# Copy HTML files from .next/server/app/
Write-Host "📄 Copying HTML files..." -ForegroundColor Yellow

# Copy root index.html
if (Test-Path "$frontendDir/.next/server/app/index.html") {
    Copy-Item -Path "$frontendDir/.next/server/app/index.html" -Destination "$deploymentDir/index.html"
    Write-Host "   ✅ Copied root index.html" -ForegroundColor Green
}

# Copy all HTML files and maintain directory structure
$htmlFiles = Get-ChildItem -Path "$frontendDir/.next/server/app" -Recurse -Filter "*.html"
foreach ($file in $htmlFiles) {
    $relativePath = $file.FullName.Replace((Resolve-Path "$frontendDir/.next/server/app").Path, "").TrimStart('\')
    $destinationPath = Join-Path $deploymentDir $relativePath
    $destinationDir = Split-Path $destinationPath -Parent
    
    # Create directory if it doesn't exist
    if (!(Test-Path $destinationDir)) {
        New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
    }
    
    # Copy the HTML file
    Copy-Item -Path $file.FullName -Destination $destinationPath
}

Write-Host "   ✅ Copied $(($htmlFiles | Measure-Object).Count) HTML files" -ForegroundColor Green

# Copy static assets from .next/static/
Write-Host "🎨 Copying static assets..." -ForegroundColor Yellow

if (Test-Path "$frontendDir/.next/static") {
    Copy-Item -Path "$frontendDir/.next/static/*" -Destination "$deploymentDir/_next/static/" -Recurse -Force
    $staticFiles = Get-ChildItem -Path "$frontendDir/.next/static" -Recurse -File
    Write-Host "   ✅ Copied $(($staticFiles | Measure-Object).Count) static asset files" -ForegroundColor Green
}

# Copy public directory assets
Write-Host "🖼️ Copying public assets..." -ForegroundColor Yellow

if (Test-Path "$frontendDir/public") {
    $publicFiles = Get-ChildItem -Path "$frontendDir/public" -Recurse -File
    foreach ($file in $publicFiles) {
        $relativePath = $file.FullName.Replace((Resolve-Path "$frontendDir/public").Path, "").TrimStart('\')
        $destinationPath = Join-Path $deploymentDir $relativePath
        $destinationDir = Split-Path $destinationPath -Parent
        
        # Create directory if it doesn't exist
        if (!(Test-Path $destinationDir)) {
            New-Item -ItemType Directory -Path $destinationDir -Force | Out-Null
        }
        
        # Copy the file
        Copy-Item -Path $file.FullName -Destination $destinationPath
    }
    Write-Host "   ✅ Copied $(($publicFiles | Measure-Object).Count) public asset files" -ForegroundColor Green
}

# Create _redirects file for SPA routing (Netlify/Cloudflare Pages)
Write-Host "🔄 Creating routing configuration..." -ForegroundColor Yellow

$redirectsContent = @'
# SPA Routing - Serve index.html for all routes
/*    /index.html   200

# API routes should go to Go backend
/api/*  http://localhost:8080/api/:splat  200
'@

Set-Content -Path "$deploymentDir/_redirects" -Value $redirectsContent
Write-Host "   ✅ Created _redirects file for SPA routing" -ForegroundColor Green

# Create .htaccess file for Apache servers
$htaccessContent = @'
# SELLY Static Frontend - Apache Configuration
RewriteEngine On

# Handle Angular and React Router
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]

# Cache static assets
<IfModule mod_expires.c>
    ExpiresActive on
    ExpiresByType text/css "access plus 1 year"
    ExpiresByType application/javascript "access plus 1 year"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpg "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
    ExpiresByType font/woff "access plus 1 year"
    ExpiresByType font/woff2 "access plus 1 year"
</IfModule>

# Security headers
<IfModule mod_headers.c>
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
'@

Set-Content -Path "$deploymentDir/.htaccess" -Value $htaccessContent
Write-Host "   ✅ Created .htaccess file for Apache servers" -ForegroundColor Green

# Create deployment summary
Write-Host "📊 Generating deployment summary..." -ForegroundColor Yellow

$totalFiles = (Get-ChildItem -Path $deploymentDir -Recurse -File | Measure-Object).Count
$totalSize = [math]::Round((Get-ChildItem -Path $deploymentDir -Recurse -File | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

$currentDate = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
$htmlCount = if ($htmlFiles) { ($htmlFiles | Measure-Object).Count } else { 0 }
$staticCount = if (Test-Path "$frontendDir/.next/static") { ($staticFiles | Measure-Object).Count } else { 0 }
$publicCount = if (Test-Path "$frontendDir/public") { ($publicFiles | Measure-Object).Count } else { 0 }

$summaryContent = @"
# SELLY Phase 1 Static Deployment Summary
Generated: $currentDate

## Deployment Statistics
- Total Files: $totalFiles
- Total Size: $totalSize MB
- HTML Pages: $htmlCount
- Static Assets: $staticCount
- Public Assets: $publicCount

## Deployment Ready
✅ All static files prepared for CDN deployment
✅ SPA routing configuration created
✅ Caching headers configured
✅ Security headers configured

## Next Steps
1. Upload contents of '$deploymentDir' to your CDN
2. Configure custom domain (optional)
3. Test deployment functionality
4. Monitor performance metrics
"@

Set-Content -Path "$deploymentDir/DEPLOYMENT-SUMMARY.md" -Value $summaryContent
Write-Host "   ✅ Created deployment summary" -ForegroundColor Green

Write-Host ""
Write-Host "🎉 Static deployment preparation completed!" -ForegroundColor Green
Write-Host "📁 Deployment files ready in: $deploymentDir" -ForegroundColor Cyan
Write-Host "📊 Total files: $totalFiles ($totalSize MB)" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Ready for CDN deployment!" -ForegroundColor Green
