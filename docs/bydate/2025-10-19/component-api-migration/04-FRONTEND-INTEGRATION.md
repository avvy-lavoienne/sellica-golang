# 04 - Frontend Integration & API Client Setup

**Document**: Next.js to Go Migration - Frontend Integration & API Client
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Frontend Engineers, Full-Stack Developers
**Type**: Frontend Implementation Guide

---

## Executive Summary

This guide covers updating Next.js frontend components to consume Go backend APIs. Includes TypeScript type definitions, API client setup, form validation integration, and data binding patterns.

**Key Learning**: Type-safe API clients prevent integration errors and make component updates simple.

---

## API Client Architecture

### Frontend API Layer Structure

```typescript
// frontend/src/lib/api/
├── client.ts              // Base HTTP client with auth
├── types/
│   ├── aktivitas-siak.ts  // Response/Request types
│   └── common.ts          // Pagination, errors
├── endpoints/
│   └── aktivitas-siak.ts  // Aktivitas SIAK API calls
└── hooks/
    └── useAktivitasSiak.ts  // React hooks for API calls
```

### Base HTTP Client

```typescript
// frontend/src/lib/api/client.ts

import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

class APIClient {
  private axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token interceptor
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Handle errors globally
    this.axiosInstance.interceptors.response.use(
      (response) => response.data,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - redirect to login
          localStorage.removeItem('auth_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  get<T>(url: string, config?: any) {
    return this.axiosInstance.get<T>(url, config);
  }

  post<T>(url: string, data?: any, config?: any) {
    return this.axiosInstance.post<T>(url, data, config);
  }

  put<T>(url: string, data?: any, config?: any) {
    return this.axiosInstance.put<T>(url, data, config);
  }

  delete<T>(url: string, config?: any) {
    return this.axiosInstance.delete<T>(url, config);
  }
}

export const apiClient = new APIClient();
```

---

## Type Definitions

### Request/Response Types

```typescript
// frontend/src/lib/api/types/aktivitas-siak.ts

// ============ REQUEST TYPES ============

export interface CreateAktivitasSiakRequest {
  bulan_rekapitulasi: string; // YYYY-MM format
  total_aktivitas_individu: number;
  total_aktivitas_keseluruhan: number;
  fix_anomali_data: number;
  restore_data_maintenance: number;
  restore_data_ktp: number;
  daftar_duplikasi: number;
  login_user: number;
  logout_user: number;
  mutasi_elemen_data: number;
}

export interface UpdateAktivitasSiakRequest {
  bulan_rekapitulasi?: string;
  total_aktivitas_individu?: number;
  total_aktivitas_keseluruhan?: number;
  fix_anomali_data?: number;
  restore_data_maintenance?: number;
  restore_data_ktp?: number;
  daftar_duplikasi?: number;
  login_user?: number;
  logout_user?: number;
  mutasi_elemen_data?: number;
}

// ============ RESPONSE TYPES ============

export interface AktivitasSiakRecord {
  id: string;
  user_id: string | null;
  bulan_rekapitulasi: string;
  total_aktivitas_individu: number;
  total_aktivitas_keseluruhan: number;
  fix_anomali_data: number;
  restore_data_maintenance: number;
  restore_data_ktp: number;
  daftar_duplikasi: number;
  login_user: number;
  logout_user: number;
  mutasi_elemen_data: number;
  created_at: string; // ISO 8601
  updated_at: string | null;
}

export interface ListAktivitasSiakResponse {
  status: 'success' | 'error';
  data: AktivitasSiakRecord[];
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export interface SingleAktivitasSiakResponse {
  status: 'success' | 'error';
  data: AktivitasSiakRecord;
}

export interface CreateAktivitasSiakResponse {
  status: 'success' | 'error';
  message: string;
  data: AktivitasSiakRecord;
}

// ============ FORM STATE TYPE ============

export interface AktivitasSiakFormState
  extends CreateAktivitasSiakRequest {
  // Add derived/display fields
  bulan_display?: string; // Indonesian format for display
  total_aktivitas?: number; // Sum of individu + keseluruhan
}
```

### Common Types

```typescript
// frontend/src/lib/api/types/common.ts

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface APIError {
  status: 'error';
  code: number;
  message: string;
  error_details?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

export interface APIResponse<T> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
  error_details?: any;
  timestamp: string;
}

export function isAPIError(error: any): error is APIError {
  return (
    error &&
    typeof error === 'object' &&
    error.status === 'error' &&
    typeof error.code === 'number'
  );
}

export function getErrorMessage(error: any): string {
  if (isAPIError(error)) {
    return error.message || 'Terjadi kesalahan pada server';
  }
  if (error?.message) {
    return error.message;
  }
  return 'Terjadi kesalahan yang tidak diketahui';
}
```

---

## API Endpoint Functions

### Complete API Service

```typescript
// frontend/src/lib/api/endpoints/aktivitas-siak.ts

import { apiClient } from '../client';
import {
  CreateAktivitasSiakRequest,
  UpdateAktivitasSiakRequest,
  AktivitasSiakRecord,
  ListAktivitasSiakResponse,
  SingleAktivitasSiakResponse,
  CreateAktivitasSiakResponse,
} from '../types/aktivitas-siak';

const BASE_PATH = '/api/v1/aktivitas-siak';

// List records with pagination and filtering
export async function listAktivitasSiak(
  page: number = 1,
  pageSize: number = 10,
  filters?: {
    bulan?: string;
    user_id?: string;
  }
): Promise<ListAktivitasSiakResponse> {
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('page_size', pageSize.toString());

  if (filters?.bulan) {
    params.append('bulan', filters.bulan);
  }
  if (filters?.user_id) {
    params.append('user_id', filters.user_id);
  }

  return apiClient.get<ListAktivitasSiakResponse>(
    `${BASE_PATH}?${params.toString()}`
  );
}

// Get single record by ID
export async function getAktivitasSiak(
  id: string
): Promise<SingleAktivitasSiakResponse> {
  return apiClient.get<SingleAktivitasSiakResponse>(`${BASE_PATH}/${id}`);
}

// Create new record
export async function createAktivitasSiak(
  data: CreateAktivitasSiakRequest
): Promise<CreateAktivitasSiakResponse> {
  return apiClient.post<CreateAktivitasSiakResponse>(BASE_PATH, data);
}

// Update existing record
export async function updateAktivitasSiak(
  id: string,
  data: UpdateAktivitasSiakRequest
): Promise<CreateAktivitasSiakResponse> {
  return apiClient.put<CreateAktivitasSiakResponse>(
    `${BASE_PATH}/${id}`,
    data
  );
}

// Delete record
export async function deleteAktivitasSiak(id: string): Promise<void> {
  return apiClient.delete(`${BASE_PATH}/${id}`);
}
```

---

## React Hooks for Data Fetching

### Custom Hooks

```typescript
// frontend/src/lib/api/hooks/useAktivitasSiak.ts

import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listAktivitasSiak,
  getAktivitasSiak,
  createAktivitasSiak,
  updateAktivitasSiak,
  deleteAktivitasSiak,
} from '../endpoints/aktivitas-siak';
import type {
  CreateAktivitasSiakRequest,
  UpdateAktivitasSiakRequest,
  AktivitasSiakRecord,
} from '../types/aktivitas-siak';

// Hook for listing records with pagination
export function useAktivitasSiakList(page: number = 1, pageSize: number = 10) {
  return useQuery({
    queryKey: ['aktivitas-siak', page, pageSize],
    queryFn: () => listAktivitasSiak(page, pageSize),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Hook for fetching single record
export function useAktivitasSiak(id: string) {
  return useQuery({
    queryKey: ['aktivitas-siak', id],
    queryFn: () => getAktivitasSiak(id),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    enabled: !!id,
  });
}

// Hook for creating record
export function useCreateAktivitasSiak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAktivitasSiakRequest) =>
      createAktivitasSiak(data),
    onSuccess: () => {
      // Invalidate list to refetch
      queryClient.invalidateQueries({ queryKey: ['aktivitas-siak'] });
    },
    onError: (error) => {
      console.error('Failed to create record:', error);
    },
  });
}

// Hook for updating record
export function useUpdateAktivitasSiak(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateAktivitasSiakRequest) =>
      updateAktivitasSiak(id, data),
    onSuccess: () => {
      // Invalidate both list and detail
      queryClient.invalidateQueries({ queryKey: ['aktivitas-siak'] });
      queryClient.invalidateQueries({ queryKey: ['aktivitas-siak', id] });
    },
  });
}

// Hook for deleting record
export function useDeleteAktivitasSiak() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteAktivitasSiak(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['aktivitas-siak'] });
    },
  });
}
```

---

## Component Integration Examples

### List Component

```typescript
// frontend/src/components/aktivitas-siak/AktivitasList.tsx

'use client';

import { useState } from 'react';
import { useAktivitasSiakList } from '@/lib/api/hooks/useAktivitasSiak';
import AktivitasTable from './AktivitasTable';
import Pagination from '@/components/Pagination';

export default function AktivitasList() {
  const [page, setPage] = useState(1);
  const pageSize = 5;

  // Fetch data from Go API
  const { data, isLoading, error } = useAktivitasSiakList(page, pageSize);

  if (isLoading) return <div>Memuat data...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="space-y-4">
      {/* Table with data */}
      <AktivitasTable records={data?.data || []} />

      {/* Pagination */}
      {data && (
        <Pagination
          currentPage={data.page}
          totalPages={data.total_pages}
          onPageChange={setPage}
        />
      )}

      {/* Stats */}
      <div className="text-sm text-gray-600">
        Menampilkan {data?.data.length || 0} dari {data?.total || 0} record
      </div>
    </div>
  );
}
```

### Form Component

```typescript
// frontend/src/components/aktivitas-siak/CreateForm.tsx

'use client';

import { useState, ChangeEvent, FormEvent } from 'react';
import { useCreateAktivitasSiak } from '@/lib/api/hooks/useAktivitasSiak';
import { CreateAktivitasSiakRequest } from '@/lib/api/types/aktivitas-siak';
import { useRouter } from 'next/navigation';

export default function CreateForm() {
  const router = useRouter();
  const { mutate: createRecord, isPending } = useCreateAktivitasSiak();

  const [formData, setFormData] = useState<CreateAktivitasSiakRequest>({
    bulan_rekapitulasi: '',
    total_aktivitas_individu: 0,
    total_aktivitas_keseluruhan: 0,
    fix_anomali_data: 0,
    restore_data_maintenance: 0,
    restore_data_ktp: 0,
    daftar_duplikasi: 0,
    login_user: 0,
    logout_user: 0,
    mutasi_elemen_data: 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input change
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    // Validate numeric fields
    if (
      [
        'total_aktivitas_individu',
        'total_aktivitas_keseluruhan',
        'fix_anomali_data',
      ].includes(name)
    ) {
      const numValue = parseInt(value);
      if (numValue < 0) {
        setErrors((prev) => ({
          ...prev,
          [name]: 'Nilai tidak boleh negatif',
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: name.includes('total') || name.includes('data')
        ? parseInt(value)
        : value,
    }));

    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.bulan_rekapitulasi) {
      newErrors.bulan_rekapitulasi = 'Bulan harus diisi';
    }

    if (formData.total_aktivitas_individu <= 0) {
      newErrors.total_aktivitas_individu =
        'Total aktivitas individu harus lebih dari 0';
    }

    if (formData.total_aktivitas_keseluruhan <= 0) {
      newErrors.total_aktivitas_keseluruhan =
        'Total aktivitas keseluruhan harus lebih dari 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    createRecord(formData, {
      onSuccess: () => {
        router.push('/aktivitas-siak');
      },
      onError: (error) => {
        console.error('Failed to create record:', error);
        setErrors({
          submit: 'Gagal menyimpan data. Silahkan coba lagi.',
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Month Input */}
      <div>
        <label className="block text-sm font-medium">
          Bulan Rekapitulasi
        </label>
        <input
          type="month"
          name="bulan_rekapitulasi"
          value={formData.bulan_rekapitulasi}
          onChange={handleChange}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
          required
        />
        {errors.bulan_rekapitulasi && (
          <span className="text-sm text-red-500">
            {errors.bulan_rekapitulasi}
          </span>
        )}
      </div>

      {/* Numeric Fields */}
      {[
        'total_aktivitas_individu',
        'total_aktivitas_keseluruhan',
        'fix_anomali_data',
        'restore_data_maintenance',
        'restore_data_ktp',
        'daftar_duplikasi',
        'login_user',
        'logout_user',
        'mutasi_elemen_data',
      ].map((field) => (
        <div key={field}>
          <label className="block text-sm font-medium">
            {field.split('_').join(' ')}
          </label>
          <input
            type="number"
            name={field}
            value={
              formData[field as keyof CreateAktivitasSiakRequest] || 0
            }
            onChange={handleChange}
            className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            min="0"
          />
          {errors[field] && (
            <span className="text-sm text-red-500">{errors[field]}</span>
          )}
        </div>
      ))}

      {/* Submit Error */}
      {errors.submit && (
        <div className="rounded bg-red-100 p-3 text-sm text-red-700">
          {errors.submit}
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded bg-blue-500 px-4 py-2 text-white disabled:bg-gray-400"
      >
        {isPending ? 'Menyimpan...' : 'Simpan'}
      </button>
    </form>
  );
}
```

---

## Form Validation Strategies

### Validation Rules

```typescript
// frontend/src/lib/validation/aktivitas-siak-validation.ts

import { CreateAktivitasSiakRequest } from '@/lib/api/types/aktivitas-siak';

export const validationRules = {
  bulan_rekapitulasi: {
    required: true,
    pattern: /^\d{4}-\d{2}$/,
    message: 'Format harus YYYY-MM',
  },
  total_aktivitas_individu: {
    required: true,
    min: 1,
    message: 'Harus lebih dari 0',
  },
  total_aktivitas_keseluruhan: {
    required: true,
    min: 1,
    message: 'Harus lebih dari 0',
  },
  fix_anomali_data: {
    required: false,
    min: 0,
    message: 'Tidak boleh negatif',
  },
  // ... other fields with min: 0
};

export function validateField(
  fieldName: keyof CreateAktivitasSiakRequest,
  value: any
): string | null {
  const rule = validationRules[fieldName];

  if (!rule) return null;

  if (rule.required && (value === null || value === '' || value === undefined)) {
    return 'Field ini diperlukan';
  }

  if (rule.pattern && !rule.pattern.test(value)) {
    return rule.message;
  }

  if (rule.min !== undefined && typeof value === 'number' && value < rule.min) {
    return rule.message;
  }

  return null;
}

export function validateForm(
  data: Partial<CreateAktivitasSiakRequest>
): Record<string, string> {
  const errors: Record<string, string> = {};

  Object.entries(data).forEach(([key, value]) => {
    const error = validateField(key as keyof CreateAktivitasSiakRequest, value);
    if (error) {
      errors[key] = error;
    }
  });

  return errors;
}
```

---

## Date Formatting for Display

### Display Utilities

```typescript
// frontend/src/lib/formatting/date-formatter.ts

// Map numeric months to Indonesian names
const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

// Convert YYYY-MM to "Bulan Tahun" format
export function formatMonthDisplay(monthString: string): string {
  try {
    const [year, month] = monthString.split('-');
    const monthNum = parseInt(month) - 1;

    if (monthNum < 0 || monthNum > 11) {
      return monthString;
    }

    return `${INDONESIAN_MONTHS[monthNum]} ${year}`;
  } catch {
    return monthString;
  }
}

// Format ISO timestamp to Indonesian date
export function formatTimestamp(isoString: string): string {
  try {
    const date = new Date(isoString);
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${day} ${INDONESIAN_MONTHS[month]} ${year} pukul ${hours}.${minutes}`;
  } catch {
    return isoString;
  }
}

// Parse Indonesian date format back to YYYY-MM
export function parseIndonesianMonth(displayString: string): string {
  try {
    const parts = displayString.split(' ');
    if (parts.length !== 2) return '';

    const monthName = parts[0].toLowerCase();
    const year = parts[1];

    const monthNum = INDONESIAN_MONTHS.map((m) => m.toLowerCase()).indexOf(
      monthName
    );

    if (monthNum === -1) return '';

    return `${year}-${String(monthNum + 1).padStart(2, '0')}`;
  } catch {
    return '';
  }
}
```

### Using in Components

```typescript
// In table component
import { formatMonthDisplay, formatTimestamp } from '@/lib/formatting/date-formatter';

export function AktivitasTable({ records }) {
  return (
    <table>
      <tbody>
        {records.map((record) => (
          <tr key={record.id}>
            <td>{formatMonthDisplay(record.bulan_rekapitulasi)}</td>
            <td>{record.total_aktivitas_individu}</td>
            <td>{formatTimestamp(record.created_at)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

---

## Error Handling in Components

### Error Boundary

```typescript
// frontend/src/components/ErrorBoundary.tsx

'use client';

import { ReactNode, useState, useEffect } from 'react';
import { isAPIError } from '@/lib/api/types/common';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ErrorBoundary({ children, fallback }: Props) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<any>(null);

  useEffect(() => {
    const handler = (event: ErrorEvent) => {
      console.error('Uncaught error:', event.error);
      setError(event.error);
      setHasError(true);
    };

    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  if (hasError) {
    return (
      <div className="rounded bg-red-100 p-4 text-red-700">
        <h2 className="font-bold">Terjadi Kesalahan</h2>
        <p>{isAPIError(error) ? error.message : error?.message}</p>
        <button
          onClick={() => {
            setHasError(false);
            setError(null);
          }}
          className="mt-2 rounded bg-red-600 px-3 py-1 text-white"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  return children || fallback;
}
```

---

## State Management Pattern

### Using React Context with Hooks

```typescript
// frontend/src/context/AktivitasContext.tsx

'use client';

import { createContext, useContext, useReducer, ReactNode } from 'react';
import { AktivitasSiakRecord } from '@/lib/api/types/aktivitas-siak';

interface AktivitasState {
  records: AktivitasSiakRecord[];
  selectedRecord: AktivitasSiakRecord | null;
  page: number;
  pageSize: number;
  total: number;
}

type Action =
  | { type: 'SET_RECORDS'; payload: AktivitasSiakRecord[] }
  | { type: 'SELECT_RECORD'; payload: AktivitasSiakRecord }
  | { type: 'SET_PAGE'; payload: number }
  | { type: 'ADD_RECORD'; payload: AktivitasSiakRecord }
  | { type: 'UPDATE_RECORD'; payload: AktivitasSiakRecord }
  | { type: 'DELETE_RECORD'; payload: string };

const AktivitasContext = createContext<
  { state: AktivitasState; dispatch: (action: Action) => void } | undefined
>(undefined);

function aktivitasReducer(state: AktivitasState, action: Action): AktivitasState {
  switch (action.type) {
    case 'SET_RECORDS':
      return { ...state, records: action.payload };
    case 'SELECT_RECORD':
      return { ...state, selectedRecord: action.payload };
    case 'SET_PAGE':
      return { ...state, page: action.payload };
    case 'ADD_RECORD':
      return {
        ...state,
        records: [action.payload, ...state.records],
      };
    case 'UPDATE_RECORD':
      return {
        ...state,
        records: state.records.map((r) =>
          r.id === action.payload.id ? action.payload : r
        ),
      };
    case 'DELETE_RECORD':
      return {
        ...state,
        records: state.records.filter((r) => r.id !== action.payload),
      };
    default:
      return state;
  }
}

export function AktivitasProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(aktivitasReducer, {
    records: [],
    selectedRecord: null,
    page: 1,
    pageSize: 10,
    total: 0,
  });

  return (
    <AktivitasContext.Provider value={{ state, dispatch }}>
      {children}
    </AktivitasContext.Provider>
  );
}

export function useAktivitas() {
  const context = useContext(AktivitasContext);
  if (!context) {
    throw new Error('useAktivitas must be used within AktivitasProvider');
  }
  return context;
}
```

---

## Migration Checklist

- [ ] Create base HTTP client with auth interceptor
- [ ] Define all TypeScript types for requests/responses
- [ ] Create API endpoint functions
- [ ] Set up React Query hooks
- [ ] Create form validation utilities
- [ ] Implement date formatting functions
- [ ] Convert form components to use new API
- [ ] Convert list components to use new API
- [ ] Test all API calls work
- [ ] Verify error handling
- [ ] Check pagination works
- [ ] Test form validation

---

## Next Steps

1. Read [05-SERVICE-IMPLEMENTATION.md](05-SERVICE-IMPLEMENTATION.md) for backend service patterns
2. Check [06-TESTING-VALIDATION.md](06-TESTING-VALIDATION.md) for testing these components
3. Review [03-ENDPOINT-MIGRATION.md](03-ENDPOINT-MIGRATION.md) for API spec details

---

**Last Updated**: 2025-10-19
**Key Learning**: Type-safe API clients prevent integration errors
**Reference**: frontend/src/lib/api/ implementation in codebase

