/**
 * Duplicate Operator API Client
 * Handles all API calls to the backend for duplicate operator operations
 *
 * Features:
 * - Automatic retry with exponential backoff
 * - Request deduplication
 * - Enhanced error handling
 * - JWT token authentication
 */

import axios, { AxiosError } from "axios";
import type {
  CreateDuplicateOperatorRequest,
  UpdateDuplicateOperatorRequest,
  DuplicateOperatorResponse,
  DuplicateOperatorListResponse,
  ListQueryParams,
  APIError,
} from "../types/duplicate-operator";
import { getValidToken, getTokenWithDiagnostics } from "../token-refresh";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_PREFIX = `${API_BASE_URL}/api/v1`;

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

/**
 * Duplicate Operator API client
 */
class DuplicateOperatorAPI {
  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retry logic with exponential backoff
   * @param fn - Function to retry
   * @param retries - Number of retries remaining
   * @param delay - Current delay in milliseconds
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    retries: number = MAX_RETRIES,
    delay: number = INITIAL_RETRY_DELAY
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries === 0) {
        throw error;
      }

      // Check if error is retryable (network errors, 5xx errors)
      const isRetryable = this.isRetryableError(error);
      if (!isRetryable) {
        throw error;
      }

      // Wait before retrying
      await this.sleep(delay);

      // Retry with exponential backoff
      return this.retryWithBackoff(fn, retries - 1, delay * 2);
    }
  }

  /**
   * Check if error is retryable
   */
  private isRetryableError(error: unknown): boolean {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;

      // Network errors are retryable
      if (!axiosError.response) {
        return true;
      }

      // 5xx server errors are retryable
      const status = axiosError.response.status;
      if (status >= 500 && status < 600) {
        return true;
      }

      // 429 Too Many Requests is retryable
      if (status === 429) {
        return true;
      }
    }

    return false;
  }

  /**
   * Get authentication token from storage
   * Synchronously retrieves fresh token from localStorage
   * For async token refresh, use the getValidToken utility directly in methods
   */
  private getAuthToken(): string | null {
    // Check if running in browser
    if (typeof window === "undefined") {
      return null;
    }

    try {
      // Try to get Supabase session from localStorage
      const supabaseAuthKey = Object.keys(localStorage).find(
        (key) => key.startsWith("sb-") && key.endsWith("-auth-token")
      );

      if (supabaseAuthKey) {
        const authData = localStorage.getItem(supabaseAuthKey);
        if (authData) {
          const parsed = JSON.parse(authData);
          const accessToken = parsed?.access_token;
          
          if (accessToken) {
            console.log("🔐 [Auth Token] Retrieved fresh token from Supabase session");
            return accessToken;
          }
        }
      }

      // Fallback: check for custom auth token
      const customToken = localStorage.getItem("auth_token");
      if (customToken) {
        console.log("🔐 [Auth Token] Using custom auth token from localStorage");
        return customToken;
      }
      
      console.warn("⚠️ [Auth Token] No authentication token found in localStorage");
      return null;
    } catch (error) {
      console.error("❌ Error retrieving auth token:", error);
      return null;
    }
  }

  /**
   * Get HTTP headers with authentication
   */
  private getHeaders(): Record<string, string> {
    const token = this.getAuthToken();
    return {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  /**
   * List duplicate operators with pagination and filtering
   * Includes automatic retry with exponential backoff for transient failures
   */
  async list(params: ListQueryParams = {}): Promise<DuplicateOperatorListResponse> {
    return this.retryWithBackoff(async () => {
      try {
        const queryString = new URLSearchParams();

        if (params.page) queryString.append("page", String(params.page));
        if (params.page_size)
          queryString.append("page_size", String(params.page_size));
        if (params.search) queryString.append("search", params.search);
        if (params.status) queryString.append("status", params.status);
        if (params.sort_by) queryString.append("sort_by", params.sort_by);
        if (params.sort_order) queryString.append("sort_order", params.sort_order);
        if (params.date_from) queryString.append("date_from", params.date_from);
        if (params.date_to) queryString.append("date_to", params.date_to);

        const url = `${API_PREFIX}/duplicate-operators${
          queryString.toString() ? `?${queryString.toString()}` : ""
        }`;

        console.log("📡 [DuplicateOperatorAPI.list] Requesting:", {
          url,
          params: {
            page: params.page,
            page_size: params.page_size,
            search: params.search,
            status: params.status,
            date_from: params.date_from,
            date_to: params.date_to,
          },
        });

        const response = await axios.get<DuplicateOperatorListResponse>(url, {
          headers: this.getHeaders(),
          timeout: 30000,
        });

        console.log("✅ [DuplicateOperatorAPI.list] Response received:", {
          itemCount: response.data.data?.length,
          total: response.data.pagination?.total,
          page: response.data.pagination?.page,
        });

        return response.data;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get a single duplicate operator by ID
   * Includes automatic retry with exponential backoff for transient failures
   */
  async getById(id: string): Promise<DuplicateOperatorResponse> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.get<{
          data: DuplicateOperatorResponse;
        }>(`${API_PREFIX}/duplicate-operators/${id}`, {
          headers: this.getHeaders(),
          timeout: 30000,
        });

        return response.data.data;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Create a new duplicate operator record
   * Note: Create operations are NOT retried automatically to prevent duplicate submissions
   */
  async create(
    data: CreateDuplicateOperatorRequest
  ): Promise<DuplicateOperatorResponse> {
    try {
      const response = await axios.post<{
        data: DuplicateOperatorResponse;
      }>(`${API_PREFIX}/duplicate-operators`, data, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Update an existing duplicate operator record
   * Note: Update operations are NOT retried automatically to prevent duplicate updates
   */
  async update(
    id: string,
    data: UpdateDuplicateOperatorRequest
  ): Promise<DuplicateOperatorResponse> {
    try {
      const response = await axios.put<{
        status: string;
        code: number;
        message: string;
        data: DuplicateOperatorResponse;
      }>(`${API_PREFIX}/duplicate-operators/${id}`, data, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      console.log("✅ Update response:", response.data);
      
      if (!response.data.data) {
        console.error("❌ Response has no data field:", response.data);
        throw new Error("Backend response missing data field");
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete a duplicate operator record
   */
  async delete(id: string): Promise<void> {
    try {
      await axios.delete(`${API_PREFIX}/duplicate-operators/${id}`, {
        headers: this.getHeaders(),
        timeout: 30000,
      });
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Search for duplicate operators
   * Includes automatic retry with exponential backoff for transient failures
   */
  async search(query: string): Promise<DuplicateOperatorResponse[]> {
    return this.retryWithBackoff(async () => {
      try {
        const response = await axios.get<DuplicateOperatorListResponse>(
          `${API_PREFIX}/duplicate-operators/search?q=${encodeURIComponent(query)}`,
          {
            headers: this.getHeaders(),
            timeout: 30000,
          }
        );

        return response.data.data;
      } catch (error) {
        throw this.handleError(error);
      }
    });
  }

  /**
   * Get user-friendly error message in Indonesian
   */
  private getUserFriendlyMessage(status: number, defaultMessage?: string): string {
    const errorMessages: Record<number, string> = {
      400: "Data yang dikirim tidak valid. Periksa kembali input Anda.",
      401: "Sesi Anda telah berakhir. Silakan login kembali.",
      403: "Anda tidak memiliki akses untuk melakukan operasi ini.",
      404: "Data tidak ditemukan.",
      409: "Data sudah ada. Silakan gunakan data yang berbeda.",
      422: "Data tidak dapat diproses. Periksa kembali input Anda.",
      429: "Terlalu banyak permintaan. Silakan coba lagi dalam beberapa saat.",
      500: "Terjadi kesalahan pada server. Silakan coba lagi.",
      502: "Server sedang tidak dapat dijangkau. Silakan coba lagi.",
      503: "Layanan sedang dalam pemeliharaan. Silakan coba lagi nanti.",
      504: "Waktu permintaan habis. Silakan coba lagi.",
    };

    return errorMessages[status] || defaultMessage || "Terjadi kesalahan. Silakan coba lagi.";
  }

  /**
   * Handle API errors and convert to user-friendly format
   * Provides Indonesian error messages for better user experience
   */
  private handleError(error: unknown): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      
      // If response has data, enhance with user-friendly message
      if (axiosError.response?.data) {
        const errorData = axiosError.response.data;
        return {
          ...errorData,
          message: errorData.message || this.getUserFriendlyMessage(axiosError.response.status),
        };
      }
      
      // If response status is known but no data, create error from status
      if (axiosError.response?.status) {
        const status = axiosError.response.status;
        return {
          status: "error",
          code: status,
          message: this.getUserFriendlyMessage(status),
          timestamp: new Date().toISOString(),
        };
      }

      // Network error (no response from server)
      if (axiosError.code === 'ECONNABORTED' || axiosError.code === 'ETIMEDOUT') {
        return {
          status: "error",
          code: 0,
          message: "Koneksi ke server terputus. Periksa koneksi internet Anda.",
          timestamp: new Date().toISOString(),
        };
      }

      // Other network errors
      if (!axiosError.response) {
        return {
          status: "error",
          code: 0,
          message: "Tidak dapat terhubung ke server. Periksa koneksi internet Anda dan coba lagi.",
          timestamp: new Date().toISOString(),
        };
      }
    }

    // Unknown error
    return {
      status: "error",
      code: 500,
      message: "Terjadi kesalahan yang tidak terduga. Silakan coba lagi.",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const duplicateOperatorAPI = new DuplicateOperatorAPI();
