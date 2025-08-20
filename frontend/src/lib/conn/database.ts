export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          nik: string | null
          role: string | null
        }
        Insert: {
          id: string
          name?: string | null
          nik?: string | null
          role?: string | null
        }
        Update: {
          id?: string
          name?: string | null
          nik?: string | null
          role?: string | null
        }
      }
      aktivitas_siak: {
        Row: {
          id: string
          tanggal: string
          aktivitas: string
          status: string
          keterangan: string | null
          created_by: string
          created_at: string
        }
      }
      pengaduan_bulanan: {
        Row: {
          id: string
          tanggal: string
          masalah: string
          status: string
          tindakan: string | null
          created_by: string
          created_at: string
        }
      }
      dokumentasi: {
        Row: {
          id: string
          tanggal: string
          foto: string | null
          judul: string
          keterangan: string
          created_by: string
          created_at: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}