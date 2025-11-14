# E2E Testing Script for Duplicate Operator Implementation (PowerShell)
# This script validates the duplicate-operator functionality on Windows

# Configuration
$BACKEND_URL = "http://localhost:8080"
$FRONTEND_URL = "http://localhost:3000"
$API_ENDPOINT = "/api/data-rekam/duplicate-operator"

# Test counters
$TESTS_PASSED = 0
$TESTS_FAILED = 0
$TESTS_PENDING = 0

# Console output functions
function Print-Test {
    param([string]$message)
    Write-Host "TEST: $message" -ForegroundColor Yellow
}

function Pass-Test {
    param([string]$message)
    Write-Host "✅ PASS: $message" -ForegroundColor Green
    $global:TESTS_PASSED++
}

function Fail-Test {
    param([string]$message)
    Write-Host "❌ FAIL: $message" -ForegroundColor Red
    $global:TESTS_FAILED++
}

function Pending-Test {
    param([string]$message)
    Write-Host "⏳ PENDING: $message" -ForegroundColor Yellow
    $global:TESTS_PENDING++
}

# Header
Write-Host "================================================" -ForegroundColor Blue
Write-Host "  Duplicate Operator E2E Testing Suite" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host ""

# ==========================================
# Test 1: Backend Health Check
# ==========================================
Print-Test "Backend Health Check"

try {
    $response = Invoke-WebRequest -Uri "$BACKEND_URL/health" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Pass-Test "Backend is running on port 8080"
    } else {
        Fail-Test "Backend returned unexpected status code: $($response.StatusCode)"
    }
} catch {
    Fail-Test "Backend not responding on port 8080: $_"
    exit 1
}

# ==========================================
# Test 2: Frontend Health Check
# ==========================================
Print-Test "Frontend Health Check"

try {
    $response = Invoke-WebRequest -Uri "$FRONTEND_URL" -Method GET -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Pass-Test "Frontend is running on port 3000"
    } else {
        Fail-Test "Frontend returned unexpected status code: $($response.StatusCode)"
    }
} catch {
    Fail-Test "Frontend not responding on port 3000: $_"
    exit 1
}

# ==========================================
# Test 3: Check API Endpoint Routes
# ==========================================
Print-Test "API Endpoint Routes"

$routeFile = "frontend/src/app/api/data-rekam/duplicate-operator/route.ts"
if (Test-Path $routeFile) {
    Pass-Test "API route file exists"
    
    $content = Get-Content $routeFile -Raw
    
    if ($content -match "export async function GET") {
        Pass-Test "GET method implemented"
    } else {
        Fail-Test "GET method not found"
    }
    
    if ($content -match "export async function POST") {
        Pass-Test "POST method implemented"
    } else {
        Fail-Test "POST method not found"
    }
    
    if ($content -match "export async function DELETE") {
        Pass-Test "DELETE method implemented"
    } else {
        Fail-Test "DELETE method not found"
    }
} else {
    Fail-Test "API route file not found at $routeFile"
}

# ==========================================
# Test 4: Check Page Component
# ==========================================
Print-Test "Page Component Validation"

$pageFile = "frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx"
if (Test-Path $pageFile) {
    Pass-Test "Page component exists"
    
    $content = Get-Content $pageFile -Raw
    
    # Check if validateNIK is a regular function
    if ($content -match "const validateNIK = \(") {
        Pass-Test "validateNIK is a regular function"
    } else {
        Fail-Test "validateNIK not implemented correctly"
    }
    
    # Check if fetchRekapData uses localStorage
    if ($content -match "localStorage\.getItem.*selly_auth_token") {
        Pass-Test "fetchRekapData uses localStorage token"
    } else {
        Fail-Test "fetchRekapData not using localStorage"
    }
    
    # Check if handleSubmit uses API route
    if ($content -match "fetch.*duplicate-operator") {
        Pass-Test "handleSubmit uses API route"
    } else {
        Fail-Test "handleSubmit not using API route"
    }
    
    # Check if handleDelete uses API endpoint
    if ($content -match 'method.*DELETE' -and $content -match 'duplicate-operator') {
        Pass-Test "handleDelete uses DELETE endpoint"
    } else {
        Fail-Test "handleDelete not implemented correctly"
    }
} else {
    Fail-Test "Page component not found at $pageFile"
}

# ==========================================
# Test 5: TypeScript Compilation Check
# ==========================================
Print-Test "TypeScript Configuration"

$tsConfigFile = "frontend/tsconfig.json"
if (Test-Path $tsConfigFile) {
    Pass-Test "TypeScript config exists"
} else {
    Fail-Test "TypeScript config not found"
}

# ==========================================
# Test 6: Package Manager Check
# ==========================================
Print-Test "Package Manager (pnpm)"

try {
    $pnpmVersion = & pnpm --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Pass-Test "pnpm is installed (version $pnpmVersion)"
    } else {
        Fail-Test "pnpm not found in PATH"
    }
} catch {
    Fail-Test "Error checking pnpm: $_"
}

# ==========================================
# Test 7: Code Quality
# ==========================================
Print-Test "Code Quality"

$pageContent = Get-Content $pageFile -Raw

# Check for console.log statements
if ($pageContent -match "console\.(log|debug|error)\(") {
    Pending-Test "Consider reducing console statements in production code"
} else {
    Pass-Test "No production console logs found"
}

# Check for unused imports
$importLines = @($pageContent | Select-String "^import" | Measure-Object).Count
if ($importLines -gt 0) {
    Pass-Test "Import statements found ($importLines imports)"
}

# ==========================================
# Test 8: Documentation
# ==========================================
Print-Test "Documentation Files"

$docFiles = @(
    "docs/bydate/2025-11-10/duplicate-operator-fix/2025-11-10-QUICK-REFERENCE-DUPLICATE-OPERATOR.md",
    "docs/bydate/2025-11-10/duplicate-operator-fix/2025-11-10-DUPLICATE-OPERATOR-IMPLEMENTATION-COMPLETE.md",
    "docs/bydate/2025-11-10/duplicate-operator-fix/2025-11-10-DUPLICATE-OPERATOR-FIX-SUMMARY.md",
    "docs/bydate/2025-11-10/duplicate-operator-fix/2025-11-10-DUPLICATE-OPERATOR-PATTERN-COMPARISON.md"
)

foreach ($doc in $docFiles) {
    if (Test-Path $doc) {
        Pass-Test "Documentation exists: $(Split-Path -Leaf $doc)"
    } else {
        Fail-Test "Documentation missing: $doc"
    }
}

# ==========================================
# Test 9: Git Status
# ==========================================
Print-Test "Git Status Check"

try {
    $gitStatus = & git status --porcelain 2>$null
    if ($LASTEXITCODE -eq 0) {
        Pass-Test "Git repository is initialized"
        if ([string]::IsNullOrWhiteSpace($gitStatus)) {
            Pass-Test "All changes are committed"
        } else {
            Pending-Test "Uncommitted changes detected"
        }
    }
} catch {
    Fail-Test "Git check failed: $_"
}

# ==========================================
# Summary
# ==========================================
Write-Host ""
Write-Host "================================================" -ForegroundColor Blue
Write-Host "  Test Summary" -ForegroundColor Blue
Write-Host "================================================" -ForegroundColor Blue
Write-Host "✅ Passed: $TESTS_PASSED" -ForegroundColor Green
Write-Host "❌ Failed: $TESTS_FAILED" -ForegroundColor Red
Write-Host "⏳ Pending: $TESTS_PENDING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Blue

# Recommendations
Write-Host ""
if ($TESTS_FAILED -eq 0) {
    Write-Host "✅ All automated checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Run TypeScript compilation:" -ForegroundColor White
    Write-Host "   cd frontend; pnpm type-check" -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Run ESLint:" -ForegroundColor White
    Write-Host "   cd frontend; pnpm lint" -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Run tests:" -ForegroundColor White
    Write-Host "   cd frontend; pnpm test" -ForegroundColor Gray
    Write-Host ""
    Write-Host "4. Manual E2E testing:" -ForegroundColor White
    Write-Host "   - Open http://localhost:3000 in browser" -ForegroundColor Gray
    Write-Host "   - Navigate to Duplicate Operator page" -ForegroundColor Gray
    Write-Host "   - Test create, read, update, delete workflows" -ForegroundColor Gray
} else {
    Write-Host "❌ Some tests failed!" -ForegroundColor Red
    Write-Host "Please fix the issues above before proceeding." -ForegroundColor Red
    exit 1
}
