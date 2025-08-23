# Database Connection Pooling Configuration

## Overview

The SELLY AI chatbot system implements a comprehensive database connection pooling strategy using a centralized `SupabaseManager` that manages shared connection instances across all services. This document outlines the configuration options and best practices.

## Environment Variables

### Core Connection Pool Settings

```bash
# Maximum number of connections in the pool (default: 20)
SUPABASE_MAX_CONNECTIONS=20

# Idle connection timeout in milliseconds (default: 30000 = 30s)
SUPABASE_IDLE_TIMEOUT=30000

# Connection timeout for new requests in milliseconds (default: 10000 = 10s)
SUPABASE_CONNECTION_TIMEOUT=10000

# Health check interval in milliseconds (default: 60000 = 1min)
SUPABASE_HEALTH_CHECK_INTERVAL=60000
```

### Retry and Recovery Settings

```bash
# Number of retry attempts for failed connections (default: 3)
SUPABASE_RETRY_ATTEMPTS=3

# Base delay between retries in milliseconds (default: 1000 = 1s)
SUPABASE_RETRY_DELAY=1000
```

### Circuit Breaker Configuration

```bash
# Enable circuit breaker pattern (default: true)
SUPABASE_ENABLE_CIRCUIT_BREAKER=true

# Number of failures before opening circuit breaker (default: 5)
SUPABASE_CIRCUIT_BREAKER_THRESHOLD=5

# Time to wait before attempting to close circuit breaker in milliseconds (default: 60000 = 1min)
SUPABASE_CIRCUIT_BREAKER_TIMEOUT=60000
```

### Debug and Monitoring

```bash
# Enable detailed cache debugging (default: false)
SELLY_DEBUG_CACHE=true

# Enable connection pool debug logging (default: false)
SELLY_DEBUG_POOL=true
```

## Configuration Examples

### Development Environment (.env.local)

```bash
# Development settings - more verbose logging, shorter timeouts
SUPABASE_MAX_CONNECTIONS=10
SUPABASE_IDLE_TIMEOUT=15000
SUPABASE_CONNECTION_TIMEOUT=5000
SUPABASE_HEALTH_CHECK_INTERVAL=30000
SUPABASE_RETRY_ATTEMPTS=2
SUPABASE_RETRY_DELAY=500
SUPABASE_ENABLE_CIRCUIT_BREAKER=true
SUPABASE_CIRCUIT_BREAKER_THRESHOLD=3
SUPABASE_CIRCUIT_BREAKER_TIMEOUT=30000
SELLY_DEBUG_CACHE=true
SELLY_DEBUG_POOL=true
```

### Production Environment

```bash
# Production settings - optimized for performance and reliability
SUPABASE_MAX_CONNECTIONS=50
SUPABASE_IDLE_TIMEOUT=60000
SUPABASE_CONNECTION_TIMEOUT=15000
SUPABASE_HEALTH_CHECK_INTERVAL=120000
SUPABASE_RETRY_ATTEMPTS=5
SUPABASE_RETRY_DELAY=2000
SUPABASE_ENABLE_CIRCUIT_BREAKER=true
SUPABASE_CIRCUIT_BREAKER_THRESHOLD=10
SUPABASE_CIRCUIT_BREAKER_TIMEOUT=300000
SELLY_DEBUG_CACHE=false
SELLY_DEBUG_POOL=false
```

### High-Load Environment

```bash
# High-load settings - maximum connections and aggressive recovery
SUPABASE_MAX_CONNECTIONS=100
SUPABASE_IDLE_TIMEOUT=30000
SUPABASE_CONNECTION_TIMEOUT=20000
SUPABASE_HEALTH_CHECK_INTERVAL=60000
SUPABASE_RETRY_ATTEMPTS=3
SUPABASE_RETRY_DELAY=1000
SUPABASE_ENABLE_CIRCUIT_BREAKER=true
SUPABASE_CIRCUIT_BREAKER_THRESHOLD=15
SUPABASE_CIRCUIT_BREAKER_TIMEOUT=180000
```

## Connection Pool Architecture

### Pool Distribution

The connection pool is automatically split between two contexts:

- **Service Role Pool**: 50% of max connections (bypasses RLS)
- **User Auth Pool**: 50% of max connections (respects RLS)

### Connection Lifecycle

1. **Creation**: Connections are created on-demand up to pool limits
2. **Warming**: Minimum connections are pre-created during startup
3. **Health Monitoring**: Regular health checks remove unhealthy connections
4. **Cleanup**: Idle connections are removed after timeout period
5. **Shutdown**: Graceful cleanup on application termination

## Monitoring and Observability

### Health Check Endpoint

```bash
GET /api/monitoring/database-pool
```

Returns comprehensive pool metrics including:
- Active/idle connection counts
- Pool utilization percentage
- Average wait times
- Error rates
- Circuit breaker status

### Metrics Available

```typescript
interface ConnectionPoolMetrics {
  activeConnections: number;
  totalConnections: number;
  poolUtilization: number;
  averageWaitTime: number;
  totalQueries: number;
  failedQueries: number;
  errorRate: number;
  lastHealthCheck: string;
  circuitBreakerState: 'closed' | 'open' | 'half-open';
}
```

### Dashboard Component

Use the `DatabasePoolMonitor` React component for real-time monitoring:

```tsx
import DatabasePoolMonitor from '@/components/monitoring/DatabasePoolMonitor';

export default function MonitoringPage() {
  return <DatabasePoolMonitor />;
}
```

## Performance Tuning Guidelines

### Connection Pool Sizing

**Rule of thumb**: `max_connections = expected_concurrent_users * 0.1`

- **Small applications**: 10-20 connections
- **Medium applications**: 20-50 connections  
- **Large applications**: 50-100 connections
- **Enterprise applications**: 100+ connections

### Timeout Configuration

**Connection Timeout**: Should be 2-3x your average query time
**Idle Timeout**: Balance between connection reuse and resource conservation
**Health Check Interval**: More frequent for critical applications

### Circuit Breaker Tuning

**Threshold**: Set based on acceptable error rate (5-15 failures typical)
**Timeout**: Allow enough time for underlying issues to resolve (1-5 minutes)

## Troubleshooting

### Common Issues

1. **Connection Pool Exhausted**
   - Increase `SUPABASE_MAX_CONNECTIONS`
   - Reduce `SUPABASE_IDLE_TIMEOUT`
   - Check for connection leaks

2. **High Wait Times**
   - Increase pool size
   - Optimize slow queries
   - Check database performance

3. **Circuit Breaker Frequently Open**
   - Investigate database connectivity
   - Increase threshold if errors are transient
   - Check network stability

### Debug Commands

```bash
# Test connection pooling
npm run test:db-pool

# Monitor in real-time
npm run test:db-pool:watch

# Check pool status via API
curl http://localhost:3000/api/monitoring/database-pool
```

### Log Analysis

Enable debug logging to analyze connection patterns:

```bash
SELLY_DEBUG_POOL=true npm run dev
```

Look for log patterns:
- `🔗 Created new connection`
- `🎯 Cache HIT/MISS`
- `⚠️ Connection timeout`
- `🚨 Circuit breaker opened`

## Best Practices

### Service Integration

1. **Always use the pooled manager**:
   ```typescript
   const manager = await SupabaseManager.getInstance();
   const client = await manager.getServiceRoleClient();
   ```

2. **Release connections promptly**:
   ```typescript
   try {
     const result = await client.from('table').select();
     return result;
   } finally {
     manager.releaseConnection(client);
   }
   ```

3. **Use executeQuery for automatic management**:
   ```typescript
   const result = await manager.executeQuery(
     async (client) => client.from('table').select(),
     'service'
   );
   ```

### Error Handling

1. **Implement fallbacks**:
   ```typescript
   try {
     return await databaseOperation();
   } catch (error) {
     return fallbackData;
   }
   ```

2. **Use resilient service wrapper**:
   ```typescript
   const resilientService = ResilientDatabaseService.getInstance();
   const result = await resilientService.execute({
     operation: async (client) => client.from('table').select(),
     context: { operationType: 'fetch_data' },
     options: { fallbackData: [] }
   });
   ```

### Monitoring

1. **Set up alerts** for:
   - Pool utilization > 90%
   - Error rate > 10%
   - Circuit breaker open
   - Average wait time > 1000ms

2. **Regular health checks**:
   - Monitor connection pool metrics
   - Review error recovery statistics
   - Analyze performance trends

## Migration Guide

### From Individual Clients

Replace individual Supabase client creation:

```typescript
// Before
const supabase = createClient(url, key);

// After
const manager = await SupabaseManager.getInstance();
const client = await manager.getServiceRoleClient();
```

### Service Updates

Update service constructors to use pooled connections:

```typescript
// Before
class MyService {
  private supabase = createClient(url, key);
}

// After
class MyService {
  private supabaseManager: SupabaseManager | null = null;
  
  private async getClient() {
    if (!this.supabaseManager) {
      this.supabaseManager = await SupabaseManager.getInstance();
    }
    return await this.supabaseManager.getServiceRoleClient();
  }
}
```

## Security Considerations

1. **Environment Variables**: Store sensitive configuration in secure environment variables
2. **Connection Limits**: Set appropriate limits to prevent resource exhaustion
3. **Monitoring**: Monitor for unusual connection patterns that might indicate attacks
4. **Logging**: Avoid logging sensitive connection details in production

## Support and Maintenance

- **Health Monitoring**: Use the built-in monitoring dashboard
- **Performance Testing**: Run regular load tests with `npm run test:db-pool`
- **Configuration Updates**: Test configuration changes in staging first
- **Documentation**: Keep this document updated with configuration changes
