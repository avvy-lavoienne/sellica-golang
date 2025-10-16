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

// Enhanced Navigation Mode Enum for better tab management
export enum SilpanaMode {
  FORM = 'form',
  LOOKUP = 'lookup',
  REKAP = 'rekap',
  ADMIN = 'admin'
}

// Navigation Tab Configuration Interface
export interface SilpanaTab {
  id: SilpanaMode
  label: string
  icon: string
  description: string
  disabled?: boolean
  keyboardShortcut?: string
  requiresAuth?: boolean
}

// Navigation State Interface
export interface NavigationState {
  activeMode: SilpanaMode
  previousMode: SilpanaMode | null
  transitionDirection: 'forward' | 'backward' | 'none'
  isLoading: boolean
}

// Enhanced SilpanaData interface with ticketing system
// Aligned with database schema: silpana table (all columns)
export interface SilpanaData {
  // Core identity fields
  id?: string
  created_at?: string
  updated_at?: string
  last_updated?: string
  user_id?: string
  
  // Personal information fields (REQUIRED)
  nik_pengaduan: string                    // National ID (16 digits)
  nama_pengaduan: string                   // Reporter name
  nama_pelapor?: string                    // Legacy: Old reporter name field (for backward compatibility)
  nomor_telepon: string                    // Phone number (08xxx or +628xxx)
  email?: string                           // Email address (OPTIONAL)
  alamat?: string                          // Address (OPTIONAL)
  
  // Complaint classification (REQUIRED)
  kategori_pengaduan: string               // Main category
  sub_kategori_pengaduan: string           // Sub-category
  
  // Complaint details (REQUIRED)
  alasan_pengaduan: string                 // Reason for complaint
  deskripsi_pengaduan: string              // Detailed description
  tindak_lanjut_pengaduan: string          // Follow-up action
  tanggal_pengaduan: string                // Complaint date
  
  // Anonymous submission support
  is_anonymous?: boolean                   // Flag for anonymous submission
  creator_name?: string                    // Creator name if different from nama_pengaduan
  
  // Ticketing system fields (OPTIONAL - auto-generated)
  ticket_code?: string                     // Auto-generated: SPL251006XXXXXXXX
  ticket_status?: TicketStatus             // Status: submitted, under_review, etc.
  priority_level?: PriorityLevel           // Priority: low, medium, high, critical
  assigned_to?: string                     // Assigned admin/officer
  estimated_resolution?: string            // Estimated completion date
  actual_resolution?: string               // Actual completion date
  resolution_notes?: string                // Resolution details
  created_by_ip?: string                   // IP address for security tracking
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

// Form data interface - includes ALL user-editable fields from database
export interface SilpanaFormData {
  id?: string
  
  // Personal information (REQUIRED for non-anonymous)
  nik_pengaduan: string                    // National ID (16 digits)
  nama_pengaduan: string                   // Reporter name
  nomor_telepon: string                    // Phone number
  email?: string                           // Email address (OPTIONAL)
  alamat?: string                          // Full address (OPTIONAL)
  
  // Complaint classification (REQUIRED)
  kategori_pengaduan: string               // Main category
  sub_kategori_pengaduan: string           // Sub-category
  
  // Complaint details (REQUIRED)
  alasan_pengaduan: string                 // Reason for complaint
  deskripsi_pengaduan: string              // Detailed description
  tindak_lanjut_pengaduan: string          // Follow-up action requested
  tanggal_pengaduan: string                // Date of complaint/incident
  
  // Anonymous submission support
  is_anonymous?: boolean                   // Submit anonymously (hides personal info)
  
  // Optional fields
  priority_level?: PriorityLevel           // User-suggested priority
  creator_name?: string                    // Alternative creator name
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