/**
 * Analytics Dashboard API Tests
 * Testing real-time analytics data endpoints and export functionality
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { GET, POST, PATCH, PUT } from '../dashboard/route';

// Mock dependencies
jest.mock('@/services/analytics/enhancedSessionAnalytics');
jest.mock('@/services/session/storage');
jest.mock('@/lib/supabase');

describe('Analytics Dashboard API', () => {
  let mockRequest: Partial<NextRequest>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      url: 'http://localhost:3000/api/analytics/dashboard',
      headers: new Headers({
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-token'
      }),
      json: jest.fn()
    };
  });

  describe('GET /api/analytics/dashboard', () => {
    it('should return dashboard data successfully', async () => {
      const mockDashboardData = {
        overview: {
          totalSessions: 1250,
          activeSessions: 45,
          conversionRate: 0.23,
          satisfactionScore: 4.2
        },
        realTimeMetrics: {
          responseTime: 850,
          throughput: 125,
          errorRate: 0.02
        },
        insights: [],
        alerts: []
      };

      // Mock analytics service
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue(mockDashboardData)
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: true,
        data: mockDashboardData,
        timestamp: expect.any(String)
      });
    });

    it('should handle query parameters for time range filtering', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue({})
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/dashboard?start=2024-01-01&end=2024-01-31&sessionId=test-session'
      );
      
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      expect(mockAnalytics.getDashboard).toHaveBeenCalledWith({
        timeRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        },
        sessionId: 'test-session'
      });
    });

    it('should handle authentication errors', async () => {
      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard', {
        headers: new Headers({
          'Content-Type': 'application/json'
          // No Authorization header
        })
      });
      
      const response = await GET(request);
      
      expect(response.status).toBe(401);
      
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: 'Unauthorized'
      });
    });

    it('should handle service errors gracefully', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockRejectedValue(new Error('Service unavailable'))
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: 'Failed to fetch analytics data'
      });
    });
  });

  describe('POST /api/analytics/dashboard/export', () => {
    it('should export data in JSON format', async () => {
      const mockAnalytics = {
        exportData: jest.fn().mockResolvedValue({
          data: JSON.stringify({ sessions: [], events: [] }),
          filename: 'analytics-export.json',
          mimeType: 'application/json'
        })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        format: 'json',
        timeRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        excludePersonalData: false
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        headers: new Headers({
          'Content-Type': 'application/json',
          'Authorization': 'Bearer test-token'
        }),
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('application/json');
      expect(response.headers.get('Content-Disposition')).toContain('analytics-export.json');
    });

    it('should export data in CSV format', async () => {
      const mockAnalytics = {
        exportData: jest.fn().mockResolvedValue({
          data: 'sessionId,timestamp,eventType\nsession1,2024-01-01,user_action',
          filename: 'analytics-export.csv',
          mimeType: 'text/csv'
        })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        format: 'csv',
        timeRange: {
          start: '2024-01-01',
          end: '2024-01-31'
        },
        excludePersonalData: true
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      expect(mockAnalytics.exportData).toHaveBeenCalledWith('csv', expect.any(Object), true);
    });

    it('should validate export request parameters', async () => {
      const invalidRequestBody = {
        format: 'invalid_format',
        timeRange: {
          start: 'invalid-date'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        body: JSON.stringify(invalidRequestBody)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid')
      });
    });

    it('should handle large export requests', async () => {
      const mockAnalytics = {
        exportData: jest.fn().mockResolvedValue({
          data: 'large_data_content'.repeat(10000),
          filename: 'large-export.json',
          mimeType: 'application/json'
        })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        format: 'json',
        timeRange: {
          start: '2024-01-01',
          end: '2024-12-31'
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Length')).toBeDefined();
    });
  });

  describe('PATCH /api/analytics/dashboard/alerts', () => {
    it('should acknowledge alerts successfully', async () => {
      const mockAnalytics = {
        acknowledgeAlert: jest.fn().mockResolvedValue(true),
        getAlerts: jest.fn().mockResolvedValue([])
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        action: 'acknowledge',
        alertIds: ['alert-1', 'alert-2']
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/alerts', {
        method: 'PATCH',
        body: JSON.stringify(requestBody)
      });

      const response = await PATCH(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData).toMatchObject({
        success: true,
        acknowledgedAlerts: ['alert-1', 'alert-2']
      });
    });

    it('should dismiss alerts', async () => {
      const mockAnalytics = {
        dismissAlert: jest.fn().mockResolvedValue(true)
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        action: 'dismiss',
        alertIds: ['alert-3']
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/alerts', {
        method: 'PATCH',
        body: JSON.stringify(requestBody)
      });

      const response = await PATCH(request);
      
      expect(response.status).toBe(200);
      expect(mockAnalytics.dismissAlert).toHaveBeenCalledWith('alert-3');
    });

    it('should validate alert management requests', async () => {
      const invalidRequestBody = {
        action: 'invalid_action',
        alertIds: []
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/alerts', {
        method: 'PATCH',
        body: JSON.stringify(invalidRequestBody)
      });

      const response = await PATCH(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('PUT /api/analytics/dashboard/config', () => {
    it('should update dashboard configuration', async () => {
      const mockAnalytics = {
        updateConfiguration: jest.fn().mockResolvedValue(true)
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const configUpdate = {
        refreshInterval: 15000,
        enableRealTimeAlerts: true,
        alertThresholds: {
          responseTime: 2000,
          errorRate: 0.05
        }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/config', {
        method: 'PUT',
        body: JSON.stringify(configUpdate)
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(200);
      expect(mockAnalytics.updateConfiguration).toHaveBeenCalledWith(configUpdate);
    });

    it('should validate configuration parameters', async () => {
      const invalidConfig = {
        refreshInterval: -1000, // Invalid negative interval
        enableRealTimeAlerts: 'invalid_boolean'
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/config', {
        method: 'PUT',
        body: JSON.stringify(invalidConfig)
      });

      const response = await PUT(request);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should enforce rate limits for export requests', async () => {
      const mockAnalytics = {
        exportData: jest.fn().mockResolvedValue({
          data: 'test_data',
          filename: 'test.json',
          mimeType: 'application/json'
        })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        format: 'json',
        timeRange: { start: '2024-01-01', end: '2024-01-31' }
      };

      // Make multiple rapid requests
      const requests = Array.from({ length: 10 }, () => 
        new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
          method: 'POST',
          body: JSON.stringify(requestBody)
        })
      );

      const responses = await Promise.all(requests.map(req => POST(req)));
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should allow reasonable request frequency', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue({})
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      // Make requests with reasonable spacing
      const request1 = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response1 = await GET(request1);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const request2 = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response2 = await GET(request2);
      
      expect(response1.status).toBe(200);
      expect(response2.status).toBe(200);
    });
  });

  describe('Data Validation', () => {
    it('should validate time range parameters', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/dashboard?start=invalid-date&end=2024-01-31'
      );
      
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Invalid date format');
    });

    it('should validate session ID format', async () => {
      const request = new NextRequest(
        'http://localhost:3000/api/analytics/dashboard?sessionId=invalid-session-id-format'
      );
      
      const response = await GET(request);
      
      expect(response.status).toBe(400);
    });

    it('should handle missing required parameters gracefully', async () => {
      const requestBody = {
        // Missing format parameter
        timeRange: { start: '2024-01-01', end: '2024-01-31' }
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      const response = await POST(request);
      
      expect(response.status).toBe(400);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('format');
    });
  });

  describe('Performance', () => {
    it('should respond within acceptable time limits', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue({})
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      
      const startTime = performance.now();
      const response = await GET(request);
      const responseTime = performance.now() - startTime;
      
      expect(response.status).toBe(200);
      expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
    });

    it('should handle concurrent requests efficiently', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue({})
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/analytics/dashboard')
      );

      const startTime = performance.now();
      const responses = await Promise.all(requests.map(req => GET(req)));
      const totalTime = performance.now() - startTime;
      
      expect(responses.every(res => res.status === 200)).toBe(true);
      expect(totalTime).toBeLessThan(5000); // Should handle 5 concurrent requests efficiently
    });

    it('should implement response caching for repeated requests', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue({ cached: true })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request1 = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const request2 = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      
      await GET(request1);
      await GET(request2);
      
      // Second request should use cached data
      expect(mockAnalytics.getDashboard).toHaveBeenCalledTimes(1);
    });
  });

  describe('Security', () => {
    it('should validate user permissions for sensitive data', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue({})
      };

      // Mock user without admin permissions
      jest.mocked(require('@/lib/supabase').supabase.auth.getUser).mockResolvedValue({
        data: { user: { id: 'user123', role: 'user' } },
        error: null
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analytics/dashboard?includePersonalData=true'
      );
      
      const response = await GET(request);
      
      expect(response.status).toBe(403);
    });

    it('should sanitize exported data based on user role', async () => {
      const mockAnalytics = {
        exportData: jest.fn().mockResolvedValue({
          data: JSON.stringify({ sanitized: true }),
          filename: 'export.json',
          mimeType: 'application/json'
        })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const requestBody = {
        format: 'json',
        timeRange: { start: '2024-01-01', end: '2024-01-31' },
        excludePersonalData: false
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);
      
      // Should force personal data exclusion for non-admin users
      expect(mockAnalytics.exportData).toHaveBeenCalledWith('json', expect.any(Object), true);
    });

    it('should log security-relevant actions', async () => {
      const mockLogger = jest.fn();
      
      jest.doMock('@/lib/logger', () => ({
        logger: { info: mockLogger, warn: mockLogger, error: mockLogger }
      }));

      const requestBody = {
        format: 'json',
        timeRange: { start: '2024-01-01', end: '2024-01-31' },
        excludePersonalData: false
      };

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard/export', {
        method: 'POST',
        body: JSON.stringify(requestBody)
      });

      await POST(request);
      
      expect(mockLogger).toHaveBeenCalledWith(
        expect.stringContaining('Analytics data export'),
        expect.objectContaining({
          userId: expect.any(String),
          format: 'json',
          excludePersonalData: expect.any(Boolean)
        })
      );
    });
  });

  describe('Indonesian Administrative Context', () => {
    it('should return localized error messages', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockRejectedValue(new Error('Service error'))
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard', {
        headers: new Headers({
          'Accept-Language': 'id-ID'
        })
      });
      
      const response = await GET(request);
      
      expect(response.status).toBe(500);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Gagal memuat data analitik');
    });

    it('should format administrative service data appropriately', async () => {
      const mockDashboardData = {
        overview: {
          totalSessions: 1250,
          topServices: ['KTP', 'Kartu_Keluarga', 'BPJS_Kesehatan']
        },
        administrativeServices: {
          KTP: { inquiries: 450, conversionRate: 0.35 },
          Kartu_Keluarga: { inquiries: 320, conversionRate: 0.28 },
          BPJS_Kesehatan: { inquiries: 280, conversionRate: 0.22 }
        }
      };

      const mockAnalytics = {
        getDashboard: jest.fn().mockResolvedValue(mockDashboardData)
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response = await GET(request);
      
      const responseData = await response.json();
      expect(responseData.data.administrativeServices).toMatchObject({
        KTP: expect.objectContaining({ inquiries: 450 }),
        Kartu_Keluarga: expect.objectContaining({ inquiries: 320 }),
        BPJS_Kesehatan: expect.objectContaining({ inquiries: 280 })
      });
    });
  });

  describe('Error Recovery', () => {
    it('should provide fallback data when primary analytics fail', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockRejectedValue(new Error('Primary service down')),
        getFallbackDashboard: jest.fn().mockResolvedValue({
          overview: { totalSessions: 0, activeSessions: 0 },
          realTimeMetrics: { responseTime: 0, throughput: 0, errorRate: 0 }
        })
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response = await GET(request);
      
      expect(response.status).toBe(200);
      
      const responseData = await response.json();
      expect(responseData.data).toBeDefined();
      expect(responseData.fallback).toBe(true);
    });

    it('should handle database connection failures', async () => {
      jest.mocked(require('@/lib/supabase').supabase.from).mockImplementation(() => {
        throw new Error('Database connection failed');
      });

      const request = new NextRequest('http://localhost:3000/api/analytics/dashboard');
      const response = await GET(request);
      
      expect(response.status).toBe(503);
      
      const responseData = await response.json();
      expect(responseData.error).toContain('Service temporarily unavailable');
    });

    it('should implement circuit breaker for failing services', async () => {
      const mockAnalytics = {
        getDashboard: jest.fn().mockRejectedValue(new Error('Service failure'))
      };

      jest.mocked(require('@/services/analytics/enhancedSessionAnalytics').EnhancedSessionAnalytics)
        .mockImplementation(() => mockAnalytics);

      // Make multiple failing requests
      const requests = Array.from({ length: 5 }, () => 
        new NextRequest('http://localhost:3000/api/analytics/dashboard')
      );

      const responses = await Promise.all(requests.map(req => GET(req)));
      
      // Later requests should be circuit-broken
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(503);
      
      const responseData = await lastResponse.json();
      expect(responseData.error).toContain('Circuit breaker');
    });
  });
});
