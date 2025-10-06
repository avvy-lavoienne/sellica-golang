/**
 * SILPANA Progress Tracking API Client
 * 
 * Handles API calls to fetch ticket progress data from Go backend
 * Endpoint: GET /api/v1/silpana/tickets/:code/progress
 */

import type { ProgressApiResponse, TicketProgressResponse } from '@/types/silpana/progress';

/**
 * API Configuration
 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';
const PROGRESS_ENDPOINT = '/api/v1/silpana/tickets';

/**
 * Fetch ticket progress by ticket code
 * 
 * @param ticketCode - The unique ticket code (e.g., "SILPANA-2024-001")
 * @returns Promise with progress data or throws error
 * 
 * @example
 * const progress = await fetchTicketProgress('SILPANA-2024-001');
 * console.log(`Progress: ${progress.completion_percentage}%`);
 */
export async function fetchTicketProgress(
  ticketCode: string
): Promise<TicketProgressResponse> {
  if (!ticketCode) {
    throw new Error('Kode tiket tidak boleh kosong');
  }

  try {
    const url = `${API_BASE_URL}${PROGRESS_ENDPOINT}/${encodeURIComponent(ticketCode)}/progress`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Add cache control to respect backend 5-minute cache
      cache: 'no-store', // Let backend handle caching
    });

    if (!response.ok) {
      // Handle HTTP errors
      if (response.status === 404) {
        throw new Error('Tiket tidak ditemukan atau progress belum tersedia');
      }
      if (response.status === 500) {
        throw new Error('Terjadi kesalahan pada server. Silakan coba lagi nanti.');
      }
      throw new Error(`HTTP error: ${response.status}`);
    }

    const data: ProgressApiResponse = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Gagal mengambil data progress');
    }

    if (!data.data) {
      throw new Error('Data progress tidak tersedia');
    }

    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Gagal terhubung ke server. Periksa koneksi internet Anda.');
  }
}

/**
 * Fetch ticket progress with retry logic
 * 
 * @param ticketCode - The unique ticket code
 * @param maxRetries - Maximum number of retry attempts (default: 3)
 * @param retryDelay - Delay between retries in ms (default: 1000)
 * @returns Promise with progress data or throws error
 */
export async function fetchTicketProgressWithRetry(
  ticketCode: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<TicketProgressResponse> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fetchTicketProgress(ticketCode);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on 404 (not found)
      if (lastError.message.includes('tidak ditemukan')) {
        throw lastError;
      }

      // Wait before retrying (except on last attempt)
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Gagal mengambil data progress setelah beberapa percobaan');
}

/**
 * Prefetch progress data for caching
 * Useful for optimistic loading
 * 
 * @param ticketCode - The unique ticket code
 */
export function prefetchTicketProgress(ticketCode: string): void {
  if (typeof window === 'undefined') return; // Skip on SSR

  const url = `${API_BASE_URL}${PROGRESS_ENDPOINT}/${encodeURIComponent(ticketCode)}/progress`;
  
  // Use browser's native prefetch if available
  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Parse ISO date string to JavaScript Date
 * 
 * @param dateString - ISO 8601 date string
 * @returns Date object or null if invalid
 */
export function parseProgressDate(dateString: string | undefined): Date | null {
  if (!dateString) return null;
  
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Format duration string (e.g., "2 days 3 hours")
 * 
 * @param duration - PostgreSQL interval string
 * @returns Formatted duration in Indonesian
 */
export function formatDuration(duration: string | undefined): string {
  if (!duration) return '-';

  // Parse PostgreSQL interval format (e.g., "2 days 03:15:30")
  const daysMatch = duration.match(/(\d+)\s+days?/);
  const timeMatch = duration.match(/(\d{2}):(\d{2}):(\d{2})/);

  const days = daysMatch ? parseInt(daysMatch[1]) : 0;
  const hours = timeMatch ? parseInt(timeMatch[1]) : 0;
  const minutes = timeMatch ? parseInt(timeMatch[2]) : 0;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} hari`);
  if (hours > 0) parts.push(`${hours} jam`);
  if (minutes > 0 && days === 0) parts.push(`${minutes} menit`);

  return parts.length > 0 ? parts.join(' ') : 'Kurang dari 1 menit';
}

/**
 * Calculate time remaining based on estimated hours
 * 
 * @param estimatedHours - Estimated hours remaining
 * @returns Formatted string
 */
export function formatEstimatedTime(estimatedHours: number | undefined): string {
  if (!estimatedHours || estimatedHours <= 0) return 'Segera';

  if (estimatedHours < 24) {
    return `~${Math.ceil(estimatedHours)} jam`;
  }

  const days = Math.ceil(estimatedHours / 24);
  return `~${days} hari`;
}

/**
 * Get progress color based on percentage
 * 
 * @param percentage - Completion percentage (0-100)
 * @returns Tailwind color class
 */
export function getProgressColor(percentage: number): string {
  if (percentage >= 100) return 'bg-green-500';
  if (percentage >= 75) return 'bg-blue-500';
  if (percentage >= 50) return 'bg-yellow-500';
  if (percentage >= 25) return 'bg-orange-500';
  return 'bg-gray-400';
}

/**
 * Get step status icon
 * 
 * @param iconName - Icon name from backend
 * @returns Icon component name or default
 */
export function getStepIcon(iconName: string | undefined): string {
  const iconMap: Record<string, string> = {
    'check-circle': 'CheckCircle',
    'check-circle-2': 'CheckCircle2',
    'file-check': 'FileCheck',
    'database': 'Database',
    'printer': 'Printer',
    'camera': 'Camera',
    'credit-card': 'CreditCard',
  };

  return iconMap[iconName || ''] || 'Circle';
}
