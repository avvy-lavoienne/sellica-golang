export interface PengajuanBulananData {
  id: string;
  created_at: string;
  user_id: string;
  nik_pengajuan_hapus: string;
  nama_pengajuan: string;
  alasan_pengajuan: string;
  alasan_lainnya: string | null;
  nik_pengaju: string;
  nama_pengaju: string;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman: string | null;
  is_ready_to_record: boolean;
  rekapData: PengajuanBulananData[];
}

export interface PengajuanBulananFormData {
  nik_pengajuan_hapus: string
  nama_pengajuan: string
  alasan_pengajuan: string
  alasan_lainnya: string | null
  nik_pengaju: string
  nama_pengaju: string
  tanggal_pengajuan: string
  estimasi_tanggal_perekaman: string | null
  is_ready_to_record: boolean
}
