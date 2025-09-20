export interface SilpanaData {
  id?: string
  created_at?: string
  user_id?: string
  nik_pengaduan: string
  nama_pengaduan: string
  kategori_pengaduan: string
  sub_kategori_pengaduan: string
  alasan_pengaduan: string
  deskripsi_pengaduan: string
  nomor_telepon: string
  tindak_lanjut_pengaduan: string
  tanggal_pengaduan: string
  is_anonymous?: boolean
  creator_name?: string
}

export interface SilpanaFormData {
  id?: string
  nik_pengaduan: string
  nama_pengaduan: string
  kategori_pengaduan: string
  sub_kategori_pengaduan: string
  alasan_pengaduan: string
  deskripsi_pengaduan: string
  nomor_telepon: string
  tindak_lanjut_pengaduan: string
  tanggal_pengaduan: string
  is_anonymous?: boolean
}