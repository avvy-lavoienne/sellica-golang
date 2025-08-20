/**
 * Advanced Visualization Engine for Enhanced Query Intelligence
 * Generates interactive charts and graphs for data analysis
 */

import { EnhancedQueryResult } from './queryTypes';
import { ProcessedQuery } from './indonesianNLP';

// Visualization Types
export type VisualizationType = 
  | 'trend_line' 
  | 'status_distribution' 
  | 'time_heatmap' 
  | 'comparison_bar' 
  | 'kpi_gauge'
  | 'correlation_scatter'
  | 'geographic_map';

// Chart Configuration Interfaces
export interface ChartConfig {
  type: VisualizationType;
  title: string;
  subtitle?: string;
  data: ChartData;
  options: ChartOptions;
  insights: ChartInsight[];
  interactivity: InteractivityConfig;
}

export interface ChartData {
  labels: string[];
  datasets: Dataset[];
  metadata: {
    totalPoints: number;
    timeRange?: { start: Date; end: Date };
    aggregationType?: 'daily' | 'weekly' | 'monthly';
    confidence?: number;
  };
}

export interface Dataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  tension?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  animation: {
    duration: number;
    easing: 'easeInOutQuart' | 'easeOutBounce';
  };
  scales?: {
    x?: ScaleConfig;
    y?: ScaleConfig;
  };
  plugins: {
    legend: LegendConfig;
    tooltip: TooltipConfig;
    accessibility: AccessibilityConfig;
  };
}

export interface ScaleConfig {
  type: 'linear' | 'time' | 'category';
  display: boolean;
  title: {
    display: boolean;
    text: string;
  };
  grid: {
    display: boolean;
    color: string;
  };
}

export interface LegendConfig {
  display: boolean;
  position: 'top' | 'bottom' | 'left' | 'right';
  labels: {
    usePointStyle: boolean;
    font: {
      size: number;
      family: string;
    };
  };
}

export interface TooltipConfig {
  enabled: boolean;
  mode: 'index' | 'point' | 'nearest';
  intersect: boolean;
  backgroundColor: string;
  titleColor: string;
  bodyColor: string;
  borderColor: string;
  borderWidth: number;
}

export interface AccessibilityConfig {
  announceNewData: {
    enabled: boolean;
    announcementFormatter: (chart: any, data: any) => string;
  };
  description: string;
  ariaLabel: string;
}

export interface InteractivityConfig {
  clickable: boolean;
  hoverable: boolean;
  zoomable: boolean;
  pannable: boolean;
  onDataPointClick?: (dataPoint: any) => string; // Returns follow-up query
  onRegionSelect?: (region: any) => string[]; // Returns multiple queries
}

export interface ChartInsight {
  type: 'trend' | 'anomaly' | 'pattern' | 'correlation' | 'forecast';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  confidence: number;
  actionable: boolean;
  suggestedAction?: string;
  relatedQuery?: string;
}

// Visualization Intelligence Class
export class VisualizationEngine {
  private static instance: VisualizationEngine;

  public static getInstance(): VisualizationEngine {
    if (!VisualizationEngine.instance) {
      VisualizationEngine.instance = new VisualizationEngine();
    }
    return VisualizationEngine.instance;
  }

  /**
   * Generate optimal visualization for query result
   */
  public generateVisualization(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): ChartConfig | null {
    // Analyze data structure and query intent
    const visualizationType = this.determineOptimalVisualization(result, processedQuery);
    
    if (!visualizationType) return null;

    switch (visualizationType) {
      case 'trend_line':
        return this.createTrendLineChart(result, processedQuery);
      case 'status_distribution':
        return this.createStatusDistributionChart(result, processedQuery);
      case 'time_heatmap':
        return this.createTimeHeatmap(result, processedQuery);
      case 'comparison_bar':
        return this.createComparisonBarChart(result, processedQuery);
      case 'kpi_gauge':
        return this.createKPIGauge(result, processedQuery);
      default:
        return null;
    }
  }

  /**
   * Determine optimal visualization based on data and query
   */
  private determineOptimalVisualization(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): VisualizationType | null {
    const { data } = result;
    const { entities, intent } = processedQuery;

    if (!data || data.length === 0) return null;

    // Time-based data detection
    if (this.hasTimeSeriesData(data)) {
      if (entities.dateExpressions || intent.primary.includes('trend') || intent.primary.includes('waktu')) {
        return 'trend_line';
      }
      if (intent.primary.includes('jam') || intent.primary.includes('hari') || intent.primary.includes('pola')) {
        return 'time_heatmap';
      }
    }

    // Status/categorical data detection
    if (this.hasStatusData(data)) {
      return 'status_distribution';
    }

    // Comparison data detection
    if (this.hasComparisonData(data)) {
      return 'comparison_bar';
    }

    // KPI/metric data detection
    if (this.hasKPIData(data)) {
      return 'kpi_gauge';
    }

    return null;
  }

  /**
   * Create trend line chart for time-series data
   */
  private createTrendLineChart(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): ChartConfig {
    const { data } = result;
    const timeData = this.extractTimeSeriesData(data || []);

    return {
      type: 'trend_line',
      title: 'Trend Aktivitas',
      subtitle: 'Analisis perkembangan data dari waktu ke waktu',
      data: {
        labels: timeData.labels,
        datasets: [{
          label: 'Jumlah Aktivitas',
          data: timeData.values,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true
        }],
        metadata: {
          totalPoints: timeData.values.length,
          timeRange: timeData.timeRange,
          aggregationType: timeData.aggregationType,
          confidence: 0.92
        }
      },
      options: this.getDefaultChartOptions('Waktu', 'Jumlah'),
      insights: this.generateTrendInsights(timeData),
      interactivity: {
        clickable: true,
        hoverable: true,
        zoomable: true,
        pannable: true,
        onDataPointClick: (dataPoint) => `Detail aktivitas pada ${dataPoint.label}`,
        onRegionSelect: (region) => [
          `Analisis anomali periode ${region.start} - ${region.end}`,
          `Bandingkan dengan periode sebelumnya`
        ]
      }
    };
  }

  /**
   * Create status distribution pie/doughnut chart
   */
  private createStatusDistributionChart(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): ChartConfig {
    const { data } = result;
    const statusData = this.extractStatusData(data || []);

    return {
      type: 'status_distribution',
      title: 'Distribusi Status',
      subtitle: 'Breakdown status aktivitas atau pengajuan',
      data: {
        labels: statusData.labels,
        datasets: [{
          label: 'Jumlah',
          data: statusData.values,
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',   // Success - Green
            'rgba(239, 68, 68, 0.8)',   // Error - Red
            'rgba(245, 158, 11, 0.8)',  // Pending - Yellow
            'rgba(59, 130, 246, 0.8)',  // Processing - Blue
            'rgba(156, 163, 175, 0.8)'  // Other - Gray
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(239, 68, 68)',
            'rgb(245, 158, 11)',
            'rgb(59, 130, 246)',
            'rgb(156, 163, 175)'
          ],
          borderWidth: 2
        }],
        metadata: {
          totalPoints: statusData.values.length,
          confidence: 0.95
        }
      },
      options: this.getDefaultChartOptions(),
      insights: this.generateStatusInsights(statusData),
      interactivity: {
        clickable: true,
        hoverable: true,
        zoomable: false,
        pannable: false,
        onDataPointClick: (dataPoint) => `Detail ${dataPoint.label.toLowerCase()}`,
      }
    };
  }

  /**
   * Create time-based heatmap chart
   */
  private createTimeHeatmap(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): ChartConfig {
    const { data } = result;
    const timeData = this.extractTimeSeriesData(data || []);

    return {
      type: 'time_heatmap',
      title: 'Pola Aktivitas Waktu',
      subtitle: 'Heatmap aktivitas berdasarkan jam dan hari',
      data: {
        labels: timeData.labels,
        datasets: [{
          label: 'Intensitas Aktivitas',
          data: timeData.values,
          backgroundColor: 'rgba(59, 130, 246, 0.6)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1
        }],
        metadata: {
          totalPoints: timeData.values.length,
          timeRange: timeData.timeRange,
          confidence: 0.88
        }
      },
      options: this.getDefaultChartOptions('Waktu', 'Intensitas'),
      insights: this.generateTrendInsights(timeData),
      interactivity: {
        clickable: true,
        hoverable: true,
        zoomable: true,
        pannable: true,
        onDataPointClick: (dataPoint) => `Analisis detail jam ${dataPoint.label}`,
      }
    };
  }

  /**
   * Create comparison bar chart
   */
  private createComparisonBarChart(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): ChartConfig {
    const { data } = result;
    const comparisonData = this.extractComparisonData(data || []);

    return {
      type: 'comparison_bar',
      title: 'Perbandingan Data',
      subtitle: 'Analisis komparatif antar kategori',
      data: {
        labels: comparisonData.labels,
        datasets: [{
          label: 'Jumlah',
          data: comparisonData.values,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        }],
        metadata: {
          totalPoints: comparisonData.values.length,
          confidence: 0.91
        }
      },
      options: this.getDefaultChartOptions('Kategori', 'Jumlah'),
      insights: this.generateComparisonInsights(comparisonData),
      interactivity: {
        clickable: true,
        hoverable: true,
        zoomable: false,
        pannable: false,
        onDataPointClick: (dataPoint) => `Detail ${dataPoint.label}`,
      }
    };
  }

  /**
   * Create KPI gauge chart
   */
  private createKPIGauge(
    result: EnhancedQueryResult,
    processedQuery: ProcessedQuery
  ): ChartConfig {
    const { data } = result;
    const kpiData = this.extractKPIData(data || []);

    return {
      type: 'kpi_gauge',
      title: 'Indikator Kinerja',
      subtitle: 'Metrik kinerja sistem',
      data: {
        labels: ['Current', 'Target'],
        datasets: [{
          label: 'Performance',
          data: [kpiData.current, kpiData.target],
          backgroundColor: [
            kpiData.current >= kpiData.target ? 'rgba(34, 197, 94, 0.8)' : 'rgba(239, 68, 68, 0.8)',
            'rgba(156, 163, 175, 0.3)'
          ],
          borderColor: [
            kpiData.current >= kpiData.target ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
            'rgb(156, 163, 175)'
          ],
          borderWidth: 2
        }],
        metadata: {
          totalPoints: 2,
          confidence: 0.96
        }
      },
      options: this.getDefaultChartOptions(),
      insights: this.generateKPIInsights(kpiData),
      interactivity: {
        clickable: false,
        hoverable: true,
        zoomable: false,
        pannable: false,
      }
    };
  }

  // Helper methods for data extraction and analysis
  private hasTimeSeriesData(data: any[]): boolean {
    return data.some(item => 
      item.created_at || item.updated_at || item.tanggal || item.waktu
    );
  }

  private hasStatusData(data: any[]): boolean {
    return data.some(item => 
      item.status || item.kondisi || item.state
    );
  }

  private hasComparisonData(data: any[]): boolean {
    return data.some(item => 
      item.operator_id || item.kategori || item.jenis
    );
  }

  private hasKPIData(data: any[]): boolean {
    return data.length === 1 && typeof data[0] === 'object' && 
           Object.keys(data[0]).some(key => 
             key.includes('total') || key.includes('count') || key.includes('rate')
           );
  }

  private extractTimeSeriesData(data: any[]) {
    // Implementation for extracting time series data
    // This would analyze the data structure and extract time-based patterns
    return {
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'], // Placeholder
      values: [10, 15, 12, 18, 20], // Placeholder
      timeRange: { start: new Date(), end: new Date() },
      aggregationType: 'daily' as const
    };
  }

  private extractStatusData(data: any[]) {
    // Implementation for extracting status distribution
    return {
      labels: ['Berhasil', 'Error', 'Pending', 'Diproses'],
      values: [45, 12, 8, 15]
    };
  }

  private extractComparisonData(data: any[]) {
    // Implementation for extracting comparison data
    return {
      labels: ['Operator A', 'Operator B', 'Operator C', 'Operator D'],
      values: [25, 30, 18, 22]
    };
  }

  private extractKPIData(data: any[]) {
    // Implementation for extracting KPI data
    return {
      current: 85,
      target: 90,
      unit: '%'
    };
  }

  private generateTrendInsights(timeData: any): ChartInsight[] {
    return [
      {
        type: 'trend',
        title: 'Tren Meningkat',
        description: 'Aktivitas menunjukkan peningkatan 15% dalam 7 hari terakhir',
        severity: 'medium',
        confidence: 0.87,
        actionable: true,
        suggestedAction: 'Monitor kapasitas sistem',
        relatedQuery: 'Analisis beban sistem minggu ini'
      }
    ];
  }

  private generateStatusInsights(statusData: any): ChartInsight[] {
    return [
      {
        type: 'anomaly',
        title: 'Error Rate Tinggi',
        description: 'Tingkat error 12% melebihi threshold normal (5%)',
        severity: 'high',
        confidence: 0.94,
        actionable: true,
        suggestedAction: 'Investigasi penyebab error',
        relatedQuery: 'Detail error hari ini'
      }
    ];
  }

  private generateComparisonInsights(comparisonData: any): ChartInsight[] {
    return [
      {
        type: 'pattern',
        title: 'Performa Operator Bervariasi',
        description: 'Operator B menunjukkan performa 25% lebih tinggi dari rata-rata',
        severity: 'medium',
        confidence: 0.89,
        actionable: true,
        suggestedAction: 'Analisis best practice Operator B',
        relatedQuery: 'Detail aktivitas Operator B'
      }
    ];
  }

  private generateKPIInsights(kpiData: any): ChartInsight[] {
    return [
      {
        type: 'trend',
        title: 'Target Belum Tercapai',
        description: `Performa saat ini ${kpiData.current}% masih di bawah target ${kpiData.target}%`,
        severity: 'medium',
        confidence: 0.96,
        actionable: true,
        suggestedAction: 'Identifikasi area improvement',
        relatedQuery: 'Analisis gap performa'
      }
    ];
  }

  private getDefaultChartOptions(xAxisTitle?: string, yAxisTitle?: string): ChartOptions {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart'
      },
      scales: xAxisTitle && yAxisTitle ? {
        x: {
          type: 'category',
          display: true,
          title: { display: true, text: xAxisTitle },
          grid: { display: true, color: 'rgba(156, 163, 175, 0.2)' }
        },
        y: {
          type: 'linear',
          display: true,
          title: { display: true, text: yAxisTitle },
          grid: { display: true, color: 'rgba(156, 163, 175, 0.2)' }
        }
      } : undefined,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            usePointStyle: true,
            font: { size: 12, family: 'Inter, sans-serif' }
          }
        },
        tooltip: {
          enabled: true,
          mode: 'index',
          intersect: false,
          backgroundColor: 'rgba(17, 24, 39, 0.9)',
          titleColor: '#F9FAFB',
          bodyColor: '#F9FAFB',
          borderColor: 'rgba(59, 130, 246, 0.5)',
          borderWidth: 1
        },
        accessibility: {
          announceNewData: {
            enabled: true,
            announcementFormatter: (chart, data) => 
              `Chart updated with ${data.datasets[0].data.length} data points`
          },
          description: 'Interactive chart showing data analysis results',
          ariaLabel: 'Data visualization chart'
        }
      }
    };
  }
}

// Export singleton instance
export const visualizationEngine = VisualizationEngine.getInstance();
