/**
 * SILPANA Progress Tracking Types
 * 
 * Type definitions for ticket progress tracking system
 * Matches backend Go types from backend/internal/services/silpana/progress_types.go
 */

/**
 * Document requirement for a step
 */
export interface DocumentRequirement {
  name: string;
  required: boolean;
}

/**
 * Step configuration for a specific category
 */
export interface StepConfiguration {
  id: string;
  category: string;
  step_order: number;
  step_name: string;
  step_code: string;
  step_title: string;
  step_description: string;
  estimated_duration_hours: number;
  icon_name?: string;
  color_scheme?: string;
  required_documents: DocumentRequirement[];
  requires_staff_action: boolean;
  requires_user_action: boolean;
  user_action_description?: string;
  applicable_statuses: string[];
  is_active: boolean;
  display_order?: number;
}

/**
 * Status history entry for audit trail
 */
export interface StatusHistoryEntry {
  id: string;
  ticket_id: string;
  old_status?: string;
  new_status: string;
  old_priority?: string;
  new_priority?: string;
  step_name: string;
  step_order: number;
  step_description?: string;
  changed_by?: string;
  changed_by_name?: string;
  change_reason?: string;
  guest_visible_message: string;
  occurred_at: string; // ISO 8601 date string
  duration_in_previous_status?: string;
  metadata?: string;
}

/**
 * Complete ticket progress response
 */
export interface TicketProgressResponse {
  ticket_id: string;
  ticket_code: string;
  category: string;
  current_step: string;
  step_order: number;
  total_steps: number;
  completion_percentage: number;
  estimated_completion_date?: string; // ISO 8601 date string
  estimated_hours_remaining?: number;
  assigned_to?: string;
  assigned_to_name?: string;
  assigned_at?: string; // ISO 8601 date string
  status_description: string;
  guest_visible_notes: string;
  required_documents: DocumentRequirement[];
  uploaded_documents: string[];
  verified_documents: string[];
  steps: StepConfiguration[];
  history: StatusHistoryEntry[];
  created_at: string; // ISO 8601 date string
  updated_at: string; // ISO 8601 date string
}

/**
 * API response wrapper
 */
export interface ProgressApiResponse {
  success: boolean;
  data?: TicketProgressResponse;
  error?: string;
}

/**
 * Progress display state
 */
export interface ProgressDisplayState {
  loading: boolean;
  error: string | null;
  progress: TicketProgressResponse | null;
}

/**
 * Step status for UI rendering
 */
export type StepStatus = 'completed' | 'current' | 'pending' | 'waiting-user';

/**
 * Step display props
 */
export interface StepDisplayProps {
  step: StepConfiguration;
  status: StepStatus;
  isCurrentStep: boolean;
  completionPercentage?: number;
}

/**
 * Timeline entry for history display
 */
export interface TimelineEntry {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  type: 'status_change' | 'step_complete' | 'user_action' | 'staff_action';
  icon?: string;
  color?: string;
}

/**
 * Progress statistics
 */
export interface ProgressStats {
  completedSteps: number;
  totalSteps: number;
  completionPercentage: number;
  estimatedHoursRemaining?: number;
  timeInCurrentStep?: string;
}

/**
 * Document status for tracking
 */
export interface DocumentStatus {
  name: string;
  required: boolean;
  uploaded: boolean;
  verified: boolean;
}
