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
  chartData: Array<{ 
    table: string, 
    data: Array<{ 
      created_at: string;
      id?: any;
      is_ready_to_record?: any;
    }>
  }>
}