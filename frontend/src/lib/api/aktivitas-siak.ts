/**
 * Aktivitas SIAK API Helper Module
 * Handles all API calls to the Go backend for Aktivitas SIAK operations
 * 
 * Base URL: http://localhost:8080/api/v1/aktivitas-siak (or NEXT_PUBLIC_API_URL)
 * Authentication: JWT Bearer token (from Supabase session)
 * 
 * Schema: UUID-based records with 9 TEXT activity fields
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

/**
 * Activity record as returned from backend
 */
export interface AktivitasSiakRecord {
  id: string; // UUID
  user_id: string; // UUID
  total_aktivitas_individu: string;
  total_aktivitas_keseluruhan: string;
  fix_anomali_data: string;
  restore_data_maintenance: string;
  restore_data_ktp: string;
  daftar_duplikasi: string;
  login_user: string;
  logout_user: string;
  mutasi_elemen_data: string;
  bulan_rekapitulasi: string; // Format: "Oktober 2025"
  created_at: string; // ISO timestamp
}

/**
 * Request body for creating a new activity record
 */
export interface CreateAktivitasSiakRequest {
  total_aktivitas_individu: string;
  total_aktivitas_keseluruhan: string;
  fix_anomali_data: string;
  restore_data_maintenance: string;
  restore_data_ktp: string;
  daftar_duplikasi: string;
  login_user: string;
  logout_user: string;
  mutasi_elemen_data: string;
  bulan_rekapitulasi: string; // Format: "Oktober 2025"
}

/**
 * Request body for updating an activity record
 */
export interface UpdateAktivitasSiakRequest
  extends Partial<CreateAktivitasSiakRequest> {}

/**
 * Duplicate check request
 */
export interface DuplicateCheckRequest {
  bulan_rekapitulasi: string; // Format: "Oktober 2025"
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  total_records?: number;
  total_pages?: number;
  current_page?: number;
  page_size?: number;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

/**
 * Statistics response
 */
export interface AktivitasSiakStatistics {
  total_records: number;
  average_activity: number;
  records_by_month: Record<string, number>;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get the API base URL
 */
function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (publicUrl) {
    return publicUrl.replace(/\/$/, ''); // Remove trailing slash
  }
  // Fallback for development
  return 'http://localhost:8080';
}

/**
 * Get authorization headers with JWT token
 */
function getAuthHeaders(token?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return headers;
}

/**
 * Parse API response and handle errors
 */
async function parseResponse<T>(response: Response): Promise<T> {
  // Check content type first
  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    console.error('Non-JSON response from backend:', {
      status: response.status,
      statusText: response.statusText,
      contentType,
      bodyPreview: text.substring(0, 500)
    });
    throw new Error(
      `Backend tidak mengembalikan JSON (Status: ${response.status}). ` +
      `Kemungkinan backend tidak berjalan atau terjadi error. ` +
      `Periksa: http://localhost:8080/health`
    );
  }

  let data: any;
  try {
    data = await response.json();
  } catch (parseError) {
    console.error('JSON parse error:', parseError);
    throw new Error(
      `Response tidak bisa di-parse sebagai JSON. Periksa apakah backend berjalan dengan baik.`
    );
  }

  if (!response.ok) {
    // Backend returns error in 'error' or 'message' field
    const errorMessage = data.error || data.message || `HTTP ${response.status}`;
    throw new Error(errorMessage);
  }

  // Access the 'data' property from response
  if (data.data !== undefined) {
    return data.data as T;
  }

  return data as T;
}

// ============================================================================
// API OPERATIONS
// ============================================================================

/**
 * Create a new activity record
 *
 * POST /api/v1/aktivitas-siak
 *
 * @param record - The activity data to create
 * @param token - JWT bearer token
 * @returns The created record with UUID
 * @throws Error if creation fails
 */
export async function createRecord(
  record: CreateAktivitasSiakRequest,
  token: string
): Promise<AktivitasSiakRecord> {
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(record),
    });

    return await parseResponse<AktivitasSiakRecord>(response);
  } catch (error) {
    throw new Error(`Gagal membuat record aktivitas: ${error}`);
  }
}

/**
 * Get a single activity record by ID
 *
 * GET /api/v1/aktivitas-siak/:id
 *
 * @param id - The UUID of the record
 * @param token - JWT bearer token
 * @returns The activity record
 * @throws Error if record not found or retrieval fails
 */
export async function getRecord(
  id: string,
  token: string
): Promise<AktivitasSiakRecord> {
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak/${id}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    return await parseResponse<AktivitasSiakRecord>(response);
  } catch (error) {
    throw new Error(`Gagal mengambil record aktivitas: ${error}`);
  }
}

/**
 * List all activity records with pagination
 *
 * GET /api/v1/aktivitas-siak?page=1&page_size=20
 *
 * @param params - Pagination parameters
 * @param token - JWT bearer token
 * @returns Array of activity records and pagination info
 * @throws Error if retrieval fails
 */
export async function listRecords(
  params: PaginationParams = { page: 1, page_size: 20 },
  token: string
): Promise<{
  records: AktivitasSiakRecord[];
  pagination: {
    current_page: number;
    page_size: number;
    total_records: number;
    total_pages: number;
  };
}> {
  const page = params.page || 1;
  const page_size = params.page_size || 20;
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak?page=${page}&page_size=${page_size}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    // Check if response is actually JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('Non-JSON response:', {
        status: response.status,
        contentType,
        text: text.substring(0, 200)
      });
      throw new Error(`Respons server bukan JSON. Status: ${response.status}. Periksa apakah backend berjalan di http://localhost:8080`);
    }

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.error || data.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Extract records and pagination info
    const records = Array.isArray(data.data) ? data.data : data.records || [];
    const pagination = {
      current_page: data.page || page,
      page_size: data.page_size || page_size,
      total_records: data.total || 0,
      total_pages: data.total_pages || 1,
    };

    return { records, pagination };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Gagal mengambil daftar aktivitas: ${errorMsg}`);
  }
}

/**
 * Update an existing activity record
 *
 * PUT /api/v1/aktivitas-siak/:id
 *
 * @param id - The UUID of the record
 * @param updates - Partial update data
 * @param token - JWT bearer token
 * @returns The updated record
 * @throws Error if update fails
 */
export async function updateRecord(
  id: string,
  updates: UpdateAktivitasSiakRequest,
  token: string
): Promise<AktivitasSiakRecord> {
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak/${id}`;

  try {
    const response = await fetch(url, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updates),
    });

    return await parseResponse<AktivitasSiakRecord>(response);
  } catch (error) {
    throw new Error(`Gagal memperbarui record aktivitas: ${error}`);
  }
}

/**
 * Delete an activity record
 *
 * DELETE /api/v1/aktivitas-siak/:id
 *
 * @param id - The UUID of the record
 * @param token - JWT bearer token
 * @throws Error if deletion fails
 */
export async function deleteRecord(id: string, token: string): Promise<void> {
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak/${id}`;

  try {
    const response = await fetch(url, {
      method: 'DELETE',
      headers: getAuthHeaders(token),
    });

    if (!response.ok) {
      const data = await response.json();
      const errorMessage =
        data.error || data.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }
  } catch (error) {
    throw new Error(`Gagal menghapus record aktivitas: ${error}`);
  }
}

/**
 * Check for duplicate entry in a given month
 *
 * POST /api/v1/aktivitas-siak/check-duplicate
 *
 * @param bulan_rekapitulasi - Month in format "Oktober 2025"
 * @param token - JWT bearer token
 * @returns Object with isDuplicate flag
 * @throws Error if check fails
 */
export async function checkDuplicate(
  bulan_rekapitulasi: string,
  token: string
): Promise<{ isDuplicate: boolean }> {
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak/check-duplicate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ bulan_rekapitulasi }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage =
        data.error || data.message || `HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    // Response contains 'exists' or 'isDuplicate' flag
    return {
      isDuplicate: (data.data?.exists || data.data?.isDuplicate) ?? false,
    };
  } catch (error) {
    throw new Error(`Gagal memeriksa duplikasi: ${error}`);
  }
}

/**
 * Get statistics for activity records
 *
 * GET /api/v1/aktivitas-siak/statistics
 *
 * @param token - JWT bearer token
 * @returns Statistics object
 * @throws Error if retrieval fails
 */
export async function getStatistics(
  token: string
): Promise<AktivitasSiakStatistics> {
  const url = `${getApiBaseUrl()}/api/v1/aktivitas-siak/statistics`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: getAuthHeaders(token),
    });

    return await parseResponse<AktivitasSiakStatistics>(response);
  } catch (error) {
    throw new Error(`Gagal mengambil statistik aktivitas: ${error}`);
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  createRecord,
  getRecord,
  listRecords,
  updateRecord,
  deleteRecord,
  checkDuplicate,
  getStatistics,
};
