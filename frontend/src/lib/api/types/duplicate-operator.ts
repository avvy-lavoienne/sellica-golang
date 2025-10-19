/**
 * Type definitions for Duplicate Operator API
 * Generated from backend API specifications
 */

// Request types
export interface CreateDuplicateOperatorRequest {
  nik_duplicate: string;
  nama_duplicate: string;
  nik_operator: string;
  nama_operator: string;
  tanggal_perekaman: string;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman?: string;
  is_ready_to_record?: boolean;
}

export interface UpdateDuplicateOperatorRequest {
  nik_duplicate?: string;
  nama_duplicate?: string;
  nik_operator?: string;
  nama_operator?: string;
  tanggal_perekaman?: string;
  tanggal_pengajuan?: string;
  estimasi_tanggal_perekaman?: string;
  is_ready_to_record?: boolean;
}

export interface ListQueryParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: "all" | "completed" | "pending";
  sort_by?: "created_at" | "tanggal_perekaman";
  sort_order?: "asc" | "desc";
  date_from?: string;
  date_to?: string;
}

// Response types
export interface DuplicateOperatorResponse {
  id: string;
  user_id: string;
  nik_duplicate: string;
  nama_duplicate: string;
  nik_operator: string;
  nama_operator: string;
  nik_pengaju: string;
  nama_pengaju: string;
  tanggal_perekaman: string | null;
  tanggal_pengajuan: string;
  estimasi_tanggal_perekaman: string | null;
  is_ready_to_record: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface DuplicateOperatorListResponse {
  status: "success" | "error";
  code: number;
  message: string;
  data: DuplicateOperatorResponse[];
  pagination: PaginationMeta;
  timestamp: string;
}

export interface DuplicateOperatorSingleResponse {
  status: "success" | "error";
  code: number;
  message: string;
  data: DuplicateOperatorResponse;
  timestamp: string;
}

// Error types
export interface APIErrorDetail {
  field: string;
  message: string;
}

export interface APIError {
  status: "error";
  code: number;
  message: string;
  error_details?: APIErrorDetail[];
  timestamp: string;
}
