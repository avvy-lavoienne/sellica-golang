# Enhanced Testing Guide for Sellica Conversion UI

## Overview

This guide covers the comprehensive testing strategy for Sellica's enhanced conversion UI, analytics engine, and Indonesian administrative service integration. Our testing approach ensures high quality, accessibility compliance, and cultural appropriateness for Indonesian government services.

## Test Architecture

### Test Types

1. **Unit Tests** - Individual component and service testing
2. **Integration Tests** - Cross-component interaction testing
3. **Performance Tests** - Benchmarking and optimization validation
4. **Accessibility Tests** - WCAG 2.1 AA compliance and Indonesian accessibility
5. **E2E Tests** - Complete user journey testing
6. **Analytics Tests** - Data collection and analysis validation

### Test Structure

```
src/test/
├── setup/                          # Test configuration
│   ├── testSetup.ts                # Global test setup
│   ├── indonesianTestSetup.ts      # Indonesian context setup
│   └── accessibilityTestSetup.ts   # Accessibility testing setup
├── utils/                          # Test utilities
│   └── indonesianAdministrativeTestData.ts  # Test data factory
├── integration/                    # Integration tests
│   ├── analyticsConversionIntegration.test.tsx
│   └── realTimeSyncIntegration.test.tsx
├── performance/                    # Performance tests
│   └── conversionPerformance.test.tsx
└── accessibility/                  # Accessibility tests
    └── conversionAccessibility.test.tsx
```

## Running Tests

### Quick Start

```bash
# Run all enhanced tests
pnpm test:enhanced

# Run with coverage
pnpm test:enhanced:coverage

# Run specific test types
pnpm test:unit
pnpm test:integration
pnpm test:performance:enhanced
pnpm test:accessibility
```

### Advanced Test Execution

```bash
# Run Indonesian-specific tests
pnpm test:indonesian

# Run analytics tests only
pnpm test:analytics

# Run conversion UI tests only
pnpm test:conversion

# Debug mode with verbose output
pnpm test:debug

# CI/CD pipeline tests
pnpm test:ci
```

### Enhanced Test Runner

```bash
# Run all tests with comprehensive reporting
npx tsx scripts/run-enhanced-tests.ts

# Run only critical tests
npx tsx scripts/run-enhanced-tests.ts critical

# Run specific test suite
npx tsx scripts/run-enhanced-tests.ts suite "Unit Tests" --verbose

# Performance benchmarking
npx tsx scripts/run-enhanced-tests.ts performance

# Accessibility audit
npx tsx scripts/run-enhanced-tests.ts accessibility

# Coverage analysis
npx tsx scripts/run-enhanced-tests.ts coverage
```

## Test Categories

### 1. Conversion UI Tests

**Location**: `src/components/chat/__tests__/`

**Coverage**:
- Enhanced Conversion Prompt functionality
- Progress indicator accuracy
- Success onboarding flow
- Error handling and recovery
- Indonesian administrative context

**Key Test Files**:
- `EnhancedConversionPrompt.test.tsx`
- `ConversionProgressIndicator.test.tsx`
- `ConversionSuccessOnboarding.test.tsx`

### 2. Analytics Engine Tests

**Location**: `src/services/analytics/__tests__/`

**Coverage**:
- Session analytics data collection
- Real-time metrics processing
- Conversion funnel analysis
- User journey tracking
- Performance monitoring

**Key Test Files**:
- `enhancedSessionAnalytics.test.ts`
- `conversionAnalytics.test.ts`
- `userJourneyTracker.test.ts`

### 3. Integration Tests

**Location**: `src/test/integration/`

**Coverage**:
- Analytics and conversion system integration
- Real-time sync with caching infrastructure
- Cross-device synchronization
- Database integration with Supabase
- Error recovery coordination

**Key Test Files**:
- `analyticsConversionIntegration.test.tsx`
- `realTimeSyncIntegration.test.tsx`

### 4. Performance Tests

**Location**: `src/test/performance/`

**Coverage**:
- Component rendering performance
- Memory usage optimization
- Network performance adaptation
- Cache efficiency
- Mobile performance

**Thresholds**:
- Component render time: < 150ms
- Conversion start time: < 200ms
- Analytics load time: < 500ms
- Memory usage limit: < 50MB
- Cache hit rate: > 80%

### 5. Accessibility Tests

**Location**: `src/test/accessibility/`

**Coverage**:
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- Color contrast validation
- Indonesian language accessibility
- Mobile accessibility

**Standards**:
- Minimum contrast ratio: 4.5:1
- Touch target size: ≥ 44x44px
- Keyboard navigation: 100% coverage
- Screen reader announcements: Proper timing

## Indonesian Administrative Service Testing

### Service Categories

1. **Identity Documents**
   - KTP (Kartu Tanda Penduduk)
   - Paspor
   - SIM (Surat Izin Mengemudi)

2. **Family Documents**
   - Kartu Keluarga
   - Akta Kelahiran
   - Akta Perkawinan

3. **Social Security**
   - BPJS Kesehatan
   - BPJS Ketenagakerjaan

### Test Data Factory

Use `IndonesianAdministrativeTestFactory` for generating realistic test scenarios:

```typescript
// Generate conversation history
const conversation = IndonesianAdministrativeTestFactory.generateConversationHistory('KTP', 'simple');

// Generate conversion steps
const steps = IndonesianAdministrativeTestFactory.generateConversionSteps('KTP');

// Generate analytics data
const analytics = IndonesianAdministrativeTestFactory.generateAnalyticsData('KTP', timeRange);
```

### Cultural Context Testing

- **Formality Levels**: Informal, semi-formal, formal, very formal
- **Regional Variations**: Jakarta, Yogyakarta, Bali, Surabaya dialects
- **Administrative Terminology**: Proper explanations for KTP, NIK, BPJS, etc.
- **Government Office Hours**: Monday-Friday, 8 AM - 4 PM WIB
- **Holiday Calendar**: Indonesian national holidays

## Performance Benchmarks

### Component Performance

| Component | Target Render Time | Memory Usage | Cache Hit Rate |
|-----------|-------------------|--------------|----------------|
| EnhancedConversionPrompt | < 150ms | < 10MB | > 80% |
| ConversionProgressIndicator | < 100ms | < 5MB | > 85% |
| SessionAnalyticsDashboard | < 500ms | < 20MB | > 75% |

### Network Performance

| Network Quality | Sync Latency | Retry Strategy | Cache Strategy |
|----------------|--------------|----------------|----------------|
| Excellent | < 50ms | Aggressive | Minimal |
| Good | < 100ms | Standard | Moderate |
| Poor | < 200ms | Conservative | Aggressive |
| Offline | Queue | Exponential backoff | Local only |

## Accessibility Standards

### WCAG 2.1 AA Compliance

- ✅ Color contrast ratio ≥ 4.5:1
- ✅ Keyboard navigation support
- ✅ Screen reader compatibility
- ✅ Focus management
- ✅ Alternative text for images
- ✅ Proper heading hierarchy
- ✅ Form labels and descriptions

### Indonesian Accessibility

- ✅ Language attribute (lang="id-ID")
- ✅ Administrative term explanations
- ✅ Cultural sensitivity validation
- ✅ Appropriate formality levels
- ✅ Government service context

### Mobile Accessibility

- ✅ Touch target size ≥ 44x44px
- ✅ Responsive design
- ✅ Screen reader gesture support
- ✅ Voice control compatibility

## Test Data Management

### Mock Data

All test data is generated using factories that ensure:
- Realistic Indonesian administrative scenarios
- Proper cultural context
- Appropriate language formality
- Valid document requirements
- Accurate processing times and fees

### Privacy and Security

- Personal data is anonymized in tests
- NIK numbers use test-only formats
- Sensitive information is properly masked
- GDPR/Indonesian privacy law compliance

## Continuous Integration

### GitHub Actions Workflow

```yaml
name: Enhanced Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: pnpm install
      - run: pnpm test:ci
      - run: npx tsx scripts/run-enhanced-tests.ts critical
```

### Quality Gates

- ✅ All critical tests must pass
- ✅ Coverage ≥ 80% for critical components
- ✅ No accessibility violations
- ✅ Performance benchmarks met
- ✅ Indonesian context validation passed

## Debugging Tests

### Common Issues

1. **Mock Setup Issues**
   ```bash
   pnpm test:debug
   ```

2. **Performance Failures**
   ```bash
   pnpm test:performance:enhanced --verbose
   ```

3. **Accessibility Violations**
   ```bash
   pnpm test:accessibility --verbose
   ```

### Debug Tools

- Jest verbose mode: `--verbose`
- No cache mode: `--no-cache`
- Specific test pattern: `--testNamePattern="pattern"`
- Watch mode: `--watch`

## Best Practices

### Writing Tests

1. **Use descriptive test names** that explain the scenario
2. **Include Indonesian context** in test descriptions
3. **Test both happy path and error scenarios**
4. **Validate accessibility** in every UI test
5. **Check performance** for critical user flows

### Test Organization

1. **Group related tests** in describe blocks
2. **Use beforeEach/afterEach** for setup/cleanup
3. **Mock external dependencies** consistently
4. **Share test data** using factories
5. **Document complex test scenarios**

### Indonesian Context

1. **Use appropriate formality levels** for different scenarios
2. **Include administrative terminology** explanations
3. **Test regional variations** when applicable
4. **Validate cultural sensitivity** in all content
5. **Check government service accuracy**

## Reporting

### Test Reports

Reports are generated in `test-reports/` directory:
- `enhanced-test-report.html` - Comprehensive HTML report
- `enhanced-test-report.json` - Machine-readable JSON report
- `junit.xml` - CI/CD compatible XML report
- `coverage/` - Detailed coverage reports

### Metrics Tracked

- Test execution time
- Coverage percentages
- Performance benchmarks
- Accessibility compliance
- Indonesian context validation
- Error rates and recovery

## Maintenance

### Regular Tasks

1. **Update test data** to reflect current Indonesian administrative procedures
2. **Review performance thresholds** quarterly
3. **Update accessibility standards** as guidelines evolve
4. **Refresh mock data** to maintain realism
5. **Validate Indonesian translations** with native speakers

### Monitoring

- Track test execution trends
- Monitor performance regression
- Review accessibility compliance
- Validate Indonesian context accuracy
- Check coverage maintenance

## Support

For questions about testing:
1. Review this documentation
2. Check existing test examples
3. Use the test data factories
4. Run tests in debug mode
5. Consult the team for complex scenarios

---

**Last Updated**: January 2024  
**Version**: 2.0  
**Maintained by**: Sellica Development Team
