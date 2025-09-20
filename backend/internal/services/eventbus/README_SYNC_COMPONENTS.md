# SELLY AI Data Flow Synchronization Components

## Overview

This directory contains the core synchronization components for SELLY AI's data flow synchronization system. These components provide real-time data consistency, intelligent conflict resolution, and comprehensive monitoring across all SELLY AI services.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Synchronization Layer                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Sync Service    │  │ Rule Engine     │  │ Consistency │  │
│  │                 │  │                 │  │ Checker     │  │
│  │ • Coordination  │  │ • Strategy      │  │ • Validation│  │
│  │ • Worker Pool   │  │ • Rules         │  │ • Integrity │  │
│  │ • Lifecycle     │  │ • Conditions    │  │ • Reports   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Event Bus       │  │ Cache Service   │  │ Monitoring  │  │
│  │ (Existing)      │  │ (Existing)      │  │ (Existing)  │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. SynchronizationService (`sync_service.go`)

**Purpose**: Central coordination service for data synchronization operations

**Key Features**:
- **Event-Driven Processing**: Automatically triggers sync operations based on data change events
- **Worker Pool**: Configurable pool of workers for concurrent sync processing
- **Process Lifecycle Management**: Complete lifecycle tracking from creation to completion
- **Error Handling & Retry**: Robust error handling with configurable retry policies
- **Metrics & Monitoring**: Comprehensive metrics collection and health monitoring

**Configuration**:
```go
config := &SyncConfig{
    MaxConcurrentSyncs:    50,
    WorkerCount:          5,
    SyncTimeout:          5 * time.Minute,
    ConflictTimeout:      2 * time.Minute,
    CleanupInterval:      10 * time.Minute,
    MaxRetries:           3,
    RetryBackoff:         30 * time.Second,
    EnableMetrics:        true,
    MetricsInterval:      30 * time.Second,
}
```

**Usage**:
```go
// Initialize service
syncService, err := NewSynchronizationService(eventBus, config)

// Start the service
err = syncService.Start(ctx)

// The service will automatically handle sync events
// Check active processes
activeSyncs := syncService.GetActiveSyncs()

// Get metrics
metrics := syncService.GetSyncMetrics()
```

### 2. SyncRuleEngine (`sync_rule_engine.go`)

**Purpose**: Rules-based engine for determining synchronization strategies

**Key Features**:
- **Dynamic Rule Evaluation**: Real-time evaluation of sync rules based on event context
- **Strategy Templates**: Pre-defined strategy templates for common sync patterns
- **Condition Matching**: Flexible condition system for rule matching
- **Rule Management**: Add, remove, and update sync rules dynamically
- **Performance Monitoring**: Track rule evaluation performance and success rates

**Default Rules**:
- **User Profile Sync**: Immediate sync for user profile updates
- **Document Processing**: Batched sync for document uploads and processing
- **Chat Messages**: Immediate sync for real-time chat experience
- **Cache Invalidation**: Immediate sync for cache consistency
- **Government Documents**: Specialized rules for government document compliance

**Usage**:
```go
// Initialize rule engine
ruleEngine, err := NewSyncRuleEngine()

// Determine strategy for an event
strategy, err := ruleEngine.DetermineStrategy(event)

// Add custom rule
customRule := SyncRule{
    ID:        "custom_sync_rule",
    EventType: EventTypeCustomEvent,
    Conditions: []RuleCondition{
        {Field: "priority", Operator: "equals", Value: "high", Weight: 1.0},
    },
    Strategy: &SyncStrategy{
        Type:       ImmediateSync,
        Priority:   PriorityHigh,
        Timeout:    30 * time.Second,
    },
}
err = ruleEngine.AddRule(customRule)
```

### 3. DataConsistencyChecker (`data_consistency_checker.go`)

**Purpose**: Validation of data consistency across services

**Key Features**:
- **Cross-Service Validation**: Validate data consistency between multiple services
- **Comprehensive Checks**: Support for various consistency check types
- **Automated Monitoring**: Periodic consistency validation
- **Detailed Reporting**: Comprehensive reports with recommendations
- **Compliance Validation**: Specialized checks for government document compliance

**Check Types**:
- **Cross-Service Checks**: Validate data consistency between services
- **Data Integrity Checks**: Ensure data integrity within services
- **Referential Integrity**: Validate relationships between data entities
- **Temporal Consistency**: Ensure time-based data consistency
- **Business Rule Checks**: Validate adherence to business rules

**Usage**:
```go
// Initialize consistency checker
checker, err := NewDataConsistencyChecker()

// Perform comprehensive consistency check
report, err := checker.CheckConsistency(ctx)

logrus.WithFields(logrus.Fields{
    "overall_score": report.OverallScore,
    "status":        report.Status,
    "recommendations": len(report.Recommendations),
}).Info("Consistency check completed")

// Add custom consistency check
customCheck := &ConsistencyCheck{
    ID:          "custom_consistency_check",
    Name:        "Custom Data Validation",
    Type:        DataIntegrityCheck,
    Services:    []string{"service_a", "service_b"},
    Rules: []ConsistencyRule{
        {
            Field:        "data_field",
            Operator:     "equals",
            Service:      "service_a",
            Weight:       1.0,
            Severity:     "high",
        },
    },
}
err = checker.AddCheck(customCheck)
```

## Integration Examples

### Basic Integration (`sync_integration.go`)

```go
// Create integration instance
integration, err := NewSyncIntegration(eventBus)

// Start all components
err = integration.StartIntegration(ctx)

// Example: User profile sync
err = integration.ExampleUserProfileSync(ctx)

// Example: Document processing sync
err = integration.ExampleDocumentProcessingSync(ctx)

// Example: Consistency validation
err = integration.ExampleConsistencyCheck(ctx)

// Get integration status
status := integration.GetIntegrationStatus()
```

### SELLY AI Specific Integration

```go
// Create SELLY AI specific integration
sellyIntegration, err := NewSELLYAISyncIntegration(eventBus)

// Handle government document sync
err = sellyIntegration.HandleGovernmentDocumentSync(ctx, "akta_kelahiran", documentData)

// Handle user profile sync with SELLY AI specifics
err = sellyIntegration.HandleUserProfileSync(ctx, userID, profileData)

// Get SELLY AI specific status
status := sellyIntegration.GetSELLYAIStatus()
```

## Configuration

### Environment Variables

```bash
# Sync Service Configuration
SYNC_MAX_CONCURRENT_SYNCS=50
SYNC_WORKER_COUNT=5
SYNC_TIMEOUT=5m
SYNC_CONFLICT_TIMEOUT=2m
SYNC_CLEANUP_INTERVAL=10m
SYNC_MAX_RETRIES=3
SYNC_RETRY_BACKOFF=30s

# Rule Engine Configuration
RULE_EVALUATION_TIMEOUT=5s
DEFAULT_STRATEGY_TIMEOUT=60s
MAX_CONCURRENT_STRATEGIES=100

# Consistency Checker Configuration
CONSISTENCY_MAX_CONCURRENT_CHECKS=10
CONSISTENCY_CHECK_TIMEOUT=30s
CONSISTENCY_THRESHOLD=0.95
CONSISTENCY_CRITICAL_THRESHOLD=0.80
```

### YAML Configuration

```yaml
sync_service:
  max_concurrent_syncs: 50
  worker_count: 5
  sync_timeout: 5m
  conflict_timeout: 2m
  cleanup_interval: 10m
  max_retries: 3
  retry_backoff: 30s
  enable_metrics: true
  metrics_interval: 30s

rule_engine:
  max_rules_per_event: 10
  rule_evaluation_timeout: 5s
  default_strategy_timeout: 60s
  max_concurrent_strategies: 100
  enable_metrics: true
  metrics_interval: 30s

consistency_checker:
  max_concurrent_checks: 10
  check_timeout: 30s
  retry_attempts: 3
  consistency_threshold: 0.95
  critical_threshold: 0.80
  enable_metrics: true
  metrics_interval: 60s
  service_endpoints:
    database: "postgresql://localhost:5432/selly"
    cache: "redis://localhost:6379"
    search_index: "elasticsearch://localhost:9200"
```

## Testing

### Unit Tests

Run individual component tests:
```bash
# Test SynchronizationService
go test -v ./backend/internal/services/eventbus/sync_service_test.go

# Test SyncRuleEngine
go test -v ./backend/internal/services/eventbus/sync_rule_engine_test.go

# Test DataConsistencyChecker
go test -v ./backend/internal/services/eventbus/data_consistency_checker_test.go
```

### Integration Tests

Run integration tests:
```bash
# Test complete integration
go test -v ./backend/internal/services/eventbus/sync_integration_test.go
```

### Benchmarks

Run performance benchmarks:
```bash
# Benchmark sync service
go test -bench=BenchmarkSynchronizationService_HandleSyncEvent

# Benchmark rule engine
go test -bench=BenchmarkSyncRuleEngine_DetermineStrategy

# Benchmark consistency checker
go test -bench=BenchmarkDataConsistencyChecker_CheckConsistency
```

## Monitoring & Observability

### Metrics

The components expose comprehensive metrics:

- **Sync Service Metrics**:
  - Total, active, completed, and failed processes
  - Worker utilization and queue depth
  - Average processing times and error rates

- **Rule Engine Metrics**:
  - Rules evaluated and matched
  - Strategy creation and evaluation times
  - Rule performance and success rates

- **Consistency Checker Metrics**:
  - Checks performed, passed, and failed
  - Consistency scores and trends
  - Average check times and error rates

### Health Checks

All components provide health check endpoints:

```go
// Check sync service health
health := syncService.IsHealthy()

// Check rule engine health
ruleMetrics := ruleEngine.GetMetrics()

// Check consistency checker health
consistencyMetrics := checker.GetMetrics()
```

### Logging

Comprehensive structured logging is provided:

```go
// Sync service logs
logrus.WithFields(logrus.Fields{
    "sync_id": process.ID,
    "type": process.Type,
    "status": process.Status,
}).Info("Sync process completed")

// Rule engine logs
logrus.WithFields(logrus.Fields{
    "rule_id": rule.ID,
    "event_type": event.Type,
    "score": score,
}).Debug("Rule matched for event")

// Consistency checker logs
logrus.WithFields(logrus.Fields{
    "overall_score": report.OverallScore,
    "status": report.Status,
    "duration": report.Duration,
}).Info("Consistency check completed")
```

## Error Handling

### Retry Policies

Configurable retry policies for failed operations:

```go
// Exponential backoff retry
retryPolicy := &RetryPolicy{
    MaxAttempts: 3,
    InitialDelay: 1 * time.Second,
    MaxDelay: 30 * time.Second,
    Multiplier: 2.0,
}
```

### Circuit Breakers

Built-in circuit breaker pattern for service protection:

```go
circuitBreaker := NewCircuitBreaker("service_name", CircuitBreakerConfig{
    FailureThreshold: 5,
    RecoveryTimeout:  60 * time.Second,
    SuccessThreshold: 2,
})
```

### Error Types

Custom error types for different failure scenarios:

```go
// Sync-specific errors
ErrSyncTimeout        = errors.New("sync operation timed out")
ErrSyncFailed         = errors.New("sync operation failed")
ErrInvalidStrategy    = errors.New("invalid sync strategy")

// Rule engine errors
ErrRuleNotFound       = errors.New("sync rule not found")
ErrInvalidCondition   = errors.New("invalid rule condition")

// Consistency errors
ErrConsistencyCheckFailed = errors.New("consistency check failed")
ErrServiceUnavailable     = errors.New("service unavailable for consistency check")
```

## Performance Considerations

### Optimization Strategies

1. **Worker Pool Sizing**: Configure worker pools based on expected load
2. **Batch Processing**: Use batched operations for high-volume scenarios
3. **Caching**: Implement result caching for frequently accessed data
4. **Async Processing**: Use async processing for non-critical operations

### Scalability

The components are designed to scale horizontally:

- **Worker Pools**: Add more workers for increased throughput
- **Partitioning**: Partition data for parallel processing
- **Load Balancing**: Distribute load across multiple instances
- **Database Sharding**: Support for sharded databases

### Resource Management

Efficient resource utilization:

- **Memory Management**: Proper cleanup of completed processes
- **Connection Pooling**: Reuse connections to external services
- **Timeout Management**: Prevent resource exhaustion with timeouts
- **Rate Limiting**: Control request rates to prevent overload

## Security Considerations

### Data Protection

- **Encryption**: Encrypt sensitive data in transit and at rest
- **Access Control**: Implement proper authentication and authorization
- **Audit Logging**: Comprehensive audit trails for all operations
- **Data Sanitization**: Sanitize data before processing

### Compliance

- **Government Standards**: Compliance with Indonesian government data standards
- **Privacy Regulations**: Adherence to data privacy regulations
- **Security Standards**: Implementation of security best practices
- **Audit Requirements**: Support for regulatory audit requirements

## Troubleshooting

### Common Issues

1. **High Latency**: Check worker pool configuration and database performance
2. **Failed Syncs**: Review error logs and retry configurations
3. **Inconsistent Data**: Run consistency checks and review rules
4. **Memory Issues**: Monitor memory usage and adjust cleanup intervals

### Debugging

Enable debug logging for detailed troubleshooting:

```bash
export LOG_LEVEL=debug
export SYNC_DEBUG=true
export RULE_ENGINE_DEBUG=true
export CONSISTENCY_DEBUG=true
```

### Monitoring Dashboards

Set up monitoring dashboards for key metrics:

- Sync operation throughput and latency
- Rule evaluation success rates
- Consistency check scores over time
- Error rates and failure patterns
- Resource utilization (CPU, memory, connections)

## Future Enhancements

### Planned Features

1. **AI-Powered Optimization**: ML-based optimization of sync strategies
2. **Predictive Analytics**: Predictive failure detection and prevention
3. **Advanced Conflict Resolution**: AI-powered conflict resolution
4. **Real-time Dashboards**: Live monitoring and alerting dashboards
5. **Multi-Region Support**: Cross-region data synchronization

### Extensibility

The components are designed for easy extension:

- **Plugin Architecture**: Support for custom sync strategies and rules
- **Event Extensions**: Easy addition of new event types
- **Service Integration**: Simple integration with new services
- **Custom Checks**: Flexible consistency check framework

## Contributing

### Code Standards

- Follow Go coding standards and best practices
- Comprehensive unit test coverage (>90%)
- Integration tests for critical paths
- Performance benchmarks for key operations
- Documentation for all public APIs

### Testing Guidelines

- Unit tests for all components
- Integration tests for service interactions
- Performance tests for scalability validation
- Chaos testing for resilience validation
- Compliance tests for regulatory requirements

## Support

### Documentation

- [API Documentation](./api_docs.md)
- [Configuration Guide](./configuration.md)
- [Troubleshooting Guide](./troubleshooting.md)
- [Performance Tuning](./performance.md)

### Community

- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and examples
- **Examples**: Working examples for common use cases
- **Support**: Community support through GitHub discussions

---

## Quick Start

1. **Initialize Components**:
   ```go
   eventBus := NewService(DefaultEventBusConfig())
   syncService, _ := NewSynchronizationService(eventBus, DefaultSyncConfig())
   ruleEngine, _ := NewSyncRuleEngine()
   consistencyChecker, _ := NewDataConsistencyChecker()
   ```

2. **Start Services**:
   ```go
   syncService.Start(ctx)
   ```

3. **Monitor Operations**:
   ```go
   metrics := syncService.GetSyncMetrics()
   status := consistencyChecker.CheckConsistency(ctx)
   ```

4. **Handle Events**:
   ```go
   event := NewEvent(EventTypeUserProfileUpdated, userData)
   eventBus.Publish(ctx, event) // Automatic sync processing
   ```

The synchronization components provide a robust, scalable, and intelligent foundation for SELLY AI's data flow management, ensuring real-time consistency and operational excellence across all services.