export interface AktivitasSiakData {
  id: string;
  created_at: string;
  user_id: string;
  total_aktivitas_individu: string;
  total_aktivitas_keseluruhan: string;
  fix_anomali_data: string;
  restore_data_maintenance: string;
  restore_data_ktp: string;
  daftar_duplikasi: string;
  login_user: string;
  logout_user: string;
  mutasi_elemen_data: string;
  bulan_rekapitulasi: string;
}

export interface AktivitasSiakFormData {
  total_aktivitas_individu: string;
  total_aktivitas_keseluruhan: string;
  fix_anomali_data: string;
  restore_data_maintenance: string;
  restore_data_ktp: string;
  daftar_duplikasi: string;
  login_user: string;
  logout_user: string;
  mutasi_elemen_data: string;
  bulan_rekapitulasi: string;
}

export interface SummaryStats {
  totalAktivitasSiak: number;
  totalPengaduanBulanan: number;
  totalDokumentasi: number;
  totalActivityThisMonth: number;
  monthlyStats: Array<{
    period: string;
    total_aktivitas_individu: number;
    total_aktivitas_keseluruhan: number;
    fix_anomali_data: number;
    restore_data_maintenance: number;
    restore_data_ktp: number;
    daftar_duplikasi: number;
    login_user: number;
    logout_user: number;
    mutasi_elemen_data: number;
  }>;
  yearlyStats: Array<{
    period: string;
    total_aktivitas_individu: number;
    total_aktivitas_keseluruhan: number;
    fix_anomali_data: number;
    restore_data_maintenance: number;
    restore_data_ktp: number;
    daftar_duplikasi: number;
    login_user: number;
    logout_user: number;
    mutasi_elemen_data: number;
  }>;
}