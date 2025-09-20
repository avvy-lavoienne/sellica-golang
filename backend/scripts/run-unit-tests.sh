#!/bin/bash

# SELLY Go Backend Unit Test Runner
# This script runs unit tests for all services and generates coverage reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧪 SELLY Go Backend Unit Test Suite${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""

# Create test results directory
RESULTS_DIR="scripts/test-results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
mkdir -p "${RESULTS_DIR}"

# Function to run tests for a service
run_service_tests() {
    local service=$1
    local service_path="./internal/services/${service}"
    
    echo -e "${YELLOW}🔍 Testing ${service} service...${NC}"
    
    if [ -f "${service_path}/service_test.go" ]; then
        # Run tests with coverage
        if go test -v -cover -coverprofile="${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.out" "${service_path}" > "${RESULTS_DIR}/${service}-test-${TIMESTAMP}.log" 2>&1; then
            echo -e "${GREEN}✅ ${service} tests passed${NC}"
            
            # Generate coverage report
            if [ -f "${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.out" ]; then
                coverage=$(go tool cover -func="${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.out" | grep "total:" | awk '{print $3}')
                echo -e "   📊 Coverage: ${coverage}"
                
                # Generate HTML coverage report
                go tool cover -html="${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.out" -o "${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.html"
            fi
        else
            echo -e "${RED}❌ ${service} tests failed${NC}"
            echo -e "   📋 Check log: ${RESULTS_DIR}/${service}-test-${TIMESTAMP}.log"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️  No tests found for ${service} service${NC}"
        return 1
    fi
    
    echo ""
}

# Services to test
SERVICES=(
    "auth"
    "cache" 
    "chat"
    "compliance"
    "database"
    "monitoring"
    "nlp"
    "training"
)

# Track results
PASSED_SERVICES=()
FAILED_SERVICES=()
MISSING_SERVICES=()

echo -e "${BLUE}🏃 Running Unit Tests${NC}"
echo -e "${BLUE}=====================${NC}"

for service in "${SERVICES[@]}"; do
    if run_service_tests "$service"; then
        PASSED_SERVICES+=("$service")
    else
        if [ -f "./internal/services/${service}/service_test.go" ]; then
            FAILED_SERVICES+=("$service")
        else
            MISSING_SERVICES+=("$service")
        fi
    fi
done

# Generate summary report
echo -e "${BLUE}📊 Test Summary${NC}"
echo -e "${BLUE}===============${NC}"
echo -e "📅 Test Run: $(date)"
echo -e "📁 Results Directory: ${RESULTS_DIR}"
echo ""

echo -e "${GREEN}✅ Passed Services (${#PASSED_SERVICES[@]}):${NC}"
for service in "${PASSED_SERVICES[@]}"; do
    echo -e "   • ${service}"
done
echo ""

if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo -e "${RED}❌ Failed Services (${#FAILED_SERVICES[@]}):${NC}"
    for service in "${FAILED_SERVICES[@]}"; do
        echo -e "   • ${service}"
    done
    echo ""
fi

if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Missing Tests (${#MISSING_SERVICES[@]}):${NC}"
    for service in "${MISSING_SERVICES[@]}"; do
        echo -e "   • ${service}"
    done
    echo ""
fi

# Calculate overall statistics
TOTAL_SERVICES=${#SERVICES[@]}
TESTED_SERVICES=$((${#PASSED_SERVICES[@]} + ${#FAILED_SERVICES[@]}))
SUCCESS_RATE=0

if [ $TESTED_SERVICES -gt 0 ]; then
    SUCCESS_RATE=$(( (${#PASSED_SERVICES[@]} * 100) / $TESTED_SERVICES ))
fi

echo -e "${BLUE}📈 Overall Statistics:${NC}"
echo -e "   Total Services: ${TOTAL_SERVICES}"
echo -e "   Services with Tests: ${TESTED_SERVICES}"
echo -e "   Test Success Rate: ${SUCCESS_RATE}%"
echo -e "   Coverage Reports: ${RESULTS_DIR}/*-coverage-${TIMESTAMP}.html"

# Generate combined coverage report if possible
echo ""
echo -e "${BLUE}📋 Generating Combined Coverage Report...${NC}"

# Combine all coverage files
COVERAGE_FILES=""
for service in "${PASSED_SERVICES[@]}"; do
    if [ -f "${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.out" ]; then
        COVERAGE_FILES="${COVERAGE_FILES} ${RESULTS_DIR}/${service}-coverage-${TIMESTAMP}.out"
    fi
done

if [ -n "$COVERAGE_FILES" ]; then
    # Create combined coverage report
    echo "mode: set" > "${RESULTS_DIR}/combined-coverage-${TIMESTAMP}.out"
    for file in $COVERAGE_FILES; do
        tail -n +2 "$file" >> "${RESULTS_DIR}/combined-coverage-${TIMESTAMP}.out"
    done
    
    # Generate combined HTML report
    go tool cover -html="${RESULTS_DIR}/combined-coverage-${TIMESTAMP}.out" -o "${RESULTS_DIR}/combined-coverage-${TIMESTAMP}.html"
    
    # Calculate combined coverage
    COMBINED_COVERAGE=$(go tool cover -func="${RESULTS_DIR}/combined-coverage-${TIMESTAMP}.out" | grep "total:" | awk '{print $3}')
    echo -e "${GREEN}📊 Combined Coverage: ${COMBINED_COVERAGE}${NC}"
    echo -e "📄 Combined Report: ${RESULTS_DIR}/combined-coverage-${TIMESTAMP}.html"
fi

echo ""
echo -e "${BLUE}🎯 Next Steps:${NC}"
if [ ${#MISSING_SERVICES[@]} -gt 0 ]; then
    echo -e "1. Create unit tests for missing services"
fi
if [ ${#FAILED_SERVICES[@]} -gt 0 ]; then
    echo -e "2. Fix failing tests"
fi
echo -e "3. Aim for 95%+ test coverage"
echo -e "4. Add integration tests"

# Exit with appropriate code
if [ ${#FAILED_SERVICES[@]} -eq 0 ] && [ ${#MISSING_SERVICES[@]} -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests need attention${NC}"
    exit 1
fi
