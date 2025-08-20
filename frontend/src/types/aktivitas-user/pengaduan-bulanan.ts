export interface PengaduanBulananData {
  id?: string
  created_at?: string
  user_id?: string
  nik_pengaduan: string
  nama_pengaduan: string
  alasan_pengaduan: string
  deskripsi_pengaduan: string
  nomor_telepon: string
  tindak_lanjut_pengaduan: string
  tanggal_pengaduan: string
  creator_name?: string
}

export interface PengaduanBulananFormData {
  id?: string
  nik_pengaduan: string
  nama_pengaduan: string
  alasan_pengaduan: string
  deskripsi_pengaduan: string
  nomor_telepon: string
  tindak_lanjut_pengaduan: string
  tanggal_pengaduan: string
}