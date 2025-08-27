#!/bin/bash

# Week 1: Memory Optimization Validation Script
# This script validates the memory leak fixes and resource cleanup improvements

set -e

echo "🚀 Week 1: Memory Optimization Validation"
echo "=========================================="

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Check if required environment variables are set
if [ -z "$REDIS_URL" ]; then
    echo "❌ REDIS_URL not set in .env file"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Redis URL: ${REDIS_URL}"

# Build the memory optimization validator
echo "🔨 Building memory optimization validator..."
go build -o bin/memory-optimization-validator ./cmd/memory-optimization-validator/

if [ $? -ne 0 ]; then
    echo "❌ Failed to build memory optimization validator"
    exit 1
fi

echo "✅ Memory optimization validator built successfully"

# Run memory optimization validation with Upstash Redis
echo "🧪 Running memory optimization validation..."
echo "   Duration: 2 minutes"
echo "   Operation Rate: 5 ops/sec (conservative for validation)"

./bin/memory-optimization-validator \
    -redis-addr="${REDIS_URL}" \
    -duration=2m \
    -rate=5 \
    -verbose

VALIDATION_RESULT=$?

if [ $VALIDATION_RESULT -eq 0 ]; then
    echo ""
    echo "✅ Week 1: Memory Optimization Validation PASSED"
    echo "   ✓ Memory leak detection working"
    echo "   ✓ Resource cleanup functioning"
    echo "   ✓ Context cancellation implemented"
    echo "   ✓ Memory monitoring active"
    echo ""
    echo "🎯 Ready to proceed to Week 2: Vector Search Optimization"
else
    echo ""
    echo "❌ Week 1: Memory Optimization Validation FAILED"
    echo "   Please review the validation results above"
    echo "   Fix any issues before proceeding to Week 2"
    exit 1
fi

# Clean up
rm -f bin/memory-optimization-validator

echo "🏁 Week 1 validation completed successfully!"
