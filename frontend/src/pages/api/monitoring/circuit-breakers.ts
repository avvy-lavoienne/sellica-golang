/**
 * Circuit Breaker Monitoring API
 * Provides endpoints for circuit breaker status, metrics, and control operations
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { circuitBreakerManager } from '../../../services/monitoring/CircuitBreakerManager';

interface CircuitBreakerApiResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CircuitBreakerApiResponse>
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
    console.error('Circuit breaker API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error',
      timestamp
    });
  }
}

/**
 * Handle GET requests - retrieve circuit breaker information
 */
async function handleGet(
  req: NextApiRequest,
  res: NextApiResponse<CircuitBreakerApiResponse>,
  timestamp: string
) {
  const { action, service } = req.query;

  switch (action) {
    case 'status':
      // Get overall status
      const summary = circuitBreakerManager.getSummary();
      return res.status(200).json({
        success: true,
        data: {
          summary,
          timestamp
        },
        timestamp
      });

    case 'health':
      // Get detailed health status
      const healthStatus = circuitBreakerManager.getHealthStatus();
      return res.status(200).json({
        success: true,
        data: {
          services: healthStatus,
          summary: circuitBreakerManager.getSummary(),
          timestamp
        },
        timestamp
      });

    case 'metrics':
      // Get all metrics
      const metrics = circuitBreakerManager.getAllMetrics();
      return res.status(200).json({
        success: true,
        data: {
          metrics,
          timestamp
        },
        timestamp
      });

    case 'service':
      // Get specific service information
      if (!service || typeof service !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Service name is required',
          timestamp
        });
      }

      const healthStatuses = circuitBreakerManager.getHealthStatus();
      const serviceStatus = healthStatuses.find(s => s.name === service);
      
      if (!serviceStatus) {
        return res.status(404).json({
          success: false,
          error: `Service '${service}' not found`,
          timestamp
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          service: serviceStatus,
          timestamp
        },
        timestamp
      });

    case 'unhealthy':
      // Get unhealthy circuit breakers
      const unhealthy = circuitBreakerManager.getUnhealthyCircuitBreakers();
      return res.status(200).json({
        success: true,
        data: {
          unhealthy,
          count: unhealthy.length,
          timestamp
        },
        timestamp
      });

    default:
      // Default: return summary
      const defaultSummary = circuitBreakerManager.getSummary();
      return res.status(200).json({
        success: true,
        data: {
          summary: defaultSummary,
          availableActions: [
            'status',
            'health', 
            'metrics',
            'service',
            'unhealthy'
          ],
          timestamp
        },
        timestamp
      });
  }
}

/**
 * Handle POST requests - control circuit breaker operations
 */
async function handlePost(
  req: NextApiRequest,
  res: NextApiResponse<CircuitBreakerApiResponse>,
  timestamp: string
) {
  const { action } = req.query;
  const { service, services } = req.body;

  // Validate authentication/authorization here if needed
  // For now, allowing all operations for development

  switch (action) {
    case 'reset':
      if (service) {
        // Reset specific service
        const success = circuitBreakerManager.reset(service);
        if (!success) {
          return res.status(404).json({
            success: false,
            error: `Service '${service}' not found`,
            timestamp
          });
        }

        return res.status(200).json({
          success: true,
          data: {
            message: `Circuit breaker for '${service}' reset successfully`,
            service,
            timestamp
          },
          timestamp
        });
      } else if (services && Array.isArray(services)) {
        // Reset multiple services
        const results: { service: string; success: boolean }[] = [];
        
        for (const serviceName of services) {
          const success = circuitBreakerManager.reset(serviceName);
          results.push({ service: serviceName, success });
        }

        return res.status(200).json({
          success: true,
          data: {
            message: `Reset attempted for ${services.length} services`,
            results,
            timestamp
          },
          timestamp
        });
      } else {
        // Reset all circuit breakers
        circuitBreakerManager.resetAll();
        
        return res.status(200).json({
          success: true,
          data: {
            message: 'All circuit breakers reset successfully',
            timestamp
          },
          timestamp
        });
      }

    case 'register':
      // Register new circuit breaker
      const { name, config } = req.body;
      
      if (!name || !config) {
        return res.status(400).json({
          success: false,
          error: 'Name and config are required for registration',
          timestamp
        });
      }

      try {
        circuitBreakerManager.registerCircuitBreaker(name, config);
        
        return res.status(201).json({
          success: true,
          data: {
            message: `Circuit breaker '${name}' registered successfully`,
            name,
            config,
            timestamp
          },
          timestamp
        });
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
          timestamp
        });
      }

    case 'remove':
      // Remove circuit breaker
      if (!service) {
        return res.status(400).json({
          success: false,
          error: 'Service name is required for removal',
          timestamp
        });
      }

      const removed = circuitBreakerManager.removeCircuitBreaker(service);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: `Service '${service}' not found`,
          timestamp
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          message: `Circuit breaker for '${service}' removed successfully`,
          service,
          timestamp
        },
        timestamp
      });

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
 * GET /api/monitoring/circuit-breakers - Get summary
 * GET /api/monitoring/circuit-breakers?action=health - Get health status
 * GET /api/monitoring/circuit-breakers?action=metrics - Get all metrics
 * GET /api/monitoring/circuit-breakers?action=service&service=orchestrator-strategy - Get specific service
 * GET /api/monitoring/circuit-breakers?action=unhealthy - Get unhealthy services
 * 
 * POST /api/monitoring/circuit-breakers?action=reset - Reset all circuit breakers
 * POST /api/monitoring/circuit-breakers?action=reset {"service": "orchestrator-strategy"} - Reset specific service
 * POST /api/monitoring/circuit-breakers?action=reset {"services": ["service1", "service2"]} - Reset multiple services
 */
