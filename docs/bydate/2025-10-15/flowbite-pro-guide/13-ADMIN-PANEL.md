# Flowbite Pro Frontend Refining Guide - Admin Panel Components

**Document**: Flowbite Pro UI/UX Refining Guide - Admin Panel Components
**Project Date**: 2025-10-15
**Created**: 2025-10-15
**Version**: 1.0
**Status**: 🚀 Ready
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation

## Executive Summary

This guide provides detailed instructions for implementing admin panel components using Flowbite Pro materials. The guide covers response forms, data tables, filters, layouts, and bulk operations while maintaining SELLY's Indonesian language support, government compliance, and WebSocket integration requirements.

## Current Admin Panel Analysis

### Existing Admin Panel Implementation

**Location**: `frontend/src/components/silpana/admin/`, various admin components

**Current Issues**:
- Complex custom admin forms with extensive validation
- Basic data tables with limited functionality
- Simple filter components without advanced features
- Inconsistent admin layouts across different sections
- Limited bulk operation capabilities
- Manual pagination and sorting implementation

**Common Patterns Found**:
```typescript
// Current admin pattern - custom form with basic validation
<form onSubmit={handleSubmit} className="space-y-4">
  <div className="space-y-2">
    <Label htmlFor="message">Pesan</Label>
    <Textarea
      id="message"
      value={message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder="Masukkan pesan..."
    />
  </div>
  <Button type="submit" disabled={isSubmitting}>
    {isSubmitting ? "Mengirim..." : "Kirim"}
  </Button>
</form>
```

## Flowbite Pro Admin Panel Patterns

### Admin Response Components

**Advanced Admin Response Form**:
```typescript
import { useState, useRef } from 'react';
import { Card, Button, Textarea, FileInput, Select, Badge, Alert } from "flowbite-react";
import { HiPaperClip, HiSend, HiEye, HiEyeOff, HiExclamationTriangle } from "react-icons/hi";

interface AdminResponseFormProps {
  ticketId: string;
  ticketCode: string;
  onResponseSent?: (response: AdminResponse) => void;
  onInternalNote?: (note: InternalNote) => void;
  loading?: boolean;
  disabled?: boolean;
}

interface AdminResponse {
  message: string;
  attachments: File[];
  priority: 'normal' | 'urgent';
  notifyUser: boolean;
}

interface InternalNote {
  note: string;
  category: 'general' | 'escalation' | 'followup' | 'resolution';
  visibility: 'private' | 'team';
}

export function AdminResponseForm({
  ticketId,
  ticketCode,
  onResponseSent,
  onInternalNote,
  loading = false,
  disabled = false
}: AdminResponseFormProps) {
  const [response, setResponse] = useState<AdminResponse>({
    message: '',
    attachments: [],
    priority: 'normal',
    notifyUser: true
  });

  const [internalNote, setInternalNote] = useState<InternalNote>({
    note: '',
    category: 'general',
    visibility: 'private'
  });

  const [activeTab, setActiveTab] = useState<'response' | 'internal'>('response');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateResponse = () => {
    const newErrors: Record<string, string> = {};

    if (!response.message.trim()) {
      newErrors.message = 'Pesan tidak boleh kosong';
    } else if (response.message.length < 10) {
      newErrors.message = 'Pesan minimal 10 karakter';
    }

    if (response.attachments.length > 5) {
      newErrors.attachments = 'Maksimal 5 lampiran';
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    const oversizedFiles = response.attachments.filter(file => file.size > maxSize);
    if (oversizedFiles.length > 0) {
      newErrors.attachments = 'Ukuran file maksimal 10MB per file';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateInternalNote = () => {
    const newErrors: Record<string, string> = {};

    if (!internalNote.note.trim()) {
      newErrors.note = 'Catatan tidak boleh kosong';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (activeTab === 'response') {
      if (!validateResponse()) return;

      try {
        // Submit response to user
        await submitResponse(ticketId, response);
        onResponseSent?.(response);

        // Reset form
        setResponse({
          message: '',
          attachments: [],
          priority: 'normal',
          notifyUser: true
        });
      } catch (error) {
        console.error('Failed to send response:', error);
      }
    } else {
      if (!validateInternalNote()) return;

      try {
        // Submit internal note
        await submitInternalNote(ticketId, internalNote);
        onInternalNote?.(internalNote);

        // Reset form
        setInternalNote({
          note: '',
          category: 'general',
          visibility: 'private'
        });
      } catch (error) {
        console.error('Failed to add internal note:', error);
      }
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files) {
      const fileArray = Array.from(files);
      setResponse(prev => ({
        ...prev,
        attachments: [...prev.attachments, ...fileArray]
      }));
    }
  };

  const removeAttachment = (index: number) => {
    setResponse(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  return (
    <Card>
      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex">
          <button
            onClick={() => setActiveTab('response')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'response'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Respon ke Pengadu
          </button>
          <button
            onClick={() => setActiveTab('internal')}
            className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'internal'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            Catatan Internal
          </button>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'response' ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pesan Respon <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Ketik pesan respon Anda kepada pengadu..."
                rows={6}
                value={response.message}
                onChange={(e) => setResponse(prev => ({ ...prev, message: e.target.value }))}
                disabled={disabled || loading}
                color={errors.message ? 'failure' : 'gray'}
                helperText={errors.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prioritas
                </label>
                <Select
                  value={response.priority}
                  onChange={(e) => setResponse(prev => ({ ...prev, priority: e.target.value as any }))}
                  disabled={disabled || loading}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </Select>
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="notifyUser"
                  checked={response.notifyUser}
                  onChange={(e) => setResponse(prev => ({ ...prev, notifyUser: !prev.notifyUser }))}
                  disabled={disabled || loading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="notifyUser" className="text-sm text-gray-700 dark:text-gray-300">
                  Kirim notifikasi email ke pengadu
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Lampiran (Opsional)
              </label>
              <FileInput
                ref={fileInputRef}
                multiple
                accept="image/*,.pdf,.doc,.docx,.txt"
                onChange={(e) => handleFileSelect(e.target.files)}
                disabled={disabled || loading}
                helperText="Format: JPG, PNG, PDF, DOC, DOCX, TXT (Max 5 file, 10MB per file)"
                color={errors.attachments ? 'failure' : 'gray'}
              />

              {response.attachments.length > 0 && (
                <div className="mt-3 space-y-2">
                  {response.attachments.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                      <div className="flex items-center space-x-2">
                        <HiPaperClip className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{file.name}</span>
                        <Badge size="sm" color="gray">
                          {(file.size / 1024 / 1024).toFixed(1)}MB
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() => removeAttachment(index)}
                        disabled={disabled || loading}
                      >
                        <HiExclamationTriangle className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {errors.attachments && (
              <Alert color="failure">
                <HiExclamationTriangle className="h-5 w-5" />
                <span>{errors.attachments}</span>
              </Alert>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Catatan Internal <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Tambahkan catatan internal untuk tim admin..."
                rows={4}
                value={internalNote.note}
                onChange={(e) => setInternalNote(prev => ({ ...prev, note: e.target.value }))}
                disabled={disabled || loading}
                color={errors.note ? 'failure' : 'gray'}
                helperText={errors.note}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Kategori
                </label>
                <Select
                  value={internalNote.category}
                  onChange={(e) => setInternalNote(prev => ({ ...prev, category: e.target.value as any }))}
                  disabled={disabled || loading}
                >
                  <option value="general">Umum</option>
                  <option value="escalation">Eskalasi</option>
                  <option value="followup">Tindak Lanjut</option>
                  <option value="resolution">Penyelesaian</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Visibilitas
                </label>
                <Select
                  value={internalNote.visibility}
                  onChange={(e) => setInternalNote(prev => ({ ...prev, visibility: e.target.value as any }))}
                  disabled={disabled || loading}
                >
                  <option value="private">Pribadi</option>
                  <option value="team">Tim</option>
                </Select>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Tiket: <span className="font-mono font-semibold">{ticketCode}</span>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={disabled || loading || (!response.message.trim() && !internalNote.note.trim())}
            size="lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Mengirim...
              </>
            ) : (
              <>
                <HiSend className="h-5 w-5 mr-2" />
                {activeTab === 'response' ? 'Kirim Respon' : 'Tambah Catatan'}
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

### Admin Data Table Components

**Advanced Admin Data Table**:
```typescript
import { useState, useMemo } from 'react';
import { Table, Button, Badge, Checkbox, Select, TextInput, Dropdown } from "flowbite-react";
import {
  HiChevronUp,
  HiChevronDown,
  HiEye,
  HiPencil,
  HiTrash,
  HiFunnel,
  HiMagnifyingGlass,
  HiBarsArrowDown,
  HiBarsArrowUp
} from "react-icons/hi";

interface Column<T> {
  key: keyof T | string;
  header: string;
  sortable?: boolean;
  filterable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  width?: string;
}

interface AdminDataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  loading?: boolean;
  selectable?: boolean;
  onRowSelect?: (selectedIds: string[]) => void;
  onRowClick?: (row: T) => void;
  actions?: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (row: T) => void;
    color?: 'blue' | 'red' | 'green' | 'yellow' | 'gray';
    disabled?: (row: T) => boolean;
  }>;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  bulkActions?: Array<{
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: (selectedIds: string[]) => void;
    color?: 'blue' | 'red' | 'green' | 'yellow' | 'gray';
    confirmMessage?: string;
  }>;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
}

export function AdminDataTable<T extends { id: string }>({
  data,
  columns,
  loading = false,
  selectable = false,
  onRowSelect,
  onRowClick,
  actions = [],
  pagination,
  bulkActions = [],
  emptyState
}: AdminDataTableProps<T>) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: 'asc' | 'desc';
  } | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [globalSearch, setGlobalSearch] = useState('');

  // Sorting logic
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);

  // Filtering logic
  const filteredData = useMemo(() => {
    return sortedData.filter(row => {
      // Global search
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        const rowValues = Object.values(row).join(' ').toLowerCase();
        if (!rowValues.includes(searchLower)) return false;
      }

      // Column filters
      for (const [key, value] of Object.entries(filters)) {
        if (value && !(row as any)[key]?.toString().toLowerCase().includes(value.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [sortedData, filters, globalSearch]);

  // Pagination logic
  const paginatedData = useMemo(() => {
    if (!pagination) return filteredData;

    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    return filteredData.slice(startIndex, startIndex + pagination.pageSize);
  }, [filteredData, pagination]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleRowSelect = (rowId: string, checked: boolean) => {
    const newSelected = new Set(selectedRows);
    if (checked) {
      newSelected.add(rowId);
    } else {
      newSelected.delete(rowId);
    }
    setSelectedRows(newSelected);
    onRowSelect?.(Array.from(newSelected));
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = paginatedData.map(row => row.id);
      setSelectedRows(new Set(allIds));
      onRowSelect?.(allIds);
    } else {
      setSelectedRows(new Set());
      onRowSelect?.([]);
    }
  };

  const getSortIcon = (columnKey: string) => {
    if (sortConfig?.key !== columnKey) return null;

    return sortConfig.direction === 'asc'
      ? <HiBarsArrowUp className="h-4 w-4" />
      : <HiBarsArrowDown className="h-4 w-4" />;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (paginatedData.length === 0 && !loading) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto h-24 w-24 text-gray-400">
          <HiFunnel className="h-full w-full" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
          {emptyState?.title || 'Tidak ada data'}
        </h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {emptyState?.description || 'Belum ada data yang sesuai dengan filter yang dipilih.'}
        </p>
        {emptyState?.action && (
          <Button
            onClick={emptyState.action.onClick}
            className="mt-4"
          >
            {emptyState.action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <TextInput
            type="search"
            placeholder="Cari data..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            icon={HiMagnifyingGlass}
          />
        </div>

        {columns.some(col => col.filterable) && (
          <Dropdown
            label="Filter"
            dismissOnClick={false}
          >
            {columns.filter(col => col.filterable).map(column => (
              <div key={column.key as string} className="p-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {column.header}
                </label>
                <TextInput
                  size="sm"
                  placeholder={`Filter ${column.header.toLowerCase()}...`}
                  value={filters[column.key as string] || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    [column.key as string]: e.target.value
                  }))}
                />
              </div>
            ))}
          </Dropdown>
        )}
      </div>

      {/* Bulk Actions */}
      {bulkActions.length > 0 && selectedRows.size > 0 && (
        <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <span className="text-sm text-blue-800 dark:text-blue-200">
            {selectedRows.size} item dipilih
          </span>
          <div className="flex space-x-2">
            {bulkActions.map((action, index) => (
              <Button
                key={index}
                size="sm"
                color={action.color || 'blue'}
                onClick={() => action.onClick(Array.from(selectedRows))}
              >
                <action.icon className="h-4 w-4 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <Table hoverable={true}>
          <Table.Head>
            {selectable && (
              <Table.HeadCell className="w-12">
                <Checkbox
                  checked={paginatedData.length > 0 && selectedRows.size === paginatedData.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </Table.HeadCell>
            )}
            {columns.map(column => (
              <Table.HeadCell
                key={column.key as string}
                className={column.sortable ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700' : ''}
                onClick={column.sortable ? () => handleSort(column.key as string) : undefined}
                style={{ width: column.width }}
              >
                <div className="flex items-center space-x-1">
                  <span>{column.header}</span>
                  {column.sortable && getSortIcon(column.key as string)}
                </div>
              </Table.HeadCell>
            ))}
            {actions.length > 0 && (
              <Table.HeadCell className="w-24">Aksi</Table.HeadCell>
            )}
          </Table.Head>
          <Table.Body className="divide-y">
            {paginatedData.map((row) => (
              <Table.Row
                key={row.id}
                className={`${
                  selectedRows.has(row.id) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                } ${onRowClick ? 'cursor-pointer' : ''}`}
                onClick={() => onRowClick?.(row)}
              >
                {selectable && (
                  <Table.Cell>
                    <Checkbox
                      checked={selectedRows.has(row.id)}
                      onChange={(e) => handleRowSelect(row.id, e.target.checked)}
                      onClick={(e) => e.stopPropagation()}
                    />
                  </Table.Cell>
                )}
                {columns.map(column => (
                  <Table.Cell key={column.key as string}>
                    {column.render
                      ? column.render((row as any)[column.key], row)
                      : (row as any)[column.key]
                    }
                  </Table.Cell>
                ))}
                {actions.length > 0 && (
                  <Table.Cell>
                    <div className="flex items-center space-x-1">
                      {actions.map((action, index) => (
                        <Button
                          key={index}
                          size="sm"
                          color={action.color || 'gray'}
                          onClick={(e) => {
                            e.stopPropagation();
                            action.onClick(row);
                          }}
                          disabled={action.disabled?.(row)}
                        >
                          <action.icon className="h-4 w-4" />
                        </Button>
                      ))}
                    </div>
                  </Table.Cell>
                )}
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700 dark:text-gray-300">
            Menampilkan {((pagination.currentPage - 1) * pagination.pageSize) + 1} sampai{' '}
            {Math.min(pagination.currentPage * pagination.pageSize, pagination.totalItems)} dari{' '}
            {pagination.totalItems} hasil
          </div>

          <div className="flex items-center space-x-2">
            <Select
              value={pagination.pageSize.toString()}
              onChange={(e) => pagination.onPageSizeChange(Number(e.target.value))}
              size="sm"
            >
              <option value="10">10 per halaman</option>
              <option value="25">25 per halaman</option>
              <option value="50">50 per halaman</option>
              <option value="100">100 per halaman</option>
            </Select>

            <div className="flex space-x-1">
              <Button
                size="sm"
                color="gray"
                disabled={pagination.currentPage === 1}
                onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              >
                Sebelumnya
              </Button>

              {/* Page numbers */}
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNumber = Math.max(1, pagination.currentPage - 2) + i;
                if (pageNumber > pagination.totalPages) return null;

                return (
                  <Button
                    key={pageNumber}
                    size="sm"
                    color={pageNumber === pagination.currentPage ? 'blue' : 'gray'}
                    onClick={() => pagination.onPageChange(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}

              <Button
                size="sm"
                color="gray"
                disabled={pagination.currentPage === pagination.totalPages}
                onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              >
                Selanjutnya
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Admin Filter Components

**Advanced Admin Filters**:
```typescript
import { useState, useEffect } from 'react';
import { Card, Button, Badge, Select, TextInput, Datepicker, Checkbox } from "flowbite-react";
import { HiFunnel, HiX, HiMagnifyingGlass, HiCalendar, HiAdjustments } from "react-icons/hi";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface AdminFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;

  statusOptions: FilterOption[];
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;

  priorityOptions: FilterOption[];
  selectedPriorities: string[];
  onPriorityChange: (priorities: string[]) => void;

  categoryOptions?: FilterOption[];
  selectedCategories?: string[];
  onCategoryChange?: (categories: string[]) => void;

  dateRange?: {
    startDate: Date | null;
    endDate: Date | null;
  };
  onDateRangeChange?: (range: { startDate: Date | null; endDate: Date | null }) => void;

  assigneeOptions?: FilterOption[];
  selectedAssignees?: string[];
  onAssigneeChange?: (assignees: string[]) => void;

  onReset: () => void;
  onApply?: () => void;

  loading?: boolean;
  compact?: boolean;
}

export function AdminFilters({
  searchQuery,
  onSearchChange,
  statusOptions,
  selectedStatuses,
  onStatusChange,
  priorityOptions,
  selectedPriorities,
  onPriorityChange,
  categoryOptions,
  selectedCategories,
  onCategoryChange,
  dateRange,
  onDateRangeChange,
  assigneeOptions,
  selectedAssignees,
  onAssigneeChange,
  onReset,
  onApply,
  loading = false,
  compact = false
}: AdminFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [localDateRange, setLocalDateRange] = useState(dateRange);

  useEffect(() => {
    setLocalDateRange(dateRange);
  }, [dateRange]);

  const hasActiveFilters = searchQuery ||
    selectedStatuses.length > 0 ||
    selectedPriorities.length > 0 ||
    (selectedCategories && selectedCategories.length > 0) ||
    (selectedAssignees && selectedAssignees.length > 0) ||
    (dateRange && (dateRange.startDate || dateRange.endDate));

  const activeFilterCount = selectedStatuses.length +
    selectedPriorities.length +
    (selectedCategories?.length || 0) +
    (selectedAssignees?.length || 0) +
    (dateRange && (dateRange.startDate || dateRange.endDate) ? 1 : 0);

  const handleMultiSelect = (
    current: string[],
    value: string,
    setter: (values: string[]) => void
  ) => {
    if (current.includes(value)) {
      setter(current.filter(item => item !== value));
    } else {
      setter([...current, value]);
    }
  };

  const handleDateRangeChange = (type: 'start' | 'end', date: Date | null) => {
    const newRange = {
      startDate: type === 'start' ? date : localDateRange?.startDate || null,
      endDate: type === 'end' ? date : localDateRange?.endDate || null
    };
    setLocalDateRange(newRange);
    onDateRangeChange?.(newRange);
  };

  const renderFilterSection = (
    title: string,
    options: FilterOption[],
    selected: string[],
    onChange: (values: string[]) => void,
    color: string = 'blue'
  ) => (
    <div className="space-y-3">
      <h4 className="font-medium text-gray-900 dark:text-white">{title}</h4>
      <div className="space-y-2">
        {options.map(option => (
          <div key={option.value} className="flex items-center justify-between">
            <label className="flex items-center space-x-2 cursor-pointer">
              <Checkbox
                checked={selected.includes(option.value)}
                onChange={() => handleMultiSelect(selected, option.value, onChange)}
                disabled={loading}
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {option.label}
              </span>
            </label>
            {option.count !== undefined && (
              <Badge size="sm" color="gray">
                {option.count}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex-1">
          <TextInput
            type="search"
            placeholder="Cari..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={HiMagnifyingGlass}
            size="sm"
          />
        </div>

        <Button
          size="sm"
          color={showAdvanced ? 'blue' : 'gray'}
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <HiFunnel className="h-4 w-4 mr-1" />
          Filter
          {activeFilterCount > 0 && (
            <Badge size="xs" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>

        {hasActiveFilters && (
          <Button size="sm" color="gray" onClick={onReset}>
            <HiX className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card>
      <div className="space-y-4">
        {/* Search */}
        <div>
          <TextInput
            type="search"
            placeholder="Cari tiket, nama, email..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            icon={HiMagnifyingGlass}
            disabled={loading}
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            color={selectedStatuses.length === 0 ? 'blue' : 'gray'}
            onClick={() => onStatusChange([])}
            disabled={loading}
          >
            Semua Status
          </Button>
          {statusOptions.slice(0, 4).map(status => (
            <Button
              key={status.value}
              size="sm"
              color={selectedStatuses.includes(status.value) ? 'blue' : 'gray'}
              onClick={() => onStatusChange([status.value])}
              disabled={loading}
            >
              {status.label}
              {status.count !== undefined && (
                <Badge size="xs" className="ml-1">
                  {status.count}
                </Badge>
              )}
            </Button>
          ))}
        </div>

        {/* Advanced Filters Toggle */}
        <div className="flex items-center justify-between">
          <Button
            color="gray"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            disabled={loading}
          >
            <HiAdjustments className="h-4 w-4 mr-2" />
            {showAdvanced ? 'Sembunyikan' : 'Tampilkan'} Filter Lanjutan
          </Button>

          {hasActiveFilters && (
            <Button
              color="gray"
              size="sm"
              onClick={onReset}
              disabled={loading}
            >
              <HiX className="h-4 w-4 mr-2" />
              Reset Filter
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            {/* Status Filters */}
            {renderFilterSection('Status', statusOptions, selectedStatuses, onStatusChange)}

            {/* Priority Filters */}
            {renderFilterSection('Prioritas', priorityOptions, selectedPriorities, onPriorityChange, 'yellow')}

            {/* Category Filters */}
            {categoryOptions && onCategoryChange && selectedCategories && (
              renderFilterSection('Kategori', categoryOptions, selectedCategories, onCategoryChange, 'purple')
            )}

            {/* Assignee Filters */}
            {assigneeOptions && onAssigneeChange && selectedAssignees && (
              renderFilterSection('Penugasan', assigneeOptions, selectedAssignees, onAssigneeChange, 'green')
            )}

            {/* Date Range */}
            {onDateRangeChange && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 dark:text-white">Rentang Tanggal</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Dari Tanggal
                    </label>
                    <Datepicker
                      value={localDateRange?.startDate || undefined}
                      onChange={(date) => handleDateRangeChange('start', date)}
                      disabled={loading}
                      placeholder="Pilih tanggal mulai"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Sampai Tanggal
                    </label>
                    <Datepicker
                      value={localDateRange?.endDate || undefined}
                      onChange={(date) => handleDateRangeChange('end', date)}
                      disabled={loading}
                      placeholder="Pilih tanggal akhir"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            {selectedStatuses.map(status => {
              const option = statusOptions.find(opt => opt.value === status);
              return option ? (
                <Badge key={status} color="blue" className="flex items-center space-x-1">
                  <span>{option.label}</span>
                  <button
                    onClick={() => handleMultiSelect(selectedStatuses, status, onStatusChange)}
                    className="ml-1 hover:bg-blue-600 rounded-full p-0.5"
                  >
                    <HiX className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}

            {selectedPriorities.map(priority => {
              const option = priorityOptions.find(opt => opt.value === priority);
              return option ? (
                <Badge key={priority} color="yellow" className="flex items-center space-x-1">
                  <span>{option.label}</span>
                  <button
                    onClick={() => handleMultiSelect(selectedPriorities, priority, onPriorityChange)}
                    className="ml-1 hover:bg-yellow-600 rounded-full p-0.5"
                  >
                    <HiX className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}

            {selectedCategories?.map(category => {
              const option = categoryOptions?.find(opt => opt.value === category);
              return option ? (
                <Badge key={category} color="purple" className="flex items-center space-x-1">
                  <span>{option.label}</span>
                  <button
                    onClick={() => onCategoryChange && handleMultiSelect(selectedCategories, category, onCategoryChange)}
                    className="ml-1 hover:bg-purple-600 rounded-full p-0.5"
                  >
                    <HiX className="h-3 w-3" />
                  </button>
                </Badge>
              ) : null;
            })}
          </div>
        )}

        {/* Apply Filters */}
        {onApply && (
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onApply}
              disabled={loading}
              size="sm"
            >
              Terapkan Filter
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}
```

## Component-by-Component Refinement Guide

### Step-by-Step Refinement Process

**Phase 1: Analysis & Planning**

1. **Identify Core Functionality**
   - Review existing component props and state management
   - Document all user interactions and data flows
   - Note accessibility requirements and Indonesian language support
   - Identify performance bottlenecks and optimization opportunities

2. **Flowbite Pro Component Mapping**
   - Map custom UI components to Flowbite Pro equivalents
   - Identify missing components that need custom implementation
   - Plan responsive design adaptations for mobile/tablet/desktop
   - Consider dark mode support and theme consistency

3. **Data Structure Compatibility**
   - Ensure TypeScript interfaces align with Flowbite Pro expectations
   - Plan data transformation layers if needed
   - Verify WebSocket integration compatibility

**Phase 2: Implementation**

1. **Create Flowbite Pro Version**
   - Start with basic component structure using Flowbite Pro imports
   - Implement core functionality with Flowbite Pro components
   - Add Indonesian language support and accessibility features
   - Integrate real-time updates and WebSocket functionality

2. **Responsive Design Implementation**
   - Implement mobile-first responsive design
   - Test tablet and desktop layouts
   - Ensure touch interactions work properly on mobile devices
   - Optimize for different screen sizes and orientations

3. **Testing & Validation**
   - Test all user interactions and edge cases
   - Validate accessibility compliance
   - Performance test with large datasets
   - Cross-browser compatibility testing

### Specific Component Refinements

#### 1. AdminResponseForm.tsx → AdminResponseForm

**Current Issues:**
- Uses custom UI components (`@/components/ui/*`)
- Basic form validation without advanced features
- Limited file attachment handling
- No internal notes functionality

**Refinement Strategy:**
```typescript
// BEFORE: Custom UI components with basic validation
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

// AFTER: Flowbite Pro components with advanced features
import { Card, Button, Textarea, FileInput, Select, Badge, Alert } from "flowbite-react";
import { HiPaperClip, HiSend, HiEye, HiEyeOff, HiExclamationTriangle } from "react-icons/hi";
```

**Key Changes:**
- Replace custom components with Flowbite Pro equivalents
- Add tabbed interface for responses vs internal notes
- Implement comprehensive file upload with validation
- Add priority selection and notification controls
- Enhance error handling and user feedback

#### 2. TicketTable.tsx → AdminDataTable

**Current Issues:**
- Custom table implementation with limited features
- Basic sorting and pagination
- Manual bulk operations
- Limited responsive design

**Refinement Strategy:**
```typescript
// BEFORE: Custom table with basic features
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// AFTER: Flowbite Pro table with advanced features
import { Table, Button, Badge, Checkbox, Select, TextInput, Dropdown } from "flowbite-react";
import { HiChevronUp, HiChevronDown, HiEye, HiPencil, HiTrash } from "react-icons/hi";
```

**Key Changes:**
- Replace custom components with Flowbite Pro equivalents
- Add comprehensive sorting, filtering, and search
- Implement advanced bulk operations with confirmation
- Add customizable columns and actions
- Enhance responsive design and accessibility

#### 3. TicketFilters.tsx → AdminFilters

**Current Issues:**
- Basic filter implementation
- Limited filter types and combinations
- No advanced date range filtering
- Manual filter state management

**Refinement Strategy:**
```typescript
// BEFORE: Basic filter components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// AFTER: Advanced Flowbite Pro filters
import { Card, Button, Badge, Select, TextInput, Datepicker, Checkbox } from "flowbite-react";
import { HiFunnel, HiX, HiMagnifyingGlass, HiCalendar } from "react-icons/hi";
```

**Key Changes:**
- Replace custom components with Flowbite Pro equivalents
- Add comprehensive filter types (status, priority, category, assignee, date range)
- Implement filter combinations and active filter display
- Add compact mode for mobile devices
- Enhance filter persistence and reset functionality

#### 4. AdminLayout.tsx → AdminLayout

**Current Issues:**
- Basic layout structure
- Limited navigation features
- No responsive sidebar
- Manual breadcrumb implementation

**Refinement Strategy:**
```typescript
// BEFORE: Basic layout
<div className="flex h-screen">
  <Sidebar />
  <MainContent />
</div>

// AFTER: Advanced Flowbite Pro layout
import { Sidebar, Navbar, Breadcrumb, Footer } from "flowbite-react";
```

**Key Changes:**
- Implement responsive sidebar with collapsible functionality
- Add comprehensive navigation with user menu
- Include breadcrumb navigation
- Add notification center and quick actions
- Enhance mobile responsiveness

### Admin Layout Components

**Advanced Admin Layout**:
```typescript
import { useState } from 'react';
import { Sidebar, Navbar, Breadcrumb, Button, Badge, Dropdown, Avatar } from "flowbite-react";
import {
  HiMenu,
  HiBell,
  HiCog,
  HiUser,
  HiLogout,
  HiChartBar,
  HiTicket,
  HiUsers,
  HiDocument,
  HiHome
} from "react-icons/hi";

interface AdminLayoutProps {
  children: React.ReactNode;
  title: string;
  breadcrumb?: Array<{ label: string; href?: string }>;
  user?: {
    name: string;
    email: string;
    avatar?: string;
    role: string;
  };
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    timestamp: Date;
    read: boolean;
  }>;
  sidebarItems?: Array<{
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    children?: Array<{
      label: string;
      href: string;
    }>;
  }>;
}

export function AdminLayout({
  children,
  title,
  breadcrumb = [],
  user,
  notifications = [],
  sidebarItems = []
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const defaultSidebarItems = [
    { label: 'Dashboard', href: '/admin', icon: HiHome },
    { label: 'Tiket', href: '/admin/tickets', icon: HiTicket, badge: '12' },
    { label: 'Pengguna', href: '/admin/users', icon: HiUsers },
    { label: 'Laporan', href: '/admin/reports', icon: HiChartBar },
    { label: 'Dokumen', href: '/admin/documents', icon: HiDocument },
  ];

  const menuItems = sidebarItems.length > 0 ? sidebarItems : defaultSidebarItems;

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar
        aria-label="Admin sidebar"
        className={`fixed inset-y-0 left-0 z-50 w-64 transform ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex items-center justify-center h-16 px-4 border-b border-gray-200 dark:border-gray-700">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Admin Panel
            </h1>
          </div>

          {/* Navigation */}
          <Sidebar.Items>
            <Sidebar.ItemGroup>
              {menuItems.map((item, index) => (
                <Sidebar.Item
                  key={index}
                  href={item.href}
                  icon={item.icon}
                >
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <Badge size="xs" color="red">
                      {item.badge}
                    </Badge>
                  )}
                </Sidebar.Item>
              ))}
            </Sidebar.ItemGroup>
          </Sidebar.Items>

          {/* User info at bottom */}
          {user && (
            <div className="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3">
                <Avatar
                  img={user.avatar}
                  placeholderInitials={user.name.charAt(0).toUpperCase()}
                  size="sm"
                  rounded
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.role}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </Sidebar>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top navbar */}
        <Navbar fluid className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              <Button
                color="gray"
                size="sm"
                className="lg:hidden mr-2"
                onClick={() => setSidebarOpen(true)}
              >
                <HiMenu className="h-5 w-5" />
              </Button>

              <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <Dropdown
                arrowIcon={false}
                inline
                label={
                  <div className="relative">
                    <HiBell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
                    {unreadNotifications > 0 && (
                      <Badge
                        size="xs"
                        className="absolute -top-1 -right-1"
                        color="red"
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                  </div>
                }
              >
                <Dropdown.Header>
                  <span className="block text-sm font-medium">
                    Notifikasi
                  </span>
                </Dropdown.Header>
                {notifications.length === 0 ? (
                  <Dropdown.Item>
                    Tidak ada notifikasi baru
                  </Dropdown.Item>
                ) : (
                  notifications.slice(0, 5).map(notification => (
                    <Dropdown.Item key={notification.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{notification.title}</span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {notification.message}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">
                          {notification.timestamp.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </Dropdown.Item>
                  ))
                )}
              </Dropdown>

              {/* User menu */}
              {user && (
                <Dropdown
                  arrowIcon={false}
                  inline
                  label={
                    <Avatar
                      img={user.avatar}
                      placeholderInitials={user.name.charAt(0).toUpperCase()}
                      size="sm"
                      rounded
                    />
                  }
                >
                  <Dropdown.Header>
                    <span className="block text-sm font-medium">
                      {user.name}
                    </span>
                    <span className="block text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </span>
                  </Dropdown.Header>
                  <Dropdown.Item icon={HiUser}>
                    Profil
                  </Dropdown.Item>
                  <Dropdown.Item icon={HiCog}>
                    Pengaturan
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item icon={HiLogout}>
                    Keluar
                  </Dropdown.Item>
                </Dropdown>
              )}
            </div>
          </div>
        </Navbar>

        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <div className="px-6 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <Breadcrumb aria-label="Breadcrumb">
              <Breadcrumb.Item href="/admin">
                <HiHome className="h-4 w-4" />
              </Breadcrumb.Item>
              {breadcrumb.map((item, index) => (
                <Breadcrumb.Item
                  key={index}
                  href={item.href}
                  active={index === breadcrumb.length - 1}
                >
                  {item.label}
                </Breadcrumb.Item>
              ))}
            </Breadcrumb>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
```

## Testing Admin Panel Components

### Response Form Testing Checklist

**Form Validation Testing:**
- [ ] Response message validation works correctly
- [ ] File upload validation (size, type, count) functions
- [ ] Internal note validation and categorization
- [ ] Priority selection affects form behavior
- [ ] Form submission integrates with API correctly

**User Experience Testing:**
- [ ] Tab switching between response and internal notes works
- [ ] File attachment preview and removal functions
- [ ] Form maintains state during submission
- [ ] Clear visual feedback for all user actions
- [ ] Accessibility: Keyboard navigation and screen reader support

### Data Table Testing Checklist

**Data Display Testing:**
- [ ] Table renders data correctly with custom columns
- [ ] Sorting functionality works for all sortable columns
- [ ] Pagination displays correct page information
- [ ] Row selection and bulk operations function
- [ ] Empty state displays appropriate messages

**Functionality Testing:**
- [ ] Search functionality filters data in real-time
- [ ] Column filtering works with multiple criteria
- [ ] Bulk actions process selected items correctly
- [ ] Row actions (view, edit, delete) work properly
- [ ] Responsive design works on mobile devices

### Filter Component Testing Checklist

**Filter Functionality Testing:**
- [ ] Global search works across all relevant fields
- [ ] Status and priority filters combine correctly
- [ ] Date range filtering returns accurate results
- [ ] Category and assignee filters work properly
- [ ] Filter reset clears all active filters

**User Interface Testing:**
- [ ] Advanced filters toggle shows/hides correctly
- [ ] Active filter badges display and remove properly
- [ ] Filter counts update dynamically
- [ ] Compact mode works on mobile devices
- [ ] Filter persistence across page reloads

### Layout Component Testing Checklist

**Navigation Testing:**
- [ ] Sidebar collapses/expands on mobile devices
- [ ] Navigation links work correctly
- [ ] User menu displays proper information
- [ ] Breadcrumb navigation shows correct path
- [ ] Notification dropdown functions properly

**Responsive Design Testing:**
- [ ] Layout adapts correctly to different screen sizes
- [ ] Mobile overlay prevents interaction with main content
- [ ] Sidebar state persists across navigation
- [ ] Touch interactions work on mobile devices
- [ ] Content reflows properly when sidebar toggles

### Bulk Operations Testing Checklist

**Selection Testing:**
- [ ] Individual row selection works correctly
- [ ] Select all/deselect all functions properly
- [ ] Selection state persists during pagination
- [ ] Selection count displays accurately
- [ ] Selection clears on filter/search changes

**Bulk Actions Testing:**
- [ ] Bulk action toolbar appears when items selected
- [ ] Confirmation dialogs prevent accidental actions
- [ ] Bulk operations process multiple items efficiently
- [ ] Progress indicators show operation status
- [ ] Error handling for failed bulk operations

## Performance Considerations

### Admin Panel Performance Optimizations

**Component-Level Optimizations:**
- Use React.memo for expensive table re-renders
- Implement virtual scrolling for large datasets
- Lazy load filter components and modals
- Use React Query for intelligent data caching
- Debounce search inputs to prevent excessive API calls

**Data Management:**
- Implement cursor-based pagination for large tables
- Cache filter results to improve performance
- Use optimistic updates for bulk operations
- Compress data payloads for better network performance
- Implement proper loading states to prevent layout shifts

**Real-Time Updates:**
- Use WebSocket for live data updates in admin panels
- Implement message batching to reduce update frequency
- Cache admin data with appropriate TTL
- Handle connection drops gracefully
- Limit concurrent API calls during bulk operations

### Memory Management

**Component Cleanup:**
- Properly dispose of table instances on unmount
- Clear filter state when navigating away
- Cancel pending API requests on component unmount
- Clean up WebSocket subscriptions
- Implement proper error boundaries

**Data Handling:**
- Limit table data to reasonable page sizes
- Clear cached data when filters change significantly
- Use pagination to prevent loading all data at once
- Implement data virtualization for very large tables
- Monitor memory usage with performance tools

## Implementation Steps

### Phase 1: Core Admin Components (Week 1-2)

1. **Refine AdminResponseForm**
   - Replace custom components with Flowbite Pro equivalents
   - Implement tabbed interface for responses and internal notes
   - Add comprehensive file upload and validation
   - Test form submission and error handling

2. **Create AdminDataTable Component**
   - Build advanced table with sorting, filtering, and pagination
   - Implement bulk operations with confirmation dialogs
   - Add customizable columns and row actions
   - Test with large datasets and edge cases

3. **Enhance AdminFilters**
   - Replace basic filters with comprehensive filter system
   - Add date range, category, and assignee filtering
   - Implement active filter display and management
   - Test filter combinations and persistence

### Phase 2: Advanced Features (Week 3-4)

1. **Implement AdminLayout**
   - Create responsive sidebar with navigation
   - Add user menu and notification system
   - Implement breadcrumb navigation
   - Test mobile responsiveness and accessibility

2. **Add Bulk Operations**
   - Implement bulk action toolbar and confirmation
   - Add progress indicators for long operations
   - Create undo functionality for accidental actions
   - Test with large selections and error scenarios

3. **Dashboard Integration**
   - Connect admin components to dashboard data
   - Implement real-time updates via WebSocket
   - Add export functionality for reports
   - Test end-to-end admin workflows

### Phase 3: Polish and Optimization (Week 5-6)

1. **Performance Optimization**
   - Implement virtual scrolling and lazy loading
   - Optimize table rendering and data fetching
   - Add comprehensive error boundaries
   - Implement proper loading states and skeletons

2. **Accessibility and Internationalization**
   - Ensure WCAG 2.1 AA compliance for all admin components
   - Add proper ARIA labels and keyboard navigation
   - Implement Indonesian language support throughout
   - Test with screen readers and assistive technologies

3. **Testing and Documentation**
   - Write comprehensive unit and integration tests
   - Create user documentation and admin guides
   - Perform cross-browser compatibility testing
   - Conduct user acceptance testing

### Phase 4: Deployment and Monitoring (Week 7-8)

1. **Production Deployment**
   - Set up CI/CD pipelines for automated testing
   - Implement feature flags for gradual rollouts
   - Create rollback strategies and monitoring
   - Set up performance monitoring and alerting

2. **User Training and Support**
   - Create training materials for admin users
   - Implement in-app guidance and tooltips
   - Set up user feedback collection
   - Create support documentation and FAQs

## Migration Strategy

### Gradual Component Replacement

**Week 1: Foundation**
- Install and configure Flowbite Pro admin components
- Create shared admin component library
- Set up TypeScript interfaces for admin data
- Implement basic responsive admin layout

**Week 2: Core Components**
- Replace AdminResponseForm with Flowbite Pro version
- Update TicketTable with AdminDataTable
- Implement AdminFilters with advanced features
- Test basic admin functionality and user flows

**Week 3: Advanced Components**
- Build AdminLayout with responsive sidebar
- Add bulk operations and confirmation dialogs
- Implement real-time updates and notifications
- Test admin workflows and edge cases

**Week 4: Integration and Testing**
- Integrate all admin components into existing admin pages
- Test end-to-end admin user workflows
- Performance optimization and bug fixes
- Accessibility compliance verification

**Week 5: Production Deployment**
- Gradual rollout with feature flags
- User acceptance testing and feedback
- Performance monitoring and optimization
- Documentation and training completion

### Risk Mitigation

**Technical Risks:**
- Complex table interactions with Flowbite Pro
- Bulk operation performance with large datasets
- WebSocket integration complexity in admin panels
- Mobile responsiveness challenges for complex layouts

**Business Risks:**
- Admin user resistance to interface changes
- Training requirements for administrative staff
- Potential data loss during bulk operations
- Compliance and security requirements

**Mitigation Strategies:**
- Comprehensive testing before deployment
- Feature flags for gradual rollout
- User feedback collection and iteration
- Fallback mechanisms for critical admin functions
- Extensive documentation and training materials

## Success Metrics

### Technical Metrics
- **Performance**: Admin pages load within 3 seconds
- **Reliability**: 99.9% uptime for admin services
- **Bulk Operations**: Process 1000+ items within 30 seconds
- **Mobile**: 95%+ functionality on mobile devices

### User Experience Metrics
- **Efficiency**: 50% reduction in admin task completion time
- **Accuracy**: 99%+ accuracy in bulk operations
- **Satisfaction**: Admin user satisfaction scores above 4.5/5
- **Accessibility**: Full support for users with disabilities

### Business Metrics
- **Adoption**: 100% admin user adoption within 30 days
- **Productivity**: 40% improvement in administrative productivity
- **Quality**: 60% reduction in administrative errors
- **Compliance**: 100% compliance with government regulations

## References

- [SILPANA Admin Integration](../../docs/SILPANA-ARCHITECTURE-ANALYSIS.md)
- [WebSocket Integration Guide](../02-NAVIGATION-COMPONENTS.md#websocket-integration)
- [Flowbite Pro Admin Components](https://flowbite.com/docs/components/admin/)
- [React Table Documentation](https://react-table.tanstack.com/)
- [React Performance Best Practices](https://react.dev/learn/render-and-commit)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

---

**Last Updated**: 2025-10-15
**Document Version**: 1.0
**Status**: ✅ Complete
**Next Review**: 2025-11-15
