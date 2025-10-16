import { z } from "zod"

// NIK validation: must be exactly 16 digits
const nikSchema = z
  .string()
  .min(1, "NIK tidak boleh kosong")
  .length(16, "NIK harus 16 digit")
  .regex(/^\d+$/, "NIK hanya boleh berisi angka")

// Name validation: at least 3 characters, max 100
const nameSchema = z
  .string()
  .min(1, "Nama tidak boleh kosong")
  .min(3, "Nama minimal 3 karakter")
  .max(100, "Nama maksimal 100 karakter")
  .regex(/^[a-zA-Z\s.'-]+$/, "Nama hanya boleh berisi huruf, spasi, titik, apostrof, dan tanda hubung")

// Date validation: must be a valid date string
const dateSchema = z.string().min(1, "Tanggal tidak boleh kosong")

// Optional date validation
const optionalDateSchema = z.string().optional()

// Salah Rekam Form Schema
export const salahRekamFormSchema = z.object({
  // Data Salah Rekam
  nik_salah_rekam: nikSchema,
  nama_salah_rekam: nameSchema,

  // Pemilik Biometric
  nik_pemilik_biometric: nikSchema,
  nama_pemilik_biometric: nameSchema,

  // Pemilik Foto
  nik_pemilik_foto: nikSchema,
  nama_pemilik_foto: nameSchema,

  // Petugas Rekam
  nik_petugas_rekam: nikSchema,
  nama_petugas_rekam: nameSchema,

  // Pengaju (readonly fields)
  nik_pengaju: z.string(),
  nama_pengaju: z.string(),

  // Tanggal Perekaman
  tanggal_perekaman: dateSchema,
  estimasi_tanggal_perekaman: optionalDateSchema,

  // Status (checkbox)
  is_ready_to_record: z.boolean().optional(),
})

// Export type from schema
export type SalahRekamFormValues = z.infer<typeof salahRekamFormSchema>

// Validation helper function
export function validateSalahRekamForm(data: unknown) {
  return salahRekamFormSchema.safeParse(data)
}

// Field-level validation helper
export function validateField(fieldName: keyof SalahRekamFormValues, value: unknown) {
  const fieldSchema = salahRekamFormSchema.shape[fieldName]
  return fieldSchema.safeParse(value)
}
