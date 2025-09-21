// Ticket Status Enum
export enum TicketStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  IN_PROGRESS = 'in_progress',
  PENDING_INFO = 'pending_info',
  ESCALATED = 'escalated',
  RESOLVED = 'resolved',
  CLOSED = 'closed',
  REJECTED = 'rejected'
}

// Priority Level Enum
export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Enhanced SilpanaData interface with ticketing system
export interface SilpanaData {
  id?: string
  created_at?: string
  user_id?: string
  nik_pengaduan: string
  nama_pengaduan: string
  kategori_pengaduan: string
  sub_kategori_pengaduan: string
  alasan_pengaduan: string
  deskripsi_pengaduan: string
  nomor_telepon: string
  tindak_lanjut_pengaduan: string
  tanggal_pengaduan: string
  is_anonymous?: boolean
  creator_name?: string
  // New ticket system fields
  ticket_code?: string
  ticket_status?: TicketStatus
  priority_level?: PriorityLevel
  assigned_to?: string
  estimated_resolution?: string
  actual_resolution?: string
  resolution_notes?: string
  created_by_ip?: string
  last_updated?: string
}

// Ticket History interface
export interface TicketHistory {
  id: string
  ticket_id: string
  status_from?: TicketStatus
  status_to: TicketStatus
  changed_by: string
  changed_at: string
  notes?: string
  attachments?: string[]
  is_public: boolean
  created_at: string
}

// Ticket Communication interface
export interface TicketCommunication {
  id: string
  ticket_id: string
  message: string
  sender_type: 'admin' | 'submitter'
  sender_name: string
  attachments?: string[]
  is_internal: boolean
  created_at: string
  updated_at: string
}

// Enhanced ticket data with history and communications
export interface EnhancedSilpanaData extends SilpanaData {
  ticket_code: string
  ticket_status: TicketStatus
  priority_level: PriorityLevel
  last_updated: string
  ticket_history?: TicketHistory[]
  ticket_communications?: TicketCommunication[]
}

export interface SilpanaFormData {
  id?: string
  nik_pengaduan: string
  nama_pengaduan: string
  kategori_pengaduan: string
  sub_kategori_pengaduan: string
  alasan_pengaduan: string
  deskripsi_pengaduan: string
  nomor_telepon: string
  tindak_lanjut_pengaduan: string
  tanggal_pengaduan: string
  is_anonymous?: boolean
  // Optional priority level for form submission
  priority_level?: PriorityLevel
}

// Ticket lookup request interface
export interface TicketLookupRequest {
  ticket_code: string
  phone_number?: string  // For verification
  nik?: string          // Alternative verification
}

// Ticket status update interface
export interface TicketStatusUpdate {
  ticket_id: string
  new_status: TicketStatus
  notes?: string
  estimated_resolution?: Date
  assigned_to?: string
}

// Ticket lookup response interface
export interface TicketLookupResponse {
  ticket: EnhancedSilpanaData | null
  error?: string
  verified: boolean
}

// Communication message interface
export interface CommunicationMessage {
  ticket_id: string
  message: string
  sender_type: 'admin' | 'submitter'
  sender_name: string
  attachments?: File[]
  is_internal?: boolean
}