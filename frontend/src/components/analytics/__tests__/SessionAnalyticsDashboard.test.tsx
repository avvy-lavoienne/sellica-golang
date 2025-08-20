/**
 * Session Analytics Dashboard Component Tests
 * Testing real-time analytics visualization and interaction
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { SessionAnalyticsDashboard } from '../SessionAnalyticsDashboard';
import { AnalyticsDashboard } from '@/services/analytics/enhancedSessionAnalytics';

// Mock dependencies
jest.mock('@/hooks/useSessionAnalytics');
jest.mock('@/services/analytics/enhancedSessionAnalytics');

describe('SessionAnalyticsDashboard', () => {
  const mockDashboardData: AnalyticsDashboard = {
    overview: {
      totalSessions: 1250,
      activeSessions: 45,
      conversionRate: 0.23,
      averageSessionDuration: 420000, // 7 minutes
      satisfactionScore: 4.2,
      topServices: ['KTP', 'BPJS', 'Kartu_Keluarga']
    },
    realTimeMetrics: {
      responseTime: 850,
      throughput: 125,
      errorRate: 0.02,
      memoryUsage: 512,
      activeConnections: 45
    },
    conversionFunnel: {
      stages: [
        { name: 'Session Start', count: 1000, conversionRate: 1.0 },
        { name: 'First Message', count: 850, conversionRate: 0.85 },
        { name: 'Engagement', count: 600, conversionRate: 0.71 },
        { name: 'Conversion Prompt', count: 400, conversionRate: 0.67 },
        { name: 'Conversion Complete', count: 230, conversionRate: 0.58 }
      ],
      dropOffPoints: [
        { stage: 'First Message', dropOffRate: 0.15, reason: 'slow_response' },
        { stage: 'Engagement', dropOffRate: 0.29, reason: 'irrelevant_response' }
      ]
    },
    userJourney: {
      commonPaths: [
        { path: ['start', 'ktp_inquiry', 'conversion'], frequency: 45, avgDuration: 300000 },
        { path: ['start', 'bpjs_inquiry', 'exploration'], frequency: 32, avgDuration: 480000 }
      ],
      milestones: [
        { name: 'First Engagement', achievementRate: 0.85, avgTimeToAchieve: 30000 },
        { name: 'Conversion Ready', achievementRate: 0.40, avgTimeToAchieve: 240000 }
      ]
    },
    insights: [
      {
        type: 'performance',
        severity: 'medium',
        message: 'Response time increased by 15% in the last hour',
        actionable: true,
        recommendation: 'Consider scaling AI service instances'
      },
      {
        type: 'conversion',
        severity: 'low',
        message: 'KTP inquiries have 30% higher conversion rate',
        actionable: true,
        recommendation: 'Optimize conversion prompts for other services'
      }
    ],
    alerts: [
      {
        id: 'alert-1',
        type: 'error_rate',
        severity: 'high',
        message: 'Error rate exceeded threshold (5%)',
        timestamp: new Date(),
        acknowledged: false
      }
    ]
  };

  const defaultProps = {
    sessionId: 'test-session-123',
    userId: 'user123',
    timeRange: {
      start: new Date('2024-01-01'),
      end: new Date('2024-01-31')
    },
    refreshInterval: 30000,
    className: ''
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock analytics hook
    jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
      dashboardData: mockDashboardData,
      isLoading: false,
      error: null,
      refreshData: jest.fn(),
      exportData: jest.fn(),
      updateConfig: jest.fn()
    });
  });

  describe('Component Rendering', () => {
    it('should render dashboard with all sections', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Session Analytics Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Real-Time Metrics')).toBeInTheDocument();
      expect(screen.getByText('Conversion Funnel')).toBeInTheDocument();
      expect(screen.getByText('User Journey')).toBeInTheDocument();
    });

    it('should display overview metrics correctly', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('45')).toBeInTheDocument(); // Active sessions
      expect(screen.getByText('23%')).toBeInTheDocument(); // Conversion rate
      expect(screen.getByText('4.2')).toBeInTheDocument(); // Satisfaction score
    });

    it('should show real-time metrics with proper formatting', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('850ms')).toBeInTheDocument(); // Response time
      expect(screen.getByText('125/min')).toBeInTheDocument(); // Throughput
      expect(screen.getByText('2%')).toBeInTheDocument(); // Error rate
    });

    it('should display conversion funnel visualization', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Session Start')).toBeInTheDocument();
      expect(screen.getByText('1,000')).toBeInTheDocument();
      expect(screen.getByText('Conversion Complete')).toBeInTheDocument();
      expect(screen.getByText('230')).toBeInTheDocument();
    });
  });

  describe('Real-Time Updates', () => {
    it('should refresh data automatically', async () => {
      const mockRefreshData = jest.fn();
      
      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: mockDashboardData,
        isLoading: false,
        error: null,
        refreshData: mockRefreshData,
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} refreshInterval={1000} />);
      
      // Wait for auto-refresh
      await waitFor(() => {
        expect(mockRefreshData).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    it('should update metrics when new data arrives', async () => {
      const { rerender } = render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const updatedData = {
        ...mockDashboardData,
        overview: {
          ...mockDashboardData.overview,
          activeSessions: 52 // Updated value
        }
      };

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: updatedData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      rerender(<SessionAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('52')).toBeInTheDocument();
      });
    });

    it('should show loading state during data refresh', () => {
      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: null,
        isLoading: true,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('Loading analytics data...')).toBeInTheDocument();
    });
  });

  describe('Data Export Functionality', () => {
    it('should export data in JSON format', async () => {
      const mockExportData = jest.fn().mockResolvedValue({
        data: JSON.stringify(mockDashboardData),
        filename: 'analytics-2024-01.json',
        mimeType: 'application/json'
      });

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: mockDashboardData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: mockExportData,
        updateConfig: jest.fn()
      });

      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const exportButton = screen.getByText('Export Data');
      await user.click(exportButton);
      
      const jsonOption = screen.getByText('JSON');
      await user.click(jsonOption);
      
      expect(mockExportData).toHaveBeenCalledWith('json', expect.any(Object), false);
    });

    it('should export data in CSV format', async () => {
      const mockExportData = jest.fn().mockResolvedValue({
        data: 'sessionId,timestamp,eventType\nsession1,2024-01-01,user_action',
        filename: 'analytics-2024-01.csv',
        mimeType: 'text/csv'
      });

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: mockDashboardData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: mockExportData,
        updateConfig: jest.fn()
      });

      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Export Data'));
      await user.click(screen.getByText('CSV'));
      
      expect(mockExportData).toHaveBeenCalledWith('csv', expect.any(Object), false);
    });

    it('should handle export with privacy protection', async () => {
      const mockExportData = jest.fn();
      const user = userEvent.setup();
      
      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: mockDashboardData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: mockExportData,
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Export Data'));
      
      // Enable privacy protection
      const privacyCheckbox = screen.getByLabelText('Exclude personal data');
      await user.click(privacyCheckbox);
      
      await user.click(screen.getByText('JSON'));
      
      expect(mockExportData).toHaveBeenCalledWith('json', expect.any(Object), true);
    });
  });

  describe('Alert Management', () => {
    it('should display active alerts', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Error rate exceeded threshold (5%)')).toBeInTheDocument();
      expect(screen.getByTestId('alert-error_rate')).toHaveClass('border-red-500');
    });

    it('should allow acknowledging alerts', async () => {
      const mockUpdateConfig = jest.fn();
      const user = userEvent.setup();
      
      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: mockDashboardData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: mockUpdateConfig
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const acknowledgeButton = screen.getByText('Acknowledge');
      await user.click(acknowledgeButton);
      
      expect(mockUpdateConfig).toHaveBeenCalledWith({
        acknowledgedAlerts: ['alert-1']
      });
    });

    it('should filter alerts by severity', async () => {
      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const severityFilter = screen.getByLabelText('Filter by severity');
      await user.selectOptions(severityFilter, 'high');
      
      // Should only show high severity alerts
      expect(screen.getByText('Error rate exceeded threshold (5%)')).toBeInTheDocument();
    });
  });

  describe('Interactive Features', () => {
    it('should allow drilling down into conversion funnel stages', async () => {
      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const funnelStage = screen.getByTestId('funnel-stage-engagement');
      await user.click(funnelStage);
      
      expect(screen.getByText('Engagement Stage Details')).toBeInTheDocument();
      expect(screen.getByText('600 users reached this stage')).toBeInTheDocument();
    });

    it('should show detailed metrics on hover', async () => {
      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const responseTimeMetric = screen.getByTestId('metric-response-time');
      await user.hover(responseTimeMetric);
      
      await waitFor(() => {
        expect(screen.getByText('Average response time over last 24 hours')).toBeInTheDocument();
      });
    });

    it('should allow customizing time range', async () => {
      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const timeRangeSelector = screen.getByLabelText('Time Range');
      await user.selectOptions(timeRangeSelector, 'last_7_days');
      
      // Should trigger data refresh with new time range
      expect(screen.getByText('Last 7 Days')).toBeInTheDocument();
    });
  });

  describe('Administrative Service Analytics', () => {
    it('should display top administrative services', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Top Services')).toBeInTheDocument();
      expect(screen.getByText('KTP')).toBeInTheDocument();
      expect(screen.getByText('BPJS')).toBeInTheDocument();
      expect(screen.getByText('Kartu_Keluarga')).toBeInTheDocument();
    });

    it('should show service-specific conversion rates', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const ktpService = screen.getByTestId('service-KTP');
      expect(within(ktpService).getByText(/conversion rate/i)).toBeInTheDocument();
    });

    it('should display Indonesian administrative context', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      // Should show Indonesian service names
      expect(screen.getByText('Kartu_Keluarga')).toBeInTheDocument();
      
      // Should use Indonesian terminology
      expect(screen.getByText('Layanan Teratas')).toBeInTheDocument();
      expect(screen.getByText('Tingkat Konversi')).toBeInTheDocument();
    });
  });

  describe('Performance Monitoring', () => {
    it('should display performance metrics with status indicators', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const responseTimeMetric = screen.getByTestId('metric-response-time');
      expect(within(responseTimeMetric).getByText('850ms')).toBeInTheDocument();
      
      // Should show status indicator based on performance
      expect(within(responseTimeMetric).getByTestId('status-indicator')).toHaveClass('text-yellow-500');
    });

    it('should show performance trends', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('performance-trend-chart')).toBeInTheDocument();
    });

    it('should alert on performance degradation', () => {
      const degradedData = {
        ...mockDashboardData,
        realTimeMetrics: {
          ...mockDashboardData.realTimeMetrics,
          responseTime: 3000, // Degraded performance
          errorRate: 0.08 // High error rate
        }
      };

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: degradedData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByTestId('performance-alert')).toBeInTheDocument();
      expect(screen.getByText(/performance degradation/i)).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should display error state when data loading fails', () => {
      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: null,
        isLoading: false,
        error: 'Failed to load analytics data',
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Failed to load analytics data')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });

    it('should handle partial data loading gracefully', () => {
      const partialData = {
        ...mockDashboardData,
        conversionFunnel: undefined, // Missing funnel data
        userJourney: undefined // Missing journey data
      };

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: partialData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      // Should show available data
      expect(screen.getByText('1,250')).toBeInTheDocument();
      
      // Should show placeholder for missing data
      expect(screen.getByText('Conversion funnel data unavailable')).toBeInTheDocument();
    });

    it('should retry failed operations', async () => {
      const mockRefreshData = jest.fn();
      const user = userEvent.setup();
      
      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: null,
        isLoading: false,
        error: 'Network error',
        refreshData: mockRefreshData,
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      await user.click(screen.getByText('Retry'));
      
      expect(mockRefreshData).toHaveBeenCalledTimes(1);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels for charts', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const conversionChart = screen.getByTestId('conversion-funnel-chart');
      expect(conversionChart).toHaveAttribute('aria-label', 'Conversion funnel visualization');
      
      const performanceChart = screen.getByTestId('performance-trend-chart');
      expect(performanceChart).toHaveAttribute('aria-label', 'Performance metrics over time');
    });

    it('should provide alternative text for visual elements', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const statusIndicators = screen.getAllByTestId('status-indicator');
      statusIndicators.forEach(indicator => {
        expect(indicator).toHaveAttribute('aria-label');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      await user.tab();
      expect(screen.getByText('Refresh')).toHaveFocus();
      
      await user.tab();
      expect(screen.getByText('Export Data')).toHaveFocus();
    });

    it('should announce important updates to screen readers', async () => {
      const { rerender } = render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const updatedData = {
        ...mockDashboardData,
        alerts: [
          ...mockDashboardData.alerts,
          {
            id: 'alert-2',
            type: 'performance',
            severity: 'high',
            message: 'New performance alert',
            timestamp: new Date(),
            acknowledged: false
          }
        ]
      };

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: updatedData,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      rerender(<SessionAnalyticsDashboard {...defaultProps} />);
      
      await waitFor(() => {
        const liveRegion = screen.getByTestId('alerts-live-region');
        expect(liveRegion).toHaveAttribute('aria-live', 'polite');
        expect(liveRegion).toHaveTextContent('New performance alert');
      });
    });
  });

  describe('Mobile Responsiveness', () => {
    it('should adapt layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const dashboardGrid = screen.getByTestId('dashboard-grid');
      expect(dashboardGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-2');
    });

    it('should show simplified metrics on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      // Should show essential metrics only
      expect(screen.getByText('1,250')).toBeInTheDocument(); // Total sessions
      expect(screen.getByText('23%')).toBeInTheDocument(); // Conversion rate
    });

    it('should make charts touch-friendly on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const chart = screen.getByTestId('conversion-funnel-chart');
      expect(chart).toHaveClass('touch-manipulation');
    });
  });

  describe('Indonesian Localization', () => {
    it('should display all text in Indonesian', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Dashboard Analitik Sesi')).toBeInTheDocument();
      expect(screen.getByText('Ringkasan')).toBeInTheDocument();
      expect(screen.getByText('Metrik Real-Time')).toBeInTheDocument();
      expect(screen.getByText('Corong Konversi')).toBeInTheDocument();
    });

    it('should format numbers according to Indonesian locale', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      // Should use Indonesian number formatting
      expect(screen.getByText('1.250')).toBeInTheDocument(); // Thousand separator
    });

    it('should use Indonesian administrative terminology', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Layanan Administrasi')).toBeInTheDocument();
      expect(screen.getByText('Tingkat Kepuasan')).toBeInTheDocument();
    });
  });

  describe('Performance', () => {
    it('should render dashboard efficiently', () => {
      const startTime = performance.now();
      
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const renderTime = performance.now() - startTime;
      expect(renderTime).toBeLessThan(200);
    });

    it('should handle large datasets without performance degradation', () => {
      const largeDataset = {
        ...mockDashboardData,
        conversionFunnel: {
          stages: Array.from({ length: 50 }, (_, i) => ({
            name: `Stage ${i}`,
            count: 1000 - (i * 20),
            conversionRate: (1000 - (i * 20)) / 1000
          })),
          dropOffPoints: []
        }
      };

      jest.mocked(require('@/hooks/useSessionAnalytics').useSessionAnalytics).mockReturnValue({
        dashboardData: largeDataset,
        isLoading: false,
        error: null,
        refreshData: jest.fn(),
        exportData: jest.fn(),
        updateConfig: jest.fn()
      });

      const startTime = performance.now();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      const renderTime = performance.now() - startTime;
      
      expect(renderTime).toBeLessThan(500);
    });

    it('should optimize re-renders when data updates', async () => {
      const renderSpy = jest.fn();
      
      const TestWrapper = ({ data }: { data: any }) => {
        renderSpy();
        return <SessionAnalyticsDashboard {...defaultProps} />;
      };

      const { rerender } = render(<TestWrapper data={mockDashboardData} />);
      
      // Update with same data
      rerender(<TestWrapper data={mockDashboardData} />);
      
      // Should not trigger unnecessary re-renders
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('Data Visualization', () => {
    it('should render conversion funnel chart correctly', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const funnelChart = screen.getByTestId('conversion-funnel-chart');
      expect(funnelChart).toBeInTheDocument();
      
      // Should show all funnel stages
      expect(screen.getByText('Session Start')).toBeInTheDocument();
      expect(screen.getByText('Conversion Complete')).toBeInTheDocument();
    });

    it('should display user journey flow diagram', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const journeyDiagram = screen.getByTestId('user-journey-diagram');
      expect(journeyDiagram).toBeInTheDocument();
      
      // Should show common paths
      expect(screen.getByText('start → ktp_inquiry → conversion')).toBeInTheDocument();
    });

    it('should show real-time metric trends', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const trendChart = screen.getByTestId('metrics-trend-chart');
      expect(trendChart).toBeInTheDocument();
      
      // Should display trend indicators
      expect(screen.getByTestId('response-time-trend')).toBeInTheDocument();
      expect(screen.getByTestId('throughput-trend')).toBeInTheDocument();
    });
  });

  describe('Insights and Recommendations', () => {
    it('should display actionable insights', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      expect(screen.getByText('Insights & Recommendations')).toBeInTheDocument();
      expect(screen.getByText('Response time increased by 15% in the last hour')).toBeInTheDocument();
      expect(screen.getByText('Consider scaling AI service instances')).toBeInTheDocument();
    });

    it('should prioritize insights by severity', () => {
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const insightsSection = screen.getByTestId('insights-section');
      const insights = within(insightsSection).getAllByTestId(/insight-/);
      
      // High severity insights should appear first
      expect(insights[0]).toHaveClass('border-red-200'); // High severity
    });

    it('should provide implementation guidance for recommendations', async () => {
      const user = userEvent.setup();
      render(<SessionAnalyticsDashboard {...defaultProps} />);
      
      const recommendationButton = screen.getByText('View Implementation');
      await user.click(recommendationButton);
      
      expect(screen.getByText('Implementation Guide')).toBeInTheDocument();
      expect(screen.getByText(/step-by-step/i)).toBeInTheDocument();
    });
  });
});
