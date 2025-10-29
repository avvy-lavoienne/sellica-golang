// Types for dashboard components
export interface DashboardStats {
  rekamData: {
    adjudicateRecord: { total: number, completed: number },
    duplicateOperator: { total: number, completed: number },
    salahRekam: { total: number, completed: number },
    pengajuanBulanan: { total: number, completed: number }
  },
  aktivitasData: {
    aktivitasSiak: number,
    pengaduanBulanan: number,
    dokumentasi: number,
    totalBulanIni: number
  },
  recentActivities: RecentActivity[]
}

export interface RecentActivity {
  id: string;
  type: string;
  title: string;
  description: string;
  date: string;
  foto?: string;
}

export interface ChartData {
  yearly: {
    labels: string[],
    datasets: Array<{
      label: string,
      data: number[],
      borderColor: string,
      backgroundColor: string,
      tension: number
    }>
  },
  monthly: {
    labels: string[],
    datasets: Array<{
      label: string,
      data: number[],
      borderColor: string,
      backgroundColor: string,
      tension: number
    }>
  }
}

export interface ChartDataResponse {
  // Aggregated monthly data from backend
  monthly_data?: Array<{
    year: number;
    month: number;
    adjudicate_record: number;
    duplicate_operator: number;
    salah_rekam: number;
    pengajuan_bulanan: number;
  }>;
  
  // Aggregated yearly data from backend
  yearly_data?: Array<{
    year: number;
    adjudicate_record: number;
    duplicate_operator: number;
    salah_rekam: number;
    pengajuan_bulanan: number;
  }>;
  
  // Legacy format (for backward compatibility)
  chartData?: Array<{ 
    table_name?: string;
    table?: string;
    data: Array<{ 
      created_at: string;
      id?: any;
      is_ready_to_record?: any;
    }>
  }>;
}

export interface ChartAggregationApiResponse {
  success: boolean;
  data: ChartDataResponse;
}