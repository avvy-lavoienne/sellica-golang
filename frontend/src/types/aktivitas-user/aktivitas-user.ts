export interface AktivitasUserData {
  id: string;
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
  created_at: string;
}

export interface AktivitasUserFormData {
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