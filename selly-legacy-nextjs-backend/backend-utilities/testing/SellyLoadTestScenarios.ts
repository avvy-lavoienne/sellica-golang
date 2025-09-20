/**
 * SELLY Load Test Scenarios
 * Predefined test scenarios for comprehensive performance validation
 * 
 * Covers critical user journeys:
 * - SELLY AI chat interactions
 * - Authentication and session management
 * - Database operations and queries
 * - API endpoint performance
 * - Cache utilization and optimization
 */

import { LoadTestConfig, LoadTestScenario, UserJourneyStep, PerformanceTargets, ReportingConfig } from './ComprehensiveLoadTestingFramework';

export class SellyLoadTestScenarios {
  
  /**
   * Production-Ready Load Test Configuration
   * Simulates realistic production traffic patterns
   */
  static getProductionLoadTest(): LoadTestConfig {
    return {
      name: "SELLY Production Load Test",
      description: "Comprehensive production-ready load test simulating realistic user traffic patterns",
      scenarios: [
        this.getSellyAIChatScenario(),
        this.getAuthenticationFlowScenario(),
        this.getDashboardNavigationScenario(),
        this.getDatabaseQueryScenario(),
        this.getApiEndpointScenario()
      ],
      globalSettings: {
        baseUrl: process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000',
        maxConcurrentUsers: 500,
        testDuration: 600000, // 10 minutes
        rampUpTime: 120000, // 2 minutes
        coolDownTime: 60000 // 1 minute
      },
      performanceTargets: this.getProductionPerformanceTargets(),
      reportingConfig: this.getComprehensiveReportingConfig()
    };
  }

  /**
   * Stress Test Configuration
   * Tests system limits and breaking points
   */
  static getStressTest(): LoadTestConfig {
    return {
      name: "SELLY Stress Test",
      description: "High-load stress test to identify system breaking points and scalability limits",
      scenarios: [
        this.getHighVolumeSellyAIScenario(),
        this.getConcurrentAuthenticationScenario(),
        this.getDatabaseStressScenario()
      ],
      globalSettings: {
        baseUrl: process.env.LOAD_TEST_BASE_URL || 'http://localhost:3000',
        maxConcurrentUsers: 1000,
        testDuration: 300000, // 5 minutes
        rampUpTime: 60000, // 1 minute
        coolDownTime: 60000 // 1 minute
      },
      performanceTargets: this.getStressTestPerformanceTargets(),
      reportingConfig: this.getStressTestReportingConfig()
    };
  }

  /**
   * SELLY AI Chat Interaction Scenario
   * Tests AI response times and chat functionality under load
   */
  private static getSellyAIChatScenario(): LoadTestScenario {
    return {
      name: "SELLY AI Chat Interactions",
      weight: 40, // 40% of total traffic
      userJourney: [
        {
          name: "Navigate to Chat",
          type: "http",
          endpoint: "/",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 2000,
            contentType: "text/html"
          }
        },
        {
          name: "Initialize Chat Session",
          type: "http",
          endpoint: "/api/chat/session",
          method: "POST",
          payload: {
            sessionType: "load-test",
            userAgent: "LoadTest/1.0"
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        },
        {
          name: "Send Administrative Query",
          type: "http",
          endpoint: "/api/chat",
          method: "POST",
          payload: {
            message: "Berapa jumlah pengajuan hari ini?",
            sessionId: "{{sessionId}}",
            context: {
              userId: "load-test-user",
              timestamp: new Date().toISOString()
            }
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 2000, // Sub-2 second target
            contentType: "application/json",
            bodyContains: ["content", "metadata"]
          },
          validation: (response) => {
            return response.content && response.content.length > 0 &&
                   response.metadata && response.metadata.processingTime < 2000;
          }
        },
        {
          name: "Send Complex Query",
          type: "http",
          endpoint: "/api/chat",
          method: "POST",
          payload: {
            message: "Analisis trend pengajuan bulanan dan berikan rekomendasi optimasi",
            sessionId: "{{sessionId}}",
            context: {
              userId: "load-test-user",
              timestamp: new Date().toISOString(),
              complexQuery: true
            }
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 3000, // Allow more time for complex queries
            contentType: "application/json"
          }
        },
        {
          name: "Get Chat History",
          type: "http",
          endpoint: "/api/chat/history",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 200,
      requestsPerSecond: 50,
      duration: 600000, // 10 minutes
      thinkTime: { min: 2000, max: 8000 } // 2-8 seconds between requests
    };
  }

  /**
   * Authentication and Session Management Scenario
   */
  private static getAuthenticationFlowScenario(): LoadTestScenario {
    return {
      name: "Authentication and Session Management",
      weight: 25, // 25% of total traffic
      userJourney: [
        {
          name: "Load Login Page",
          type: "http",
          endpoint: "/auth/login",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1500,
            contentType: "text/html"
          }
        },
        {
          name: "Authenticate User",
          type: "http",
          endpoint: "/api/auth/login",
          method: "POST",
          payload: {
            email: "loadtest@example.com",
            password: "LoadTest123!",
            rememberMe: true
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 2000,
            contentType: "application/json"
          }
        },
        {
          name: "Create Session",
          type: "http",
          endpoint: "/api/session/create",
          method: "POST",
          payload: {
            sessionType: "authenticated",
            deviceInfo: {
              userAgent: "LoadTest/1.0",
              platform: "web"
            }
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        },
        {
          name: "Validate Session",
          type: "http",
          endpoint: "/api/session/validate",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 500,
            contentType: "application/json"
          }
        },
        {
          name: "Update Session Activity",
          type: "http",
          endpoint: "/api/session/activity",
          method: "PUT",
          payload: {
            activity: "chat_interaction",
            timestamp: new Date().toISOString()
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 500,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 125,
      requestsPerSecond: 25,
      duration: 600000,
      thinkTime: { min: 1000, max: 5000 }
    };
  }

  /**
   * Dashboard Navigation Scenario
   */
  private static getDashboardNavigationScenario(): LoadTestScenario {
    return {
      name: "Dashboard Navigation and Data Loading",
      weight: 20, // 20% of total traffic
      userJourney: [
        {
          name: "Load Dashboard",
          type: "http",
          endpoint: "/dashboard",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 2000,
            contentType: "text/html"
          }
        },
        {
          name: "Load Dashboard Data",
          type: "http",
          endpoint: "/api/dashboard/data",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1500,
            contentType: "application/json"
          }
        },
        {
          name: "Load Statistics",
          type: "http",
          endpoint: "/api/dashboard/statistics",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        },
        {
          name: "Load Recent Activities",
          type: "http",
          endpoint: "/api/dashboard/activities",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 100,
      requestsPerSecond: 20,
      duration: 600000,
      thinkTime: { min: 3000, max: 10000 }
    };
  }

  /**
   * Database Query Performance Scenario
   */
  private static getDatabaseQueryScenario(): LoadTestScenario {
    return {
      name: "Database Query Performance",
      weight: 10, // 10% of total traffic
      userJourney: [
        {
          name: "Query Pengajuan Bulanan",
          type: "http",
          endpoint: "/api/data/pengajuan-bulanan",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1500,
            contentType: "application/json"
          }
        },
        {
          name: "Query Salah Rekam",
          type: "http",
          endpoint: "/api/data/salah-rekam",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1500,
            contentType: "application/json"
          }
        },
        {
          name: "Query User Activities",
          type: "http",
          endpoint: "/api/data/aktivitas-user",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        },
        {
          name: "Complex Analytics Query",
          type: "http",
          endpoint: "/api/analytics/complex",
          method: "POST",
          payload: {
            query: "monthly_trends",
            filters: {
              dateRange: "last_30_days",
              includeDetails: true
            }
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 3000,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 50,
      requestsPerSecond: 10,
      duration: 600000,
      thinkTime: { min: 5000, max: 15000 }
    };
  }

  /**
   * API Endpoint Performance Scenario
   */
  private static getApiEndpointScenario(): LoadTestScenario {
    return {
      name: "API Endpoint Performance",
      weight: 5, // 5% of total traffic
      userJourney: [
        {
          name: "Health Check",
          type: "http",
          endpoint: "/api/health",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 500,
            contentType: "application/json"
          }
        },
        {
          name: "System Status",
          type: "http",
          endpoint: "/api/system/status",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        },
        {
          name: "Performance Metrics",
          type: "http",
          endpoint: "/api/monitoring/metrics",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 1000,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 25,
      requestsPerSecond: 5,
      duration: 600000,
      thinkTime: { min: 10000, max: 30000 }
    };
  }

  /**
   * High Volume SELLY AI Scenario for Stress Testing
   */
  private static getHighVolumeSellyAIScenario(): LoadTestScenario {
    return {
      name: "High Volume SELLY AI Stress Test",
      weight: 60,
      userJourney: [
        {
          name: "Rapid Fire AI Queries",
          type: "http",
          endpoint: "/api/chat",
          method: "POST",
          payload: {
            message: "Status sistem hari ini?",
            sessionId: "stress-test-session",
            context: { stressTest: true }
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 5000, // More lenient for stress test
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 600,
      requestsPerSecond: 100,
      duration: 300000,
      thinkTime: { min: 500, max: 2000 } // Faster think time for stress
    };
  }

  /**
   * Concurrent Authentication Scenario for Stress Testing
   */
  private static getConcurrentAuthenticationScenario(): LoadTestScenario {
    return {
      name: "Concurrent Authentication Stress Test",
      weight: 25,
      userJourney: [
        {
          name: "Concurrent Login",
          type: "http",
          endpoint: "/api/auth/login",
          method: "POST",
          payload: {
            email: "stresstest@example.com",
            password: "StressTest123!"
          },
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 3000,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 250,
      requestsPerSecond: 50,
      duration: 300000,
      thinkTime: { min: 1000, max: 3000 }
    };
  }

  /**
   * Database Stress Scenario
   */
  private static getDatabaseStressScenario(): LoadTestScenario {
    return {
      name: "Database Connection Stress Test",
      weight: 15,
      userJourney: [
        {
          name: "Heavy Database Query",
          type: "http",
          endpoint: "/api/data/heavy-query",
          method: "GET",
          expectedResponse: {
            statusCode: 200,
            maxResponseTime: 5000,
            contentType: "application/json"
          }
        }
      ],
      concurrentUsers: 150,
      requestsPerSecond: 30,
      duration: 300000,
      thinkTime: { min: 2000, max: 5000 }
    };
  }

  /**
   * Production Performance Targets
   */
  private static getProductionPerformanceTargets(): PerformanceTargets {
    return {
      maxResponseTimeP50: 1000, // 1 second for 50th percentile
      maxResponseTimeP95: 2000, // 2 seconds for 95th percentile
      maxResponseTimeP99: 3000, // 3 seconds for 99th percentile
      
      sellyAIResponseTime: 2000, // Sub-2 second target
      authenticationTime: 2000,
      databaseQueryTime: 1500,
      
      minCacheHitRate: 0.85, // 85%+ target
      maxMemoryUsage: 400, // <400MB target
      
      minThroughput: 100, // requests per second
      maxErrorRate: 0.01, // 1% error rate
      
      maxConcurrentUsers: 500,
      autoScalingResponseTime: 30000 // 30 seconds to scale
    };
  }

  /**
   * Stress Test Performance Targets (More Lenient)
   */
  private static getStressTestPerformanceTargets(): PerformanceTargets {
    return {
      maxResponseTimeP50: 2000,
      maxResponseTimeP95: 5000,
      maxResponseTimeP99: 10000,
      
      sellyAIResponseTime: 5000,
      authenticationTime: 3000,
      databaseQueryTime: 3000,
      
      minCacheHitRate: 0.70, // 70% acceptable under stress
      maxMemoryUsage: 800, // Higher memory usage acceptable
      
      minThroughput: 50,
      maxErrorRate: 0.05, // 5% error rate acceptable under stress
      
      maxConcurrentUsers: 1000,
      autoScalingResponseTime: 60000 // 1 minute to scale under stress
    };
  }

  /**
   * Comprehensive Reporting Configuration
   */
  private static getComprehensiveReportingConfig(): ReportingConfig {
    return {
      enableRealTimeMetrics: true,
      metricsInterval: 5000, // 5 seconds
      generateDetailedReport: true,
      exportFormats: ['json', 'html', 'csv'],
      includeGraphs: true,
      alertThresholds: {
        responseTimeThreshold: 3000,
        errorRateThreshold: 0.02, // 2%
        memoryUsageThreshold: 500 // MB
      }
    };
  }

  /**
   * Stress Test Reporting Configuration
   */
  private static getStressTestReportingConfig(): ReportingConfig {
    return {
      enableRealTimeMetrics: true,
      metricsInterval: 2000, // 2 seconds for more frequent monitoring
      generateDetailedReport: true,
      exportFormats: ['json', 'html'],
      includeGraphs: true,
      alertThresholds: {
        responseTimeThreshold: 10000,
        errorRateThreshold: 0.10, // 10%
        memoryUsageThreshold: 1000 // MB
      }
    };
  }
}

export default SellyLoadTestScenarios;
