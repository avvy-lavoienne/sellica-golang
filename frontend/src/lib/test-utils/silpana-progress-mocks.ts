/**
 * Test Utilities for SILPANA Progress Tracking
 * 
 * Mock data and helper functions for testing
 */

import type {
  TicketProgressResponse,
  StepConfiguration,
  StatusHistoryEntry,
  DocumentRequirement,
} from '@/types/silpana/progress';

/**
 * Generate mock ticket progress data
 */
export function generateMockProgress(
  overrides?: Partial<TicketProgressResponse>
): TicketProgressResponse {
  const defaultData: TicketProgressResponse = {
    ticket_id: 'ticket-123',
    ticket_code: 'SILPANA-2025-0001',
    category: 'Akta Kelahiran',
    current_step: 'data_entry',
    step_order: 3,
    total_steps: 5,
    completion_percentage: 60,
    estimated_completion_date: '2025-10-15T10:00:00Z',
    estimated_hours_remaining: 48,
    assigned_to: 'user-123',
    assigned_to_name: 'Budi Santoso',
    assigned_at: '2025-10-06T08:00:00Z',
    status_description: 'Sedang diproses oleh petugas',
    guest_visible_notes: 'Dokumen Anda sedang dalam proses verifikasi',
    required_documents: [
      { name: 'Surat Keterangan Lahir dari Rumah Sakit', required: true },
      { name: 'KTP Orang Tua', required: true },
      { name: 'Kartu Keluarga', required: true },
    ],
    uploaded_documents: [
      'Surat Keterangan Lahir dari Rumah Sakit',
      'KTP Orang Tua',
    ],
    verified_documents: ['Surat Keterangan Lahir dari Rumah Sakit'],
    created_at: '2025-10-05T10:00:00Z',
    updated_at: '2025-10-06T09:30:00Z',
    steps: generateMockSteps(),
    history: generateMockHistory(),
  };

  return { ...defaultData, ...overrides };
}

/**
 * Generate mock step configurations
 */
export function generateMockSteps(): StepConfiguration[] {
  return [
    {
      id: 'step-1',
      category: 'Akta Kelahiran',
      step_order: 1,
      step_name: 'submission',
      step_code: 'SUBMIT',
      step_title: 'Pengajuan Diterima',
      step_description: 'Pengajuan Anda telah diterima sistem',
      estimated_duration_hours: 1,
      icon_name: 'check-circle',
      color_scheme: 'green',
      required_documents: [
        {
          name: 'Surat Keterangan Lahir dari Rumah Sakit',
          required: true,
        },
      ],
      requires_staff_action: false,
      requires_user_action: true,
      user_action_description: 'Upload dokumen yang diperlukan',
      applicable_statuses: ['pending', 'in_progress'],
      is_active: true,
    },
    {
      id: 'step-2',
      category: 'Akta Kelahiran',
      step_order: 2,
      step_name: 'document_verification',
      step_code: 'DOC_VERIFY',
      step_title: 'Verifikasi Dokumen',
      step_description: 'Dokumen sedang diverifikasi oleh petugas',
      estimated_duration_hours: 24,
      icon_name: 'file-check',
      color_scheme: 'blue',
      required_documents: [
        {
          name: 'KTP Orang Tua',
          required: true,
        },
      ],
      requires_staff_action: true,
      requires_user_action: false,
      applicable_statuses: ['in_progress'],
      is_active: true,
    },
    {
      id: 'step-3',
      category: 'Akta Kelahiran',
      step_order: 3,
      step_name: 'data_entry',
      step_code: 'DATA_ENTRY',
      step_title: 'Input Data',
      step_description: 'Data Anda sedang diinput ke sistem',
      estimated_duration_hours: 12,
      icon_name: 'edit',
      color_scheme: 'yellow',
      required_documents: [],
      requires_staff_action: true,
      requires_user_action: false,
      applicable_statuses: ['in_progress'],
      is_active: true,
    },
    {
      id: 'step-4',
      category: 'Akta Kelahiran',
      step_order: 4,
      step_name: 'approval',
      step_code: 'APPROVAL',
      step_title: 'Persetujuan',
      step_description: 'Menunggu persetujuan dari pejabat berwenang',
      estimated_duration_hours: 24,
      icon_name: 'user-check',
      color_scheme: 'purple',
      required_documents: [],
      requires_staff_action: true,
      requires_user_action: false,
      applicable_statuses: ['in_progress'],
      is_active: true,
    },
    {
      id: 'step-5',
      category: 'Akta Kelahiran',
      step_order: 5,
      step_name: 'completed',
      step_code: 'COMPLETE',
      step_title: 'Selesai',
      step_description: 'Dokumen Anda siap diambil',
      estimated_duration_hours: 1,
      icon_name: 'check-circle',
      color_scheme: 'green',
      required_documents: [],
      requires_staff_action: false,
      requires_user_action: true,
      user_action_description: 'Ambil dokumen di kantor Dinas Kependudukan',
      applicable_statuses: ['completed'],
      is_active: true,
    },
  ];
}

/**
 * Generate mock status history
 */
export function generateMockHistory(): StatusHistoryEntry[] {
  return [
    {
      id: 'history-1',
      ticket_id: 'ticket-123',
      new_status: 'pending',
      new_priority: 'normal',
      step_name: 'submission',
      step_order: 1,
      changed_by: 'system',
      changed_by_name: 'Sistem',
      guest_visible_message: 'Pengajuan Anda telah diterima',
      occurred_at: '2025-10-05T10:00:00Z',
    },
    {
      id: 'history-2',
      ticket_id: 'ticket-123',
      old_status: 'pending',
      new_status: 'in_progress',
      old_priority: 'normal',
      new_priority: 'normal',
      step_name: 'document_verification',
      step_order: 2,
      changed_by: 'staff-456',
      changed_by_name: 'Ani Wijaya',
      guest_visible_message: 'Dokumen Anda sedang diverifikasi',
      occurred_at: '2025-10-05T10:30:00Z',
      duration_in_previous_status: '00:30:00',
    },
    {
      id: 'history-3',
      ticket_id: 'ticket-123',
      old_status: 'in_progress',
      new_status: 'in_progress',
      old_priority: 'normal',
      new_priority: 'normal',
      step_name: 'data_entry',
      step_order: 3,
      changed_by: 'staff-456',
      changed_by_name: 'Ani Wijaya',
      guest_visible_message: 'Verifikasi dokumen selesai, data sedang diinput',
      occurred_at: '2025-10-06T08:00:00Z',
      duration_in_previous_status: '21:30:00',
    },
  ];
}

/**
 * Mock API response wrapper
 */
export function mockApiSuccess<T>(data: T, delay = 100): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
}

/**
 * Mock API error wrapper
 */
export function mockApiError(message: string, delay = 100): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
}

/**
 * Mock fetch for API testing
 */
export function createMockFetch(response: any, status = 200) {
  return jest.fn(() =>
    Promise.resolve({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(response),
    } as Response)
  );
}

/**
 * Test ticket codes for different scenarios
 */
export const TEST_TICKET_CODES = {
  VALID: 'SILPANA-2025-0001',
  NOT_FOUND: 'SILPANA-2025-9999',
  COMPLETED: 'SILPANA-2025-0002',
  JUST_CREATED: 'SILPANA-2025-0003',
  PENDING_USER_ACTION: 'SILPANA-2025-0004',
};

/**
 * Mock progress data for different scenarios
 */
export const MOCK_PROGRESS_SCENARIOS = {
  just_created: generateMockProgress({
    current_step: 'submission',
    step_order: 1,
    completion_percentage: 20,
    status_description: 'Pengajuan baru diterima',
    uploaded_documents: [],
    verified_documents: [],
  }),
  
  in_progress: generateMockProgress({
    current_step: 'data_entry',
    step_order: 3,
    completion_percentage: 60,
    status_description: 'Sedang diproses',
  }),
  
  completed: generateMockProgress({
    current_step: 'completed',
    step_order: 5,
    completion_percentage: 100,
    status_description: 'Proses selesai',
    estimated_hours_remaining: 0,
    verified_documents: [
      'Surat Keterangan Lahir dari Rumah Sakit',
      'KTP Orang Tua',
      'Kartu Keluarga',
    ],
  }),
  
  waiting_user_action: generateMockProgress({
    current_step: 'submission',
    step_order: 1,
    completion_percentage: 20,
    status_description: 'Menunggu upload dokumen',
    uploaded_documents: [],
    verified_documents: [],
  }),
};
