#!/bin/bash

# SELLY Go Backend Performance Testing Suite
# This script runs comprehensive performance tests to validate the 2x-5x improvement claims

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GO_BACKEND_URL=${GO_BACKEND_URL:-"http://localhost:8080"}
NEXTJS_FRONTEND_URL=${NEXTJS_FRONTEND_URL:-"http://localhost:3000"}
RESULTS_DIR="backend/scripts/load-testing/results"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}🚀 SELLY Performance Testing Suite${NC}"
echo -e "${BLUE}====================================${NC}"
echo ""
echo -e "📅 Started at: $(date)"
echo -e "🎯 Go Backend URL: ${GO_BACKEND_URL}"
echo -e "🌐 Next.js Frontend URL: ${NEXTJS_FRONTEND_URL}"
echo -e "📁 Results Directory: ${RESULTS_DIR}"
echo ""

# Create results directory
mkdir -p "${RESULTS_DIR}"

# Function to check if a service is running
check_service() {
    local url=$1
    local name=$2
    
    echo -e "${YELLOW}🔍 Checking ${name} at ${url}...${NC}"
    
    if curl -s -f "${url}/health" > /dev/null 2>&1 || curl -s -f "${url}/api/health" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ ${name} is running${NC}"
        return 0
    else
        echo -e "${RED}❌ ${name} is not responding${NC}"
        return 1
    fi
}

# Function to run Go benchmarks
run_go_benchmarks() {
    echo -e "${BLUE}🏃 Running Go Benchmark Tests...${NC}"
    
    cd backend
    
    # Run benchmarks with different configurations
    echo -e "${YELLOW}📊 Running standard benchmarks...${NC}"
    go test -bench=. -benchmem -count=3 ./scripts/load-testing/ > "../${RESULTS_DIR}/go-benchmarks-${TIMESTAMP}.txt" 2>&1
    
    echo -e "${YELLOW}📊 Running CPU profile benchmarks...${NC}"
    go test -bench=. -cpuprofile="../${RESULTS_DIR}/cpu-profile-${TIMESTAMP}.prof" ./scripts/load-testing/ > /dev/null 2>&1
    
    echo -e "${YELLOW}📊 Running memory profile benchmarks...${NC}"
    go test -bench=. -memprofile="../${RESULTS_DIR}/mem-profile-${TIMESTAMP}.prof" ./scripts/load-testing/ > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Go benchmarks completed${NC}"
    cd ..
}

# Function to run k6 load tests
run_k6_tests() {
    echo -e "${BLUE}🏃 Running k6 Load Tests...${NC}"
    
    # Check if k6 is installed
    if ! command -v k6 &> /dev/null; then
        echo -e "${RED}❌ k6 is not installed. Please install k6 first.${NC}"
        echo -e "${YELLOW}💡 Install k6: https://k6.io/docs/getting-started/installation/${NC}"
        return 1
    fi
    
    local k6_script="backend/scripts/load-testing/k6-load-test.js"
    
    # Light load test
    echo -e "${YELLOW}📊 Running light load test (10 users, 1 minute)...${NC}"
    BASE_URL="${GO_BACKEND_URL}" k6 run --vus 10 --duration 1m \
        --out json="${RESULTS_DIR}/k6-light-${TIMESTAMP}.json" \
        "${k6_script}"
    
    # Medium load test
    echo -e "${YELLOW}📊 Running medium load test (50 users, 2 minutes)...${NC}"
    BASE_URL="${GO_BACKEND_URL}" k6 run --vus 50 --duration 2m \
        --out json="${RESULTS_DIR}/k6-medium-${TIMESTAMP}.json" \
        "${k6_script}"
    
    # Heavy load test (if requested)
    if [[ "${RUN_HEAVY_TESTS}" == "true" ]]; then
        echo -e "${YELLOW}📊 Running heavy load test (200 users, 5 minutes)...${NC}"
        BASE_URL="${GO_BACKEND_URL}" k6 run --vus 200 --duration 5m \
            --out json="${RESULTS_DIR}/k6-heavy-${TIMESTAMP}.json" \
            "${k6_script}"
    fi
    
    echo -e "${GREEN}✅ k6 load tests completed${NC}"
}

# Function to run performance comparison
run_performance_comparison() {
    echo -e "${BLUE}🏃 Running Performance Comparison...${NC}"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed. Skipping comparison tests.${NC}"
        return 1
    fi
    
    # Set environment variables for the comparison script
    export GO_BACKEND_URL="${GO_BACKEND_URL}"
    export NEXTJS_FRONTEND_URL="${NEXTJS_FRONTEND_URL}"
    
    # Run the comparison
    node backend/scripts/load-testing/performance-comparison.js > "${RESULTS_DIR}/performance-comparison-${TIMESTAMP}.log" 2>&1
    
    echo -e "${GREEN}✅ Performance comparison completed${NC}"
}

# Function to generate summary report
generate_summary_report() {
    echo -e "${BLUE}📊 Generating Summary Report...${NC}"
    
    local report_file="${RESULTS_DIR}/performance-summary-${TIMESTAMP}.md"
    
    cat > "${report_file}" << EOF
# SELLY Go Backend Performance Test Results

**Test Date:** $(date)
**Go Backend URL:** ${GO_BACKEND_URL}
**Next.js Frontend URL:** ${NEXTJS_FRONTEND_URL}

## Test Configuration

- **Light Load:** 10 concurrent users for 1 minute
- **Medium Load:** 50 concurrent users for 2 minutes
- **Heavy Load:** 200 concurrent users for 5 minutes (if enabled)

## Results Files

- Go Benchmarks: \`go-benchmarks-${TIMESTAMP}.txt\`
- k6 Light Load: \`k6-light-${TIMESTAMP}.json\`
- k6 Medium Load: \`k6-medium-${TIMESTAMP}.json\`
- Performance Comparison: \`performance-comparison-${TIMESTAMP}.log\`
- CPU Profile: \`cpu-profile-${TIMESTAMP}.prof\`
- Memory Profile: \`mem-profile-${TIMESTAMP}.prof\`

## Key Metrics to Analyze

1. **Response Time Improvement:** Target 2x-5x faster than Next.js
2. **Throughput Improvement:** Target 2x-5x more requests/second
3. **Memory Usage:** Target 50-100MB vs 200-500MB baseline
4. **Concurrent Users:** Target 500+ vs 50-100 baseline
5. **Error Rate:** Target <5% under load

## Analysis Commands

\`\`\`bash
# View Go benchmark results
cat ${RESULTS_DIR}/go-benchmarks-${TIMESTAMP}.txt

# Analyze k6 results
k6 run --summary-export=${RESULTS_DIR}/k6-summary-${TIMESTAMP}.json ${k6_script}

# View performance comparison
cat ${RESULTS_DIR}/performance-comparison-${TIMESTAMP}.log

# Analyze CPU profile
go tool pprof ${RESULTS_DIR}/cpu-profile-${TIMESTAMP}.prof

# Analyze memory profile
go tool pprof ${RESULTS_DIR}/mem-profile-${TIMESTAMP}.prof
\`\`\`

## Performance Targets

Based on the SELLY roadmap, the Go backend should achieve:

- **Phase 1 Target:** 2x performance improvement
- **Phase 2 Target:** 5x performance improvement  
- **Phase 3 Target:** 10x performance improvement

Current test results should validate Phase 2 completion (5x improvement).
EOF

    echo -e "${GREEN}✅ Summary report generated: ${report_file}${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🔍 Pre-flight Checks${NC}"
    echo -e "${BLUE}==================${NC}"
    
    # Check if Go backend is running
    if ! check_service "${GO_BACKEND_URL}" "Go Backend"; then
        echo -e "${RED}❌ Go Backend is not running. Please start it first.${NC}"
        echo -e "${YELLOW}💡 Run: cd backend && go run cmd/server/main.go${NC}"
        exit 1
    fi
    
    # Check if Next.js frontend is running (optional for comparison)
    if ! check_service "${NEXTJS_FRONTEND_URL}" "Next.js Frontend"; then
        echo -e "${YELLOW}⚠️  Next.js Frontend is not running. Comparison tests will be skipped.${NC}"
        SKIP_COMPARISON=true
    fi
    
    echo ""
    echo -e "${BLUE}🏃 Running Performance Tests${NC}"
    echo -e "${BLUE}============================${NC}"
    
    # Run Go benchmarks
    run_go_benchmarks
    
    # Run k6 load tests
    run_k6_tests
    
    # Run performance comparison (if both services are available)
    if [[ "${SKIP_COMPARISON}" != "true" ]]; then
        run_performance_comparison
    else
        echo -e "${YELLOW}⏭️  Skipping performance comparison (Next.js not available)${NC}"
    fi
    
    # Generate summary report
    generate_summary_report
    
    echo ""
    echo -e "${GREEN}🎉 Performance Testing Completed!${NC}"
    echo -e "${GREEN}=================================${NC}"
    echo -e "📁 Results saved in: ${RESULTS_DIR}"
    echo -e "📊 Summary report: ${RESULTS_DIR}/performance-summary-${TIMESTAMP}.md"
    echo ""
    echo -e "${BLUE}📈 Next Steps:${NC}"
    echo -e "1. Review the performance results"
    echo -e "2. Compare against Phase 2 targets (5x improvement)"
    echo -e "3. Identify any performance bottlenecks"
    echo -e "4. Update documentation with actual metrics"
}

# Handle script arguments
case "${1:-}" in
    --heavy)
        export RUN_HEAVY_TESTS=true
        echo -e "${YELLOW}⚡ Heavy load tests enabled${NC}"
        ;;
    --help|-h)
        echo "Usage: $0 [--heavy] [--help]"
        echo ""
        echo "Options:"
        echo "  --heavy    Run heavy load tests (200+ users)"
        echo "  --help     Show this help message"
        echo ""
        echo "Environment Variables:"
        echo "  GO_BACKEND_URL        Go backend URL (default: http://localhost:8080)"
        echo "  NEXTJS_FRONTEND_URL   Next.js frontend URL (default: http://localhost:3000)"
        exit 0
        ;;
esac

# Run main function
main
