export interface DuplicateOperatorData {
  id: string;
  user_id: string;
  nik_duplicate: string;
  nama_duplicate: string;
  nik_operator: string;
  nama_operator: string;
  nik_pengaju: string;
  nama_pengaju: string;
  tanggal_perekaman: string;
  tanggal_pengajuan: string;
  created_at: string;
  is_ready_to_record: boolean;
  estimasi_tanggal_perekaman?: string;
}

export interface DuplicateOperatorFormData {
  nik_duplicate: string;
  nama_duplicate: string;
  nik_operator: string;
  nama_operator: string;
  nik_pengaju: string;
  nama_pengaju: string;
  tanggal_perekaman: string;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman?: string;
  is_ready_to_record?: boolean;
}