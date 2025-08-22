/**
 * Upstash Cache Management and Monitoring API
 * Provides endpoints for cache metrics, management, and performance monitoring
 * Phase 1 Week 3: Caching Enhancement with 85% hit rate target
 */

import { NextApiRequest, NextApiResponse } from 'next';
// import { UpstashCacheService } from '../../../services/cache/upstashCacheService';
// import { UpstashCacheServiceSingleton } from '../../../services/cache/UpstashCacheServiceFactory';

interface CacheApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

// Initialize cache service
let cacheService: UpstashCacheService | null = null;

function getCacheService(): UpstashCacheService {
  if (!cacheService) {
    cacheService = UpstashCacheServiceSingleton.getInstance('selly:api');
  }
  return cacheService;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CacheApiResponse>
) {
  const { method, query } = req;
  const timestamp = new Date().toISOString();

  try {
    switch (method) {
      case 'GET':
        return handleGet(req, res, timestamp);
      
      case 'POST':
        return handlePost(req, res, timestamp);
      
      case 'DELETE':
        return handleDelete(req, res, timestamp);
      
      default:
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          timestamp
        });
    }
  } catch (error) {
    console.error('Upstash cache API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp
    });
  }
}

/**
 * Handle GET requests - retrieve cache information and metrics
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<CacheApiResponse>,
  timestamp: string
) {
  const { action } = req.query;
  const cache = getCacheService();

  switch (action) {
    case 'stats':
      // Get basic cache statistics
      const stats = cache.getStats();
      
      return res.status(200).json({
        success: true,
        data: {
          stats,
          timestamp
        },
        timestamp
      });

    case 'performance':
      // Get detailed performance metrics
      const performanceMetrics = cache.getCachePerformanceMetrics();
      
      return res.status(200).json({
        success: true,
        data: {
          performance: performanceMetrics,
          timestamp
        },
        timestamp
      });

    case 'health':
      // Get cache health status
      const healthStatus = await cache.healthCheck();
      const upstashMetrics = cache.getUpstashMetrics();
      
      return res.status(200).json({
        success: true,
        data: {
          health: {
            isHealthy: healthStatus,
            upstashMetrics,
            lastCheck: timestamp
          },
          timestamp
        },
        timestamp
      });

    case 'metrics':
      // Get comprehensive metrics
      const allStats = cache.getStats();
      const allPerformance = cache.getCachePerformanceMetrics();
      const allUpstash = cache.getUpstashMetrics();
      const allHealth = await cache.healthCheck();

      return res.status(200).json({
        success: true,
        data: {
          comprehensive: {
            stats: allStats,
            performance: allPerformance,
            upstash: allUpstash,
            health: allHealth,
            efficiency: {
              hitRateTarget: 85,
              hitRateActual: allStats.hitRate * 100,
              responseTimeTarget: 200,
              responseTimeActual: allPerformance.averageResponseTime,
              efficiencyScore: allPerformance.cacheEfficiency * 100
            }
          },
          timestamp
        },
        timestamp
      });

    case 'test':
      // Test cache operations
      const testKey = `test:${Date.now()}`;
      const testData = { message: 'Cache test', timestamp: Date.now() };
      
      try {
        // Test set operation
        await cache.set(testKey, testData, 60); // 1 minute TTL
        
        // Test get operation
        const retrieved = await cache.get(testKey);
        
        // Test delete operation
        await cache.delete(testKey);
        
        return res.status(200).json({
          success: true,
          data: {
            test: {
              setOperation: 'success',
              getOperation: retrieved ? 'success' : 'failed',
              deleteOperation: 'success',
              dataIntegrity: JSON.stringify(retrieved) === JSON.stringify(testData)
            },
            timestamp
          },
          timestamp
        });
      } catch (testError) {
        return res.status(500).json({
          success: false,
          error: `Cache test failed: ${testError instanceof Error ? testError.message : 'Unknown error'}`,
          timestamp
        });
      }

    default:
      // Default: return summary
      const summary = {
        stats: cache.getStats(),
        performance: cache.getCachePerformanceMetrics(),
        availableActions: [
          'stats',
          'performance', 
          'health',
          'metrics',
          'test'
        ]
      };

      return res.status(200).json({
        success: true,
        data: {
          summary,
          timestamp
        },
        timestamp
      });
  }
}

/**
 * Handle POST requests - cache management operations
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<CacheApiResponse>,
  timestamp: string
) {
  const { action } = req.query;
  const { key, data, ttl, pattern } = req.body;
  const cache = getCacheService();

  switch (action) {
    case 'set':
      // Set cache entry
      if (!key || data === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Key and data are required for set operation',
          timestamp
        });
      }

      try {
        await cache.set(key, data, ttl || 3600);
        
        return res.status(200).json({
          success: true,
          data: {
            message: `Cache entry set successfully`,
            key,
            ttl: ttl || 3600,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Set operation failed',
          timestamp
        });
      }

    case 'invalidate-user':
      // Invalidate user-specific cache entries
      if (!req.body.userId) {
        return res.status(400).json({
          success: false,
          error: 'userId is required for user cache invalidation',
          timestamp
        });
      }

      try {
        await cache.invalidateUserCache(req.body.userId);
        
        return res.status(200).json({
          success: true,
          data: {
            message: `User cache invalidated successfully`,
            userId: req.body.userId,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'User cache invalidation failed',
          timestamp
        });
      }

    case 'invalidate-session':
      // Invalidate session-specific cache entries
      if (!req.body.sessionId) {
        return res.status(400).json({
          success: false,
          error: 'sessionId is required for session cache invalidation',
          timestamp
        });
      }

      try {
        await cache.invalidateSessionCache(req.body.sessionId);
        
        return res.status(200).json({
          success: true,
          data: {
            message: `Session cache invalidated successfully`,
            sessionId: req.body.sessionId,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Session cache invalidation failed',
          timestamp
        });
      }

    case 'batch-cache':
      // Batch cache AI responses
      if (!req.body.entries || !Array.isArray(req.body.entries)) {
        return res.status(400).json({
          success: false,
          error: 'entries array is required for batch cache operation',
          timestamp
        });
      }

      try {
        await cache.batchCacheAIResponses(req.body.entries);
        
        return res.status(200).json({
          success: true,
          data: {
            message: `Batch cache operation completed successfully`,
            entriesProcessed: req.body.entries.length,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Batch cache operation failed',
          timestamp
        });
      }

    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}`,
        timestamp
      });
  }
}

/**
 * Handle DELETE requests - cache cleanup operations
 */
async function handleDelete(
  req: NextApiRequest,
  res: NextApiResponse<CacheApiResponse>,
  timestamp: string
) {
  const { action } = req.query;
  const { key } = req.body;
  const cache = getCacheService();

  switch (action) {
    case 'key':
      // Delete specific cache key
      if (!key) {
        return res.status(400).json({
          success: false,
          error: 'Key is required for delete operation',
          timestamp
        });
      }

      try {
        await cache.delete(key);
        
        return res.status(200).json({
          success: true,
          data: {
            message: `Cache key deleted successfully`,
            key,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Delete operation failed',
          timestamp
        });
      }

    case 'clear':
      // Clear all cache entries
      try {
        await cache.clear();
        
        return res.status(200).json({
          success: true,
          data: {
            message: `Cache cleared successfully`,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Clear operation failed',
          timestamp
        });
      }

    default:
      return res.status(400).json({
        success: false,
        error: `Unknown action: ${action}`,
        timestamp
      });
  }
}

/**
 * Example usage:
 * 
 * GET /api/monitoring/upstash-cache - Get summary
 * GET /api/monitoring/upstash-cache?action=stats - Get cache statistics
 * GET /api/monitoring/upstash-cache?action=performance - Get performance metrics
 * GET /api/monitoring/upstash-cache?action=health - Get health status
 * GET /api/monitoring/upstash-cache?action=metrics - Get comprehensive metrics
 * GET /api/monitoring/upstash-cache?action=test - Test cache operations
 * 
 * POST /api/monitoring/upstash-cache?action=set {"key": "test", "data": {...}, "ttl": 3600}
 * POST /api/monitoring/upstash-cache?action=invalidate-user {"userId": "user123"}
 * POST /api/monitoring/upstash-cache?action=invalidate-session {"sessionId": "session123"}
 * POST /api/monitoring/upstash-cache?action=batch-cache {"entries": [...]}
 * 
 * DELETE /api/monitoring/upstash-cache?action=key {"key": "test"}
 * DELETE /api/monitoring/upstash-cache?action=clear
 */
