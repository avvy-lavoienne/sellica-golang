# SELLY Phase 1 Static Deployment Preparation - Simplified
Write-Host "🚀 SELLY Phase 1 Static Deployment Preparation" -ForegroundColor Green

# Create deployment directory
$deployDir = "deployment/static-build"
if (Test-Path $deployDir) {
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir -Force | Out-Null

Write-Host "📁 Created deployment directory: $deployDir" -ForegroundColor Yellow

# Copy HTML files
Write-Host "📄 Copying HTML files..." -ForegroundColor Yellow
Copy-Item -Path "frontend/.next/server/app/*" -Destination $deployDir -Recurse -Force
Write-Host "   ✅ HTML files copied" -ForegroundColor Green

# Create _next directory and copy static assets
New-Item -ItemType Directory -Path "$deployDir/_next" -Force | Out-Null
Write-Host "🎨 Copying static assets..." -ForegroundColor Yellow
Copy-Item -Path "frontend/.next/static" -Destination "$deployDir/_next/" -Recurse -Force
Write-Host "   ✅ Static assets copied" -ForegroundColor Green

# Copy public assets
Write-Host "🖼️ Copying public assets..." -ForegroundColor Yellow
Copy-Item -Path "frontend/public/*" -Destination $deployDir -Recurse -Force
Write-Host "   ✅ Public assets copied" -ForegroundColor Green

# Create _redirects file for Netlify/Cloudflare Pages
$redirectsContent = "# SPA Routing`n/*    /index.html   200`n`n# API routes to Go backend`n/api/*  http://localhost:8080/api/:splat  200"
Set-Content -Path "$deployDir/_redirects" -Value $redirectsContent
Write-Host "   ✅ Created _redirects file" -ForegroundColor Green

# Create .htaccess for Apache
$htaccessContent = @"
RewriteEngine On
RewriteBase /
RewriteRule ^index\.html$ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
"@
Set-Content -Path "$deployDir/.htaccess" -Value $htaccessContent
Write-Host "   ✅ Created .htaccess file" -ForegroundColor Green

# Count files and calculate size
$files = Get-ChildItem -Path $deployDir -Recurse -File
$totalFiles = $files.Count
$totalSize = [math]::Round(($files | Measure-Object -Property Length -Sum).Sum / 1MB, 2)

Write-Host ""
Write-Host "🎉 Deployment preparation completed!" -ForegroundColor Green
Write-Host "📊 Total files: $totalFiles" -ForegroundColor Cyan
Write-Host "📊 Total size: $totalSize MB" -ForegroundColor Cyan
Write-Host "📁 Deployment ready in: $deployDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "🚀 Ready for CDN deployment!" -ForegroundColor Green
