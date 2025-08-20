/**
 * Protected API Service
 * Provides circuit breaker protection for external API calls
 */

import { circuitBreakerManager } from './CircuitBreakerManager';
import { performanceMonitor } from './performanceMonitor';
import { errorHandler } from './errorHandler';

export interface ApiRequestConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  serviceName?: string;
  serviceType?: string;
}

export interface ApiResponse<T = any> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  duration: number;
  fromCache?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  isTimeout?: boolean;
  isNetworkError?: boolean;
}

export class ProtectedApiService {
  private static instance: ProtectedApiService | null = null;
  private requestCache: Map<string, { response: ApiResponse; timestamp: number }> = new Map();
  private readonly cacheTimeout = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  /**
   * Get singleton instance
   */
  static getInstance(): ProtectedApiService {
    if (!ProtectedApiService.instance) {
      ProtectedApiService.instance = new ProtectedApiService();
    }
    return ProtectedApiService.instance;
  }

  /**
   * Make protected API request with circuit breaker
   */
  async request<T = any>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const serviceName = config.serviceName || this.extractServiceName(config.url);
    const serviceType = config.serviceType || 'external-api';
    const startTime = performance.now();

    // Check cache first
    const cacheKey = this.generateCacheKey(config);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      console.log(`📦 Cache hit for ${serviceName}`);
      return cached as ApiResponse<T>;
    }

    const operationId = performanceMonitor?.startAIOperation(`api.${serviceName}`, {
      url: config.url,
      method: config.method,
      serviceName,
      serviceType
    });

    try {
      // Execute with circuit breaker protection
      const response = await circuitBreakerManager.executeWithProtection(
        serviceName,
        async () => {
          return await this.executeRequest<T>(config);
        },
        serviceType
      );

      // Cache successful responses
      this.setCache(cacheKey, response);

      // Complete performance tracking
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(operationId, true);
      }

      const duration = performance.now() - startTime;
      console.log(`✅ API request to ${serviceName} completed in ${duration.toFixed(2)}ms`);

      return response;

    } catch (error) {
      const duration = performance.now() - startTime;

      // Handle and log error
      const apiError = this.handleApiError(error, config);
      
      if (errorHandler) {
        errorHandler.handleError(
          apiError,
          errorHandler.createContext(`api.${serviceName}`, {
            metadata: {
              url: config.url,
              method: config.method,
              duration,
              serviceType
            }
          }),
          'error'
        );
      }

      // Complete performance tracking with error
      if (operationId && performanceMonitor) {
        performanceMonitor.completeAIOperation(
          operationId,
          false,
          apiError.code || 'ApiError'
        );
      }

      console.error(`❌ API request to ${serviceName} failed after ${duration.toFixed(2)}ms:`, apiError.message);
      throw apiError;
    }
  }

  /**
   * Make GET request with circuit breaker protection
   */
  async get<T = any>(url: string, options: Partial<ApiRequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'GET',
      ...options
    });
  }

  /**
   * Make POST request with circuit breaker protection
   */
  async post<T = any>(url: string, body?: any, options: Partial<ApiRequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'POST',
      body,
      ...options
    });
  }

  /**
   * Make PUT request with circuit breaker protection
   */
  async put<T = any>(url: string, body?: any, options: Partial<ApiRequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'PUT',
      body,
      ...options
    });
  }

  /**
   * Make DELETE request with circuit breaker protection
   */
  async delete<T = any>(url: string, options: Partial<ApiRequestConfig> = {}): Promise<ApiResponse<T>> {
    return this.request<T>({
      url,
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Execute the actual HTTP request
   */
  private async executeRequest<T>(config: ApiRequestConfig): Promise<ApiResponse<T>> {
    const startTime = performance.now();
    const timeout = config.timeout || 10000;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchConfig: RequestInit = {
        method: config.method,
        headers: {
          'Content-Type': 'application/json',
          ...config.headers
        },
        signal: controller.signal
      };

      if (config.body && (config.method === 'POST' || config.method === 'PUT' || config.method === 'PATCH')) {
        fetchConfig.body = typeof config.body === 'string' ? config.body : JSON.stringify(config.body);
      }

      const response = await fetch(config.url, fetchConfig);
      clearTimeout(timeoutId);

      const duration = performance.now() - startTime;

      // Parse response
      let data: T;
      const contentType = response.headers.get('content-type');
      
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text() as any;
      }

      // Convert headers to object
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return {
        data,
        status: response.status,
        statusText: response.statusText,
        headers,
        duration
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`Request timeout after ${timeout}ms`);
      }
      
      throw error;
    }
  }

  /**
   * Handle API errors and convert to standardized format
   */
  private handleApiError(error: any, config: ApiRequestConfig): ApiError {
    const apiError: ApiError = {
      message: error instanceof Error ? error.message : String(error),
      isTimeout: false,
      isNetworkError: false
    };

    // Detect timeout errors
    if (apiError.message.includes('timeout') || apiError.message.includes('AbortError')) {
      apiError.isTimeout = true;
      apiError.code = 'TIMEOUT';
    }

    // Detect network errors
    if (apiError.message.includes('fetch') || apiError.message.includes('network')) {
      apiError.isNetworkError = true;
      apiError.code = 'NETWORK_ERROR';
    }

    // Extract HTTP status if available
    const statusMatch = apiError.message.match(/HTTP (\d+):/);
    if (statusMatch) {
      apiError.status = parseInt(statusMatch[1]);
      apiError.code = `HTTP_${apiError.status}`;
    }

    return apiError;
  }

  /**
   * Extract service name from URL
   */
  private extractServiceName(url: string): string {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname;
      
      // Extract meaningful service name from hostname
      if (hostname.includes('supabase')) return 'supabase-api';
      if (hostname.includes('groq')) return 'groq-api';
      if (hostname.includes('upstash')) return 'upstash-redis';
      if (hostname.includes('openai')) return 'openai-api';
      if (hostname.includes('deepseek')) return 'deepseek-api';
      
      // Fallback to hostname
      return hostname.replace(/\./g, '-');
    } catch {
      return 'unknown-api';
    }
  }

  /**
   * Generate cache key for request
   */
  private generateCacheKey(config: ApiRequestConfig): string {
    const key = `${config.method}:${config.url}`;
    if (config.body) {
      const bodyHash = JSON.stringify(config.body);
      return `${key}:${btoa(bodyHash).slice(0, 16)}`;
    }
    return key;
  }

  /**
   * Get response from cache
   */
  private getFromCache(key: string): ApiResponse | null {
    const cached = this.requestCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return { ...cached.response, fromCache: true };
    }
    
    // Remove expired cache entry
    if (cached) {
      this.requestCache.delete(key);
    }
    
    return null;
  }

  /**
   * Set response in cache
   */
  private setCache(key: string, response: ApiResponse): void {
    // Only cache successful GET requests
    if (response.status >= 200 && response.status < 300) {
      this.requestCache.set(key, {
        response: { ...response },
        timestamp: Date.now()
      });

      // Cleanup old cache entries
      if (this.requestCache.size > 100) {
        const oldestKey = this.requestCache.keys().next().value;
        if (oldestKey) {
          this.requestCache.delete(oldestKey);
        }
      }
    }
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.requestCache.clear();
    console.log('🧹 API cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate: number } {
    // This is a simplified implementation
    return {
      size: this.requestCache.size,
      hitRate: 0 // Would need to track hits/misses for accurate calculation
    };
  }
}

// Export singleton instance
export const protectedApiService = ProtectedApiService.getInstance();

export default protectedApiService;
