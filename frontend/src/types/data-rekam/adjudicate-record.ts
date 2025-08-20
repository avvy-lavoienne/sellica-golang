export interface AdjudicateRecordData {
  id: string
  created_at: string
  user_id: string
  nik_adjudicate: string
  nama_adjudicate: string
  nik_pengaju: string
  nama_pengaju: string
  jenis_eksepsi: string
  tanggal_pengajuan: string
  estimasi_tanggal_perekaman: string | null
  is_ready_to_record: boolean
}

export interface AdjudicateRecordFormData {
  nik_adjudicate: string
  nama_adjudicate: string
  nik_pengaju: string
  nama_pengaju: string
  jenis_eksepsi: string
  tanggal_pengajuan: string
  estimasi_tanggal_perekaman: string | null
  is_ready_to_record: boolean
}
