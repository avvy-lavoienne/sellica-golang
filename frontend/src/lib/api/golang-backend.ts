/**
 * Golang Backend API Client for SILPANA Ticketing System
 * 
 * High-performance API client that communicates with the Go backend
 * instead of directly calling Supabase
 */

import {
  TicketStatus,
  PriorityLevel,
  type EnhancedSilpanaData,
  type TicketLookupRequest,
  type TicketHistory,
} from '@/types/silpana/silpana';

/**
 * API Configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080';
const API_VERSION = 'v1';
const API_PREFIX = `/api/${API_VERSION}/silpana`;

/**
 * API Client Configuration
 */
interface ApiConfig {
  timeout?: number;
  headers?: Record<string, string>;
  retries?: number;
}

const DEFAULT_CONFIG: ApiConfig = {
  timeout: 10000, // 10 seconds
  retries: 3,
};

/**
 * Create ticket request structure for Golang backend
 */
interface CreateTicketRequest {
  nik_pengaduan: string;
  nama_pengaduan: string;
  kategori_pengaduan: string;
  sub_kategori_pengaduan: string;
  alasan_pengaduan: string;
  deskripsi_pengaduan: string;
  nomor_telepon: string;
  tindak_lanjut_pengaduan: string;
  tanggal_pengaduan: string;
  is_anonymous?: boolean;
  priority_level?: PriorityLevel;
  created_by_ip?: string;
}

/**
 * Ticket response from Golang backend
 */
interface TicketResponse {
  id: string;
  ticket_code: string;
  ticket_status: TicketStatus;
  priority_level: PriorityLevel;
  created_at: string;
  last_updated: string;
  // ... other fields
  [key: string]: any;
}

/**
 * API Error class
 */
class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * Fetch with timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = DEFAULT_CONFIG.timeout!
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

/**
 * Make API request with retry logic
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  config: ApiConfig = {}
): Promise<T> {
  const { timeout, headers, retries } = { ...DEFAULT_CONFIG, ...config };
  const url = `${API_BASE_URL}${API_PREFIX}${endpoint}`;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries!; attempt++) {
    try {
      const response = await fetchWithTimeout(
        url,
        {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...headers,
            ...options.headers,
          },
        },
        timeout
      );

      // Handle non-OK responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        );
      }

      // Parse response
      const data = await response.json();
      return data as T;

    } catch (error) {
      lastError = error as Error;

      // Don't retry on client errors (4xx)
      if (error instanceof ApiError && error.statusCode && error.statusCode < 500) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt === retries) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Request failed');
}

/**
 * Submit a new ticket through Golang backend
 */
export async function submitTicket(ticketData: Partial<EnhancedSilpanaData>): Promise<{
  success: boolean;
  ticket?: EnhancedSilpanaData;
  ticketCode?: string;
  error?: string;
}> {
  try {
    // Get client IP address for audit trail
    const clientIP = await getClientIP().catch(() => 'unknown');

    const request: CreateTicketRequest = {
      nik_pengaduan: ticketData.nik_pengaduan || '',
      nama_pengaduan: ticketData.nama_pengaduan || '',
      kategori_pengaduan: ticketData.kategori_pengaduan || '',
      sub_kategori_pengaduan: ticketData.sub_kategori_pengaduan || '',
      alasan_pengaduan: ticketData.alasan_pengaduan || '',
      deskripsi_pengaduan: ticketData.deskripsi_pengaduan || '',
      nomor_telepon: ticketData.nomor_telepon || '',
      tindak_lanjut_pengaduan: ticketData.tindak_lanjut_pengaduan || '',
      tanggal_pengaduan: ticketData.tanggal_pengaduan || new Date().toISOString(),
      is_anonymous: ticketData.is_anonymous || false,
      priority_level: ticketData.priority_level || PriorityLevel.MEDIUM,
      created_by_ip: clientIP,
    };

    const response = await apiRequest<{
      ticket: TicketResponse;
      message: string;
    }>('/tickets', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return {
      success: true,
      ticket: response.ticket as EnhancedSilpanaData,
      ticketCode: response.ticket.ticket_code,
    };

  } catch (error) {
    console.error('Error submitting ticket:', error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal menyimpan pengaduan',
    };
  }
}

/**
 * Lookup a ticket by code and verification
 */
export async function lookupTicket(
  ticketCode: string,
  verificationType: 'phone' | 'nik',
  verificationValue: string
): Promise<{
  success: boolean;
  ticket?: EnhancedSilpanaData;
  history?: TicketHistory[];
  error?: string;
}> {
  try {
    const request: any = {
      ticket_code: ticketCode,
    };

    // Add verification field based on type
    if (verificationType === 'phone') {
      request.phone_number = verificationValue;
    } else {
      request.nik = verificationValue;
    }

    const response = await apiRequest<{
      ticket: TicketResponse;
      history?: TicketHistory[];
      message: string;
    }>('/tickets/lookup', {
      method: 'POST',
      body: JSON.stringify(request),
    });

    return {
      success: true,
      ticket: response.ticket as EnhancedSilpanaData,
      history: response.history,
    };

  } catch (error) {
    console.error('Error looking up ticket:', error);

    if (error instanceof ApiError) {
      if (error.statusCode === 404) {
        return {
          success: false,
          error: 'Tiket tidak ditemukan atau informasi verifikasi tidak cocok',
        };
      }
      if (error.statusCode === 400) {
        return {
          success: false,
          error: 'Format tiket tidak valid',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mencari tiket',
    };
  }
}

/**
 * Get ticket by ID
 */
export async function getTicketById(ticketId: string): Promise<{
  success: boolean;
  ticket?: EnhancedSilpanaData;
  error?: string;
}> {
  try {
    const response = await apiRequest<{
      ticket: TicketResponse;
    }>(`/tickets/${ticketId}`, {
      method: 'GET',
    });

    return {
      success: true,
      ticket: response.ticket as EnhancedSilpanaData,
    };

  } catch (error) {
    console.error('Error getting ticket:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengambil data tiket',
    };
  }
}

/**
 * Get ticket history
 */
export async function getTicketHistory(ticketId: string): Promise<{
  success: boolean;
  history?: TicketHistory[];
  error?: string;
}> {
  try {
    const response = await apiRequest<{
      history: TicketHistory[];
    }>(`/tickets/${ticketId}/history`, {
      method: 'GET',
    });

    return {
      success: true,
      history: response.history,
    };

  } catch (error) {
    console.error('Error getting ticket history:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengambil riwayat tiket',
    };
  }
}

/**
 * Get ticket statistics
 */
export async function getTicketStats(): Promise<{
  success: boolean;
  stats?: {
    total_tickets: number;
    by_status: Record<TicketStatus, number>;
    by_priority: Record<PriorityLevel, number>;
    avg_resolution_time: number;
    today_tickets: number;
    pending_tickets: number;
  };
  error?: string;
}> {
  try {
    const response = await apiRequest<{
      stats: any;
    }>('/stats', {
      method: 'GET',
    });

    return {
      success: true,
      stats: response.stats,
    };

  } catch (error) {
    console.error('Error getting ticket stats:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengambil statistik',
    };
  }
}

/**
 * Get tickets by status
 */
export async function getTicketsByStatus(
  status: TicketStatus,
  limit: number = 50,
  offset: number = 0
): Promise<{
  success: boolean;
  tickets?: EnhancedSilpanaData[];
  total?: number;
  error?: string;
}> {
  try {
    const response = await apiRequest<{
      tickets: TicketResponse[];
      total: number;
    }>(`/tickets/status/${status}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
    });

    return {
      success: true,
      tickets: response.tickets as EnhancedSilpanaData[],
      total: response.total,
    };

  } catch (error) {
    console.error('Error getting tickets by status:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Gagal mengambil data tiket',
    };
  }
}

/**
 * Health check for SILPANA service
 */
export async function healthCheck(): Promise<{
  success: boolean;
  status?: string;
  message?: string;
  error?: string;
}> {
  try {
    const response = await apiRequest<{
      status: string;
      message: string;
      timestamp: string;
    }>('/health', {
      method: 'GET',
    });

    return {
      success: true,
      status: response.status,
      message: response.message,
    };

  } catch (error) {
    console.error('Health check failed:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Health check gagal',
    };
  }
}

/**
 * Get client IP address
 */
async function getClientIP(): Promise<string> {
  try {
    const response = await fetch('https://api.ipify.org?format=json', {
      signal: AbortSignal.timeout(3000),
    });
    const data = await response.json();
    return data.ip || 'unknown';
  } catch (error) {
    console.warn('Failed to get client IP:', error);
    return 'unknown';
  }
}

/**
 * Check if backend is available
 */
export async function checkBackendAvailability(): Promise<boolean> {
  try {
    const result = await healthCheck();
    return result.success;
  } catch {
    return false;
  }
}

/**
 * Export API client
 */
export const golangApi = {
  submitTicket,
  lookupTicket,
  getTicketById,
  getTicketHistory,
  getTicketStats,
  getTicketsByStatus,
  healthCheck,
  checkBackendAvailability,
};

export default golangApi;
