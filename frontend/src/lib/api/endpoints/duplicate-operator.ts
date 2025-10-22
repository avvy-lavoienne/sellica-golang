/**
 * Duplicate Operator API Client
 * Handles all API calls to the backend for duplicate operator operations
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const API_PREFIX = `${API_BASE_URL}/api/v1`;

/**
 * Duplicate Operator API client
 */
class DuplicateOperatorAPI {
  /**
   * Get authentication token from storage
   */
  private getAuthToken(): string | null {
    // TODO: Get from localStorage, sessionStorage, or cookies
    // return localStorage.getItem("auth_token");
    return null;
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
   */
  async list(params: ListQueryParams = {}): Promise<DuplicateOperatorListResponse> {
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

      const response = await axios.get<DuplicateOperatorListResponse>(url, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get a single duplicate operator by ID
   */
  async getById(id: string): Promise<DuplicateOperatorResponse> {
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
  }

  /**
   * Create a new duplicate operator record
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
   */
  async update(
    id: string,
    data: UpdateDuplicateOperatorRequest
  ): Promise<DuplicateOperatorResponse> {
    try {
      const response = await axios.put<{
        data: DuplicateOperatorResponse;
      }>(`${API_PREFIX}/duplicate-operators/${id}`, data, {
        headers: this.getHeaders(),
        timeout: 30000,
      });

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
   */
  async search(query: string): Promise<DuplicateOperatorResponse[]> {
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
  }

  /**
   * Handle API errors and convert to user-friendly format
   */
  private handleError(error: unknown): APIError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<APIError>;
      
      // If response has data, return it
      if (axiosError.response?.data) {
        return axiosError.response.data;
      }
      
      // If response status is known but no data, create error from status
      if (axiosError.response?.status) {
        return {
          status: "error",
          code: axiosError.response.status,
          message: `API Error: ${axiosError.response.status} ${axiosError.response.statusText || 'Unknown Error'}`,
          timestamp: new Date().toISOString(),
        };
      }
      
      // If no response but error exists (network error)
      if (axiosError.message) {
        return {
          status: "error",
          code: 0,
          message: axiosError.message,
          timestamp: new Date().toISOString(),
        };
      }
    }

    return {
      status: "error",
      code: 500,
      message: "An error occurred. Please try again.",
      timestamp: new Date().toISOString(),
    };
  }
}

// Export singleton instance
export const duplicateOperatorAPI = new DuplicateOperatorAPI();
