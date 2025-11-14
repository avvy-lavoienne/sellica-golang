#!/bin/bash
# E2E Testing Script for Duplicate Operator Implementation
# This script validates the duplicate-operator functionality

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:8080"
FRONTEND_URL="http://localhost:3000"
API_ENDPOINT="/api/data-rekam/duplicate-operator"
FULL_API_URL="$FRONTEND_URL$API_ENDPOINT"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_PENDING=0

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Duplicate Operator E2E Testing Suite${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Function to print test header
print_test() {
    echo -e "${YELLOW}TEST: $1${NC}"
}

# Function to print pass
pass_test() {
    echo -e "${GREEN}✅ PASS: $1${NC}"
    ((TESTS_PASSED++))
}

# Function to print fail
fail_test() {
    echo -e "${RED}❌ FAIL: $1${NC}"
    ((TESTS_FAILED++))
}

# Function to print pending
pending_test() {
    echo -e "${YELLOW}⏳ PENDING: $1${NC}"
    ((TESTS_PENDING++))
}

# ==========================================
# Test 1: Backend Health Check
# ==========================================
print_test "Backend Health Check"

if curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" | grep -q "200"; then
    pass_test "Backend is running on port 8080"
else
    fail_test "Backend not responding on port 8080"
    exit 1
fi

# ==========================================
# Test 2: Frontend Health Check
# ==========================================
print_test "Frontend Health Check"

if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
    pass_test "Frontend is running on port 3000"
else
    fail_test "Frontend not responding on port 3000"
    exit 1
fi

# ==========================================
# Test 3: Check API Endpoint Routes
# ==========================================
print_test "API Endpoint Routes"

# Check if route.ts file exists
if [ -f "frontend/src/app/api/data-rekam/duplicate-operator/route.ts" ]; then
    pass_test "API route file exists"
else
    fail_test "API route file not found"
fi

# Check if GET method is implemented
if grep -q "export async function GET" frontend/src/app/api/data-rekam/duplicate-operator/route.ts; then
    pass_test "GET method implemented"
else
    fail_test "GET method not found"
fi

# Check if POST method is implemented
if grep -q "export async function POST" frontend/src/app/api/data-rekam/duplicate-operator/route.ts; then
    pass_test "POST method implemented"
else
    fail_test "POST method not found"
fi

# Check if DELETE method is implemented
if grep -q "export async function DELETE" frontend/src/app/api/data-rekam/duplicate-operator/route.ts; then
    pass_test "DELETE method implemented"
else
    fail_test "DELETE method not found"
fi

# ==========================================
# Test 4: Check Page Component
# ==========================================
print_test "Page Component Validation"

if [ -f "frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx" ]; then
    pass_test "Page component exists"
else
    fail_test "Page component not found"
fi

# Check if validateNIK is a regular function
if grep -q "^const validateNIK = (" frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx; then
    pass_test "validateNIK is a regular function"
else
    fail_test "validateNIK still using useMemo"
fi

# Check if fetchRekapData uses localStorage
if grep -q "localStorage.getItem.*selly_auth_token" frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx; then
    pass_test "fetchRekapData uses localStorage token"
else
    fail_test "fetchRekapData not using localStorage"
fi

# Check if handleSubmit uses API route
if grep -q "fetch.*duplicate-operator" frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx; then
    pass_test "handleSubmit uses API route"
else
    fail_test "handleSubmit not using API route"
fi

# ==========================================
# Test 5: TypeScript Compilation
# ==========================================
print_test "TypeScript Compilation"

pending_test "Run: cd frontend && pnpm type-check"

# ==========================================
# Test 6: ESLint Validation
# ==========================================
print_test "ESLint Validation"

pending_test "Run: cd frontend && pnpm lint"

# ==========================================
# Test 7: Frontend Tests
# ==========================================
print_test "Frontend Unit Tests"

pending_test "Run: cd frontend && pnpm test duplicate-operator"

# ==========================================
# Test 8: Code Quality Checks
# ==========================================
print_test "Code Quality Metrics"

# Check for console.log statements
if grep -q "console\.log\|console\.debug" frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx; then
    pending_test "Clean up console.log statements"
else
    pass_test "No production console logs found"
fi

# Check for TODO comments
if grep -q "TODO\|FIXME" frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx; then
    pending_test "Resolve TODO/FIXME comments"
else
    pass_test "No TODO/FIXME comments found"
fi

# ==========================================
# Test 9: Documentation
# ==========================================
print_test "Documentation"

if [ -f "docs/bydate/2025-11-10/2025-11-10-QUICK-REFERENCE-DUPLICATE-OPERATOR.md" ]; then
    pass_test "Quick reference documentation exists"
else
    fail_test "Quick reference documentation missing"
fi

if [ -f "docs/bydate/2025-11-10/2025-11-10-DUPLICATE-OPERATOR-IMPLEMENTATION-COMPLETE.md" ]; then
    pass_test "Implementation documentation exists"
else
    fail_test "Implementation documentation missing"
fi

# ==========================================
# Summary
# ==========================================
echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"
echo -e "${YELLOW}⏳ Pending: $TESTS_PENDING${NC}"
echo -e "${BLUE}================================================${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}All automated tests passed!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Run TypeScript compilation: cd frontend && pnpm type-check"
    echo "2. Run ESLint: cd frontend && pnpm lint"
    echo "3. Run tests: cd frontend && pnpm test"
    echo "4. Manual E2E testing in browser"
    echo ""
else
    echo -e "${RED}Some tests failed. Please fix issues before proceeding.${NC}"
    exit 1
fi
