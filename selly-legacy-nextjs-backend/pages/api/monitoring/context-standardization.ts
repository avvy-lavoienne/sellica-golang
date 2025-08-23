/**
 * Context Standardization Monitoring API
 * Provides endpoints for context standardization metrics, validation, and migration progress
 */

import { NextApiRequest, NextApiResponse } from 'next';
// import { contextMiddleware } from '../../../services/chatbot/context/ContextMiddleware';
// import { backwardCompatibilityLayer } from '../../../services/chatbot/context/BackwardCompatibilityLayer';
// import { contextTransformer } from '../../../services/chatbot/context/ContextTransformer';
// import { contextValidator } from '../../../services/chatbot/context/StandardizedContext';

interface ContextApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ContextApiResponse>
) {
  const { method, query } = req;
  const timestamp = new Date().toISOString();

  try {
    switch (method) {
      case 'GET':
        return handleGet(req, res, timestamp);
      
      case 'POST':
        return handlePost(req, res, timestamp);
      
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({
          success: false,
          error: `Method ${method} not allowed`,
          timestamp
        });
    }
  } catch (error) {
    console.error('Context standardization API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp
    });
  }
}

/**
 * Handle GET requests - retrieve context standardization information
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<ContextApiResponse>,
  timestamp: string
) {
  const { action } = req.query;

  switch (action) {
    case 'metrics':
      // Get comprehensive metrics
      const metrics = {
        middleware: contextMiddleware.getMetrics(),
        compatibility: backwardCompatibilityLayer.getMetrics(),
        transformer: contextTransformer.getMetrics(),
        cacheStats: {
          middleware: contextMiddleware.getCacheStats(),
          transformer: contextTransformer.getCacheStats()
        }
      };

      return res.status(200).json({
        success: true,
        data: {
          metrics,
          timestamp
        },
        timestamp
      });

    case 'migration':
      // Get migration progress
      const migrationProgress = backwardCompatibilityLayer.getMigrationProgress();
      const recommendations = backwardCompatibilityLayer.getMigrationRecommendations();
      const isComplete = backwardCompatibilityLayer.isMigrationComplete();

      return res.status(200).json({
        success: true,
        data: {
          progress: migrationProgress,
          recommendations,
          isComplete,
          timestamp
        },
        timestamp
      });

    case 'health':
      // Get overall health status
      const middlewareMetrics = contextMiddleware.getMetrics();
      const compatibilityMetrics = backwardCompatibilityLayer.getMetrics();
      
      const errorReductionPercentage = contextMiddleware.getErrorReductionPercentage();
      const backwardCompatibilityRate = compatibilityMetrics.backwardCompatibilityRate;

      const healthStatus = {
        isHealthy: errorReductionPercentage >= 50 && backwardCompatibilityRate >= 95,
        errorReductionPercentage,
        backwardCompatibilityRate,
        targetErrorReduction: 50,
        targetCompatibilityRate: 95,
        metrics: {
          middleware: middlewareMetrics,
          compatibility: compatibilityMetrics
        }
      };

      return res.status(200).json({
        success: true,
        data: {
          health: healthStatus,
          timestamp
        },
        timestamp
      });

    case 'config':
      // Get current configuration
      const config = {
        middleware: contextMiddleware.getConfig(),
        compatibility: backwardCompatibilityLayer.getConfig()
      };

      return res.status(200).json({
        success: true,
        data: {
          config,
          timestamp
        },
        timestamp
      });

    case 'validate':
      // Validate a context (requires context in query params or body)
      const contextToValidate = req.query.context ? JSON.parse(req.query.context as string) : null;
      
      if (!contextToValidate) {
        return res.status(400).json({
          success: false,
          error: 'Context parameter is required for validation',
          timestamp
        });
      }

      const validationResult = contextValidator.validateStandardizedContext(contextToValidate);

      return res.status(200).json({
        success: true,
        data: {
          validation: validationResult,
          timestamp
        },
        timestamp
      });

    default:
      // Default: return summary
      const summary = {
        middleware: {
          totalRequests: contextMiddleware.getMetrics().totalRequests,
          successRate: contextMiddleware.getErrorReductionPercentage(),
          cacheHitRate: contextMiddleware.getCacheStats().hitRate
        },
        compatibility: {
          migrationProgress: backwardCompatibilityLayer.getMigrationProgress(),
          backwardCompatibilityRate: backwardCompatibilityLayer.getMetrics().backwardCompatibilityRate
        },
        availableActions: [
          'metrics',
          'migration',
          'health',
          'config',
          'validate'
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
 * Handle POST requests - control context standardization operations
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<ContextApiResponse>,
  timestamp: string
) {
  const { action } = req.query;
  const { context, config } = req.body;

  switch (action) {
    case 'validate':
      // Validate a context
      if (!context) {
        return res.status(400).json({
          success: false,
          error: 'Context is required for validation',
          timestamp
        });
      }

      try {
        const validationResult = contextValidator.validateStandardizedContext(context);
        
        return res.status(200).json({
          success: true,
          data: {
            validation: validationResult,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Validation failed',
          timestamp
        });
      }

    case 'transform':
      // Transform a context
      if (!context) {
        return res.status(400).json({
          success: false,
          error: 'Context is required for transformation',
          timestamp
        });
      }

      try {
        const transformationResult = await contextTransformer.toStandardized(context);
        
        return res.status(200).json({
          success: true,
          data: {
            transformation: transformationResult,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Transformation failed',
          timestamp
        });
      }

    case 'process':
      // Process context through compatibility layer
      if (!context) {
        return res.status(400).json({
          success: false,
          error: 'Context is required for processing',
          timestamp
        });
      }

      try {
        const processingResult = await backwardCompatibilityLayer.processContext(context);
        
        return res.status(200).json({
          success: true,
          data: {
            processing: processingResult,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Processing failed',
          timestamp
        });
      }

    case 'reset-metrics':
      // Reset all metrics
      contextMiddleware.resetMetrics();
      backwardCompatibilityLayer.resetMetrics();
      contextTransformer.resetMetrics();

      return res.status(200).json({
        success: true,
        data: {
          message: 'All context standardization metrics reset successfully',
          timestamp
        },
        timestamp
      });

    case 'clear-cache':
      // Clear all caches
      contextMiddleware.clearCache();
      contextTransformer.clearCache();
      contextValidator.clearCache();

      return res.status(200).json({
        success: true,
        data: {
          message: 'All context standardization caches cleared successfully',
          timestamp
        },
        timestamp
      });

    case 'update-config':
      // Update configuration
      if (!config) {
        return res.status(400).json({
          success: false,
          error: 'Config is required for configuration update',
          timestamp
        });
      }

      try {
        if (config.middleware) {
          contextMiddleware.updateConfig(config.middleware);
        }
        
        if (config.compatibility) {
          backwardCompatibilityLayer.updateConfig(config.compatibility);
        }

        return res.status(200).json({
          success: true,
          data: {
            message: 'Configuration updated successfully',
            newConfig: {
              middleware: contextMiddleware.getConfig(),
              compatibility: backwardCompatibilityLayer.getConfig()
            },
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Configuration update failed',
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
 * GET /api/monitoring/context-standardization - Get summary
 * GET /api/monitoring/context-standardization?action=metrics - Get detailed metrics
 * GET /api/monitoring/context-standardization?action=migration - Get migration progress
 * GET /api/monitoring/context-standardization?action=health - Get health status
 * GET /api/monitoring/context-standardization?action=config - Get current configuration
 * 
 * POST /api/monitoring/context-standardization?action=validate {"context": {...}} - Validate context
 * POST /api/monitoring/context-standardization?action=transform {"context": {...}} - Transform context
 * POST /api/monitoring/context-standardization?action=process {"context": {...}} - Process context
 * POST /api/monitoring/context-standardization?action=reset-metrics - Reset metrics
 * POST /api/monitoring/context-standardization?action=clear-cache - Clear caches
 * POST /api/monitoring/context-standardization?action=update-config {"config": {...}} - Update config
 */
