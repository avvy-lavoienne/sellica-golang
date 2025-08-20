# SELLY AI Assistant - Comprehensive Test Suite

This directory contains a comprehensive Jest test suite for the SELLY AI assistant, designed to validate all core functionalities and ensure the system works as expected.

## 📋 Test Coverage

### 1. Temporal Intelligence Testing (`temporalIntelligence.test.ts`)
- **Indonesian Date Parsing**: Absolute, relative, and range dates
- **Temporal Condition Parsing**: Duration, comparison, and status conditions
- **Month Name Recognition**: Full and abbreviated Indonesian months
- **Date Range Calculations**: Validation and edge cases
- **Error Handling**: Invalid dates and malformed queries

### 2. Core AI Service Integration (`aiService.integration.test.ts`)
- **Query Processing Pipeline**: Input to response flow
- **Database Query Generation**: SQL generation and execution
- **Response Formatting**: Indonesian language and structure
- **Error Handling**: Fallback mechanisms and graceful degradation
- **Performance Metrics**: Sub-2 second response time validation

### 3. Indonesian NLP Capabilities (`indonesianNLP.test.ts`)
- **Administrative Terminology**: Government and bureaucratic terms
- **Compound Query Processing**: Comparisons, conditions, aggregations
- **Informal Language Handling**: Jakarta slang and regional variations
- **Context Maintenance**: Conversation continuity across turns
- **Entity Extraction**: Relationship mapping and classification

### 4. Database Intelligence (`databaseIntelligence.test.ts`)
- **Schema Understanding**: Table relationships and constraints
- **Query Optimization**: Caching and performance improvements
- **Data Validation**: Type safety and integrity checks
- **Cross-Table Analytics**: Insights and correlation analysis
- **Real-Time Synchronization**: Data updates and cache management

### 5. End-to-End Scenarios (`endToEnd.test.ts`)
- **Complete User Journeys**: Query to response workflows
- **Multi-Service Integration**: AI service coordination
- **Performance Benchmarks**: Concurrent request handling
- **Cultural Context**: Indonesian administrative scenarios
- **Response Quality**: Language and content validation

## 🚀 Running the Tests

### Prerequisites
```bash
# Install dependencies
pnpm install

# Install additional test dependencies
pnpm add -D jest @types/jest ts-jest jest-extended jest-junit jest-html-reporters
```

### Basic Test Execution
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test temporalIntelligence.test.ts

# Run tests in watch mode
pnpm test --watch

# Run tests with coverage
pnpm test --coverage
```

### Advanced Test Options
```bash
# Run only integration tests
pnpm test --testNamePattern="integration"

# Run performance tests
pnpm test --testNamePattern="Performance"

# Run tests with verbose output
pnpm test --verbose

# Run tests in parallel (default)
pnpm test --maxWorkers=4

# Run tests sequentially (for debugging)
pnpm test --runInBand
```

## 📊 Performance Requirements

### Response Time Thresholds
- **Unit Tests**: < 100ms per test
- **Integration Tests**: < 1000ms per test
- **End-to-End Tests**: < 5000ms per test
- **Query Processing**: < 2000ms (sub-2 second requirement)

### Success Rate Targets
- **Overall Test Suite**: > 95% pass rate
- **Critical Path Tests**: 100% pass rate
- **Performance Tests**: > 90% within thresholds

### Coverage Targets
- **Overall Coverage**: > 80%
- **Critical Modules**: > 85%
- **Temporal Intelligence**: > 90%
- **AI Service**: > 85%
- **Indonesian NLP**: > 85%

## 🧪 Test Categories

### Unit Tests
- Individual function and method testing
- Mock external dependencies
- Fast execution (< 100ms each)
- High coverage of edge cases

### Integration Tests
- Service-to-service communication
- Database interaction testing
- API endpoint validation
- Moderate execution time (< 1s each)

### End-to-End Tests
- Complete user scenarios
- Real system interaction
- Performance validation
- Slower execution (< 5s each)

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with ts-jest
- Custom matchers for SELLY-specific assertions
- Performance monitoring and reporting
- Coverage thresholds and reporting
- Test sequencing optimization

### Custom Matchers
- `toContainIndonesianText()`: Validates Indonesian language content
- `toBeWithinPerformanceThreshold()`: Checks response time limits
- `toHaveValidResponseStructure()`: Validates response format
- `toHaveValidTemporalStructure()`: Checks temporal query results
- `toHaveValidNLPStructure()`: Validates NLP processing results

### Test Utilities (`jest.setup.ts`)
- Mock data generators for all database tables
- Performance tracking and monitoring
- Console output management
- Global test helpers and utilities

## 📈 Performance Monitoring

### Automatic Performance Tracking
- Individual test execution time monitoring
- Slow test detection and reporting
- Memory usage tracking
- Concurrent execution analysis

### Performance Reports
- Test execution summary with timing
- Slow test identification (> 5s)
- Average execution time per test category
- Performance trend analysis

### Optimization Recommendations
- Automatic suggestions for slow tests
- Mock usage recommendations
- Parallel execution optimization
- Resource usage improvements

## 🎯 Specific Test Scenarios

### Indonesian Administrative Queries
```typescript
// Example test cases included:
"Berapa pengajuan bulan ini yang masih pending?"
"Bandingkan data salah rekam minggu lalu dengan minggu ini"
"Tampilkan adjudicate record yang lebih dari 30 hari"
```

### Error Scenarios
- Invalid date formats
- Malformed queries
- Database connection failures
- Network timeouts
- Empty result sets

### Performance Scenarios
- Concurrent request handling
- Large dataset processing
- Memory usage optimization
- Cache efficiency testing

## 🛠️ Debugging Tests

### Debug Mode
```bash
# Run tests with Node.js debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with debugging
pnpm test --testNamePattern="specific test" --runInBand
```

### Console Output
```typescript
// Enable console output for specific tests
beforeEach(() => {
  global.testUtils.restoreConsole();
});
```

### Performance Debugging
```typescript
// Track performance for specific operations
const startTime = performance.now();
// ... test operation
const endTime = performance.now();
expect(endTime - startTime).toBeWithinPerformanceThreshold(2000);
```

## 📝 Contributing to Tests

### Adding New Tests
1. Follow the existing test structure and naming conventions
2. Include performance assertions for new functionality
3. Add Indonesian language validation where applicable
4. Update coverage thresholds if needed

### Test Best Practices
- Use descriptive test names that explain the scenario
- Include both positive and negative test cases
- Mock external dependencies appropriately
- Validate both functionality and performance
- Include edge cases and error scenarios

### Performance Considerations
- Keep unit tests under 100ms
- Use appropriate mocking to reduce external calls
- Consider test execution order for optimization
- Monitor memory usage in long-running tests

## 🔍 Troubleshooting

### Common Issues
- **Timeout Errors**: Increase timeout in jest.config.js
- **Memory Issues**: Use `--maxWorkers=1` for memory-intensive tests
- **Flaky Tests**: Add proper async/await handling
- **Mock Issues**: Ensure mocks are cleared between tests

### Environment Issues
- Verify Node.js version compatibility
- Check TypeScript configuration
- Ensure all dependencies are installed
- Validate environment variables

This comprehensive test suite ensures SELLY AI assistant maintains high quality, performance, and reliability across all its core functionalities.
