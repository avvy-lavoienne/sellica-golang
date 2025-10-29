import { useState, useCallback } from 'react';
import { GoAuthAPI } from '@/lib/api/goAuth';
import { ChartData } from '@/types/dashboard';

interface SparklineData {
  label: string;
  adjudicateRecord: number;
  duplicateOperator: number;
  salahRekam: number;
  pengajuanBulanan: number;
}

interface UseChartAggregationReturn {
  chartData: ChartData;
  loading: boolean;
  error: string | null;
  fetchChartData: (startDate?: Date | null, endDate?: Date | null, selectedYear?: string) => Promise<void>;
}

/**
 * Custom hook to fetch and process aggregated chart data
 * Separate from dashboard card data to prevent side effects
 */
export function useChartAggregation(): UseChartAggregationReturn {
  const [chartData, setChartData] = useState<ChartData>({
    yearly: {
      labels: [],
      datasets: [
        {
          label: '',
          data: [],
          borderColor: '',
          backgroundColor: '',
          tension: 0,
        },
      ],
    },
    monthly: {
      labels: [],
      datasets: [
        {
          label: '',
          data: [],
          borderColor: '',
          backgroundColor: '',
          tension: 0,
        },
      ],
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChartData = useCallback(
    async (startDate?: Date | null, endDate?: Date | null, selectedYear?: string) => {
      try {
        setLoading(true);
        setError(null);

        console.log('[useChartAggregation] fetchChartData called with:', { startDate, endDate, selectedYear });

        const token = GoAuthAPI.getToken();
        if (!token) {
          console.error('[useChartAggregation] No token found');
          setError('Authentication token not found');
          setLoading(false);
          return;
        }

        console.log('[useChartAggregation] Token found:', token.substring(0, 20) + '...');

        // Build query parameters
        const params = new URLSearchParams();
        if (startDate) {
          params.append('start_date', startDate.toISOString().split('T')[0]);
        }
        if (endDate) {
          params.append('end_date', endDate.toISOString().split('T')[0]);
        }

        console.log('[useChartAggregation] Query params:', params.toString());

        // Call chart-specific API route
        const apiUrl = `/api/data-rekam/chart-aggregation?${params.toString()}`;
        console.log('[useChartAggregation] Calling API:', apiUrl);

        const response = await fetch(
          apiUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('[useChartAggregation] API response status:', response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error('[useChartAggregation] API error response:', errorData);
          throw new Error(errorData.error || 'Failed to fetch chart data');
        }

        const result = await response.json();

        console.log('[useChartAggregation] API response received:', result);

        if (!result.success) {
          console.error('[useChartAggregation] API returned success: false', result);
          throw new Error(result.error || 'API returned success: false');
        }

        const { monthly_data = [], yearly_data = [] } = result.data || {};

        console.log('[useChartAggregation] Extracted data:', {
          monthlyDataLength: monthly_data.length,
          yearlyDataLength: yearly_data.length,
          monthly_data,
          yearly_data,
        });

        // Convert aggregated data to SparklineData format
        // Backend now returns per-table breakdown: {year, adjudicate_record, duplicate_operator, salah_rekam, pengajuan_bulanan}
        const yearlySparklineData: SparklineData[] = yearly_data.map((item: any) => ({
          label: item.year.toString(),
          adjudicateRecord: item.adjudicate_record || 0,
          duplicateOperator: item.duplicate_operator || 0,
          salahRekam: item.salah_rekam || 0,
          pengajuanBulanan: item.pengajuan_bulanan || 0,
        }));

        console.log('[useChartAggregation] Yearly sparkline data:', yearlySparklineData);

        // Convert monthly data grouped by year
        const monthlyByYear: { [year: string]: SparklineData[] } = {};
        monthly_data.forEach((item: any) => {
          const year = item.year.toString();
          const month = item.month.toString().padStart(2, '0');
          const label = `${year}-${month}`;

          if (!monthlyByYear[year]) {
            monthlyByYear[year] = [];
          }

          // Use actual per-table counts from backend instead of distribution percentages
          monthlyByYear[year].push({
            label,
            adjudicateRecord: item.adjudicate_record || 0,
            duplicateOperator: item.duplicate_operator || 0,
            salahRekam: item.salah_rekam || 0,
            pengajuanBulanan: item.pengajuan_bulanan || 0,
          });
        });

        // Sort months within each year
        Object.keys(monthlyByYear).forEach((year) => {
          monthlyByYear[year].sort((a, b) => a.label.localeCompare(b.label));
        });

        // Convert to ChartData format
        const yearlyLabels = yearlySparklineData.map((item) => item.label);
        const yearlyDatasets = [
          {
            label: 'Adjudicate Record',
            data: yearlySparklineData.map((item) => item.adjudicateRecord),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Duplicate Operator',
            data: yearlySparklineData.map((item) => item.duplicateOperator),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Salah Rekam',
            data: yearlySparklineData.map((item) => item.salahRekam),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Pengajuan Bulanan',
            data: yearlySparklineData.map((item) => item.pengajuanBulanan),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          },
        ];

        // Get current year for monthly view
        // Use selectedYear if provided (from parent component), otherwise default to latest year
        const currentYear = selectedYear || yearlyLabels[yearlyLabels.length - 1] || new Date().getFullYear().toString();
        const monthlyDataForYear = monthlyByYear[currentYear] || [];
        const monthlyLabels = monthlyDataForYear.map((item) => item.label);
        const monthlyDatasets = [
          {
            label: 'Adjudicate Record',
            data: monthlyDataForYear.map((item) => item.adjudicateRecord),
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Duplicate Operator',
            data: monthlyDataForYear.map((item) => item.duplicateOperator),
            borderColor: '#8B5CF6',
            backgroundColor: 'rgba(139, 92, 246, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Salah Rekam',
            data: monthlyDataForYear.map((item) => item.salahRekam),
            borderColor: '#EF4444',
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            tension: 0.4,
          },
          {
            label: 'Pengajuan Bulanan',
            data: monthlyDataForYear.map((item) => item.pengajuanBulanan),
            borderColor: '#10B981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            tension: 0.4,
          },
        ];

        setChartData({
          yearly: {
            labels: yearlyLabels,
            datasets: yearlyDatasets,
          },
          monthly: {
            labels: monthlyLabels,
            datasets: monthlyDatasets,
          },
        });

        console.log('[useChartAggregation] Chart data updated with:', {
          yearlyLabelsLength: yearlyLabels.length,
          yearlyLabels,
          yearlyDatasetsLength: yearlyDatasets.length,
          monthlyLabelsLength: monthlyLabels.length,
          monthlyLabels,
          monthlyDatasetsLength: monthlyDatasets.length,
        });
        
        console.log('[useChartAggregation] Chart data set successfully');
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error occurred';
        console.error('[useChartAggregation] Error:', message);
        setError(message);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return {
    chartData,
    loading,
    error,
    fetchChartData,
  };
}
