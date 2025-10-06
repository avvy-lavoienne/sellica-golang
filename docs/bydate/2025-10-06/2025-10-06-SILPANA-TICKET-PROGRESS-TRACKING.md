# SILPANA Ticket Progress Tracking System

**Document**: SILPANA Ticket Progress Tracking & Status Updates (Guest Mode Focus)
**Project Date**: 2025-10-06
**Created**: 2025-10-06
**Version**: 1.0
**Status**: 🚧 Planning
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Feature Specification

## Executive Summary

Comprehensive specification for implementing a ticket progress tracking system in SILPANA, allowing users (guest mode) to view detailed status updates, progress timeline, and receive real-time notifications about their complaint tickets. This feature will be integrated with the admin panel in future phases, but initial implementation focuses on guest-facing functionality.

## Problem Statement

### Current State

**What We Have**:
- ✅ Ticket creation via form
- ✅ Ticket lookup with verification
- ✅ Basic ticket information display (status, priority, details)
- ✅ Email and address fields captured

**What's Missing**:
- ❌ Detailed progress tracking (step-by-step updates)
- ❌ Timeline visualization of ticket lifecycle
- ❌ Status change history
- ❌ Estimated completion time
- ❌ Actionable steps for users
- ❌ Document upload tracking (if documents submitted)
- ❌ Staff assignment visibility
- ❌ Resolution details

### User Scenarios

**Scenario 1: First-Time User**

```text
User: "Saya sudah submit tiket kemarin, tapi tidak tahu progressnya."
(I submitted a ticket yesterday but don't know the progress.)

Current Experience:
- Lookup shows basic status: "pending"
- No visibility into what's happening
- No idea when ticket will be processed

Desired Experience:
- Timeline shows: "Tiket diterima → Menunggu verifikasi → [Current]"
- Estimated completion: "2-3 hari kerja"
- Next step: "Dokumen Anda sedang diverifikasi oleh petugas"
```

**Scenario 2: Anxious User**

```text
User: "Tiket saya sudah 'in_progress' 3 hari. Kapan selesai?"
(My ticket has been 'in_progress' for 3 days. When will it be done?)

Current Experience:
- Only sees "in_progress" status
- No transparency about what's being done
- No way to know if there's a problem

Desired Experience:
- Progress bar: 60% complete
- Current step: "Proses cetak dokumen"
- Previous steps completed with timestamps
- Estimated completion: "1 hari lagi"
```

**Scenario 3: Document Submission**

```text
User: "Saya sudah upload KTP. Apa sudah diterima?"
(I uploaded my ID card. Has it been received?)

Current Experience:
- No document tracking
- No confirmation of receipt

Desired Experience:
- Document checklist with status:
  ✅ KTP (uploaded 2 jam lalu, verified)
  ⏳ Kartu Keluarga (menunggu upload)
- Notification when documents are verified
```

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    SILPANA Guest Mode                       │
│                 (Ticket Progress Tracking)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┴───────────────┐
              │                               │
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │   Progress         │         │   Timeline        │
    │   Visualization    │         │   View            │
    │                    │         │                   │
    │ - Progress bar     │         │ - Step-by-step    │
    │ - Current step     │         │ - Timestamps      │
    │ - Percentage       │         │ - Status changes  │
    └────────────────────┘         └───────────────────┘
              │                               │
              │                               │
              └───────────────┬───────────────┘
                              │
                    ┌─────────▼─────────┐
                    │   Backend API     │
                    │                   │
                    │ GET /api/v1/      │
                    │ silpana/tickets/  │
                    │ {code}/progress   │
                    └─────────┬─────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
    ┌─────────▼─────────┐         ┌─────────▼─────────┐
    │   Database        │         │   Cache           │
    │   (Supabase)      │         │   (Redis)         │
    │                   │         │                   │
    │ - ticket_progress │         │ - Progress data   │
    │ - status_history  │         │ - Cache 5min TTL  │
    └───────────────────┘         └───────────────────┘
```

### Database Schema Design

#### 1. ticket_progress Table (New)

```sql
CREATE TABLE ticket_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES silpana(id) ON DELETE CASCADE,
  
  -- Progress tracking
  current_step VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  total_steps INTEGER NOT NULL DEFAULT 5,
  completion_percentage INTEGER NOT NULL DEFAULT 0 CHECK (completion_percentage BETWEEN 0 AND 100),
  
  -- Estimated completion
  estimated_completion_date TIMESTAMPTZ,
  estimated_hours_remaining INTEGER,
  
  -- Staff assignment
  assigned_to UUID REFERENCES auth.users(id),
  assigned_to_name VARCHAR(200),
  assigned_at TIMESTAMPTZ,
  
  -- Status details
  status_description TEXT,
  internal_notes TEXT, -- Admin only, not visible to guest
  guest_visible_notes TEXT, -- Visible to guest
  
  -- Document tracking
  required_documents JSONB DEFAULT '[]'::jsonb,
  uploaded_documents JSONB DEFAULT '[]'::jsonb,
  verified_documents JSONB DEFAULT '[]'::jsonb,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  
  -- Constraints
  CONSTRAINT unique_ticket_progress UNIQUE (ticket_id)
);

-- Indexes
CREATE INDEX idx_ticket_progress_ticket_id ON ticket_progress(ticket_id);
CREATE INDEX idx_ticket_progress_assigned_to ON ticket_progress(assigned_to);
CREATE INDEX idx_ticket_progress_step_order ON ticket_progress(step_order);

-- RLS Policies
ALTER TABLE ticket_progress ENABLE ROW LEVEL SECURITY;

-- Anonymous users can SELECT progress for tickets they can access
CREATE POLICY "ticket_progress_guest_select" ON ticket_progress
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM silpana
    WHERE silpana.id = ticket_progress.ticket_id
    -- Guest can access if they know ticket_code
    -- (Verification happens at API level)
  )
);

-- Authenticated users (staff) can INSERT/UPDATE
CREATE POLICY "ticket_progress_staff_all" ON ticket_progress
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);
```

#### 2. status_history Table (New)

```sql
CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID NOT NULL REFERENCES silpana(id) ON DELETE CASCADE,
  
  -- Status change details
  old_status VARCHAR(50),
  new_status VARCHAR(50) NOT NULL,
  old_priority VARCHAR(20),
  new_priority VARCHAR(20),
  
  -- Step tracking
  step_name VARCHAR(100) NOT NULL,
  step_order INTEGER NOT NULL,
  step_description TEXT,
  
  -- Who made the change
  changed_by UUID REFERENCES auth.users(id),
  changed_by_name VARCHAR(200),
  
  -- Notes and reason
  change_reason TEXT,
  guest_visible_message TEXT, -- User-friendly message
  
  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_in_previous_status INTERVAL, -- How long was ticket in previous status
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes
CREATE INDEX idx_status_history_ticket_id ON status_history(ticket_id);
CREATE INDEX idx_status_history_occurred_at ON status_history(occurred_at DESC);
CREATE INDEX idx_status_history_new_status ON status_history(new_status);

-- RLS Policies
ALTER TABLE status_history ENABLE ROW LEVEL SECURITY;

-- Anonymous users can SELECT history for tickets they can access
CREATE POLICY "status_history_guest_select" ON status_history
FOR SELECT TO anon
USING (
  EXISTS (
    SELECT 1 FROM silpana
    WHERE silpana.id = status_history.ticket_id
  )
);

-- Authenticated users can INSERT
CREATE POLICY "status_history_staff_insert" ON status_history
FOR INSERT TO authenticated
WITH CHECK (true);
```

#### 3. ticket_steps Configuration (New)

```sql
CREATE TABLE ticket_steps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Step definition
  category VARCHAR(100) NOT NULL, -- e.g., 'akta_kelahiran', 'ktp', etc.
  step_order INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  step_description TEXT NOT NULL,
  
  -- Display information
  step_title_indonesian VARCHAR(200) NOT NULL,
  step_description_indonesian TEXT NOT NULL,
  estimated_duration_hours INTEGER, -- How long this step typically takes
  
  -- Requirements
  required_documents JSONB DEFAULT '[]'::jsonb,
  requires_staff_action BOOLEAN DEFAULT true,
  requires_user_action BOOLEAN DEFAULT false,
  
  -- Status mapping
  applicable_statuses VARCHAR(50)[] DEFAULT ARRAY['pending', 'in_progress'],
  
  -- Metadata
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_ticket_steps_category ON ticket_steps(category);
CREATE INDEX idx_ticket_steps_order ON ticket_steps(category, step_order);

-- Sample data for Akta Kelahiran
INSERT INTO ticket_steps (category, step_order, step_name, step_title_indonesian, step_description_indonesian, estimated_duration_hours, required_documents)
VALUES 
  ('akta_kelahiran', 1, 'submission_received', 'Pengajuan Diterima', 'Tiket pengajuan Anda telah diterima oleh sistem dan menunggu verifikasi awal oleh petugas', 2, '[]'::jsonb),
  ('akta_kelahiran', 2, 'document_verification', 'Verifikasi Dokumen', 'Petugas sedang memverifikasi kelengkapan dan keabsahan dokumen yang Anda upload', 24, '["Surat Keterangan Lahir dari RS/Bidan", "KTP Orang Tua", "Kartu Keluarga"]'::jsonb),
  ('akta_kelahiran', 3, 'data_processing', 'Pemrosesan Data', 'Data Anda sedang diproses dan diinput ke dalam sistem kependudukan', 48, '[]'::jsonb),
  ('akta_kelahiran', 4, 'document_printing', 'Pencetakan Akta', 'Akta Kelahiran Anda sedang dicetak dan ditandatangani oleh pejabat berwenang', 12, '[]'::jsonb),
  ('akta_kelahiran', 5, 'ready_for_pickup', 'Siap Diambil', 'Akta Kelahiran Anda sudah selesai dan siap untuk diambil', 0, '[]'::jsonb);

-- Similar for other categories: ktp, kk, akta_kematian, etc.
```

### Backend Implementation

#### 1. Progress Service

```go
// File: backend/internal/services/silpana/progress_service.go

package silpana

import (
    "context"
    "fmt"
    "time"
)

// ProgressService handles ticket progress tracking
type ProgressService struct {
    db    DatabaseService
    cache CacheService
    monitoring MonitoringService
}

// TicketProgress represents complete progress information
type TicketProgress struct {
    // Basic info
    TicketID string `json:"ticket_id"`
    TicketCode string `json:"ticket_code"`
    
    // Progress tracking
    CurrentStep string `json:"current_step"`
    StepOrder int `json:"step_order"`
    TotalSteps int `json:"total_steps"`
    CompletionPercentage int `json:"completion_percentage"`
    
    // Timeline
    Steps []ProgressStep `json:"steps"`
    History []StatusChange `json:"history"`
    
    // Estimated completion
    EstimatedCompletionDate *time.Time `json:"estimated_completion_date,omitempty"`
    EstimatedHoursRemaining *int `json:"estimated_hours_remaining,omitempty"`
    
    // Staff info (limited in guest mode)
    AssignedToName string `json:"assigned_to_name,omitempty"`
    AssignedAt *time.Time `json:"assigned_at,omitempty"`
    
    // Notes
    StatusDescription string `json:"status_description"`
    GuestVisibleNotes string `json:"guest_visible_notes"`
    
    // Document tracking
    RequiredDocuments []DocumentRequirement `json:"required_documents"`
    UploadedDocuments []UploadedDocument `json:"uploaded_documents"`
    
    // Metadata
    LastUpdated time.Time `json:"last_updated"`
}

// ProgressStep represents a single step in the process
type ProgressStep struct {
    StepName string `json:"step_name"`
    StepOrder int `json:"step_order"`
    Title string `json:"title"`
    Description string `json:"description"`
    Status string `json:"status"` // "completed", "current", "pending"
    CompletedAt *time.Time `json:"completed_at,omitempty"`
    EstimatedDuration int `json:"estimated_duration_hours"`
    IsActive bool `json:"is_active"`
}

// StatusChange represents a historical status change
type StatusChange struct {
    ID string `json:"id"`
    OldStatus string `json:"old_status,omitempty"`
    NewStatus string `json:"new_status"`
    StepName string `json:"step_name"`
    Message string `json:"message"`
    OccurredAt time.Time `json:"occurred_at"`
    ChangedByName string `json:"changed_by_name,omitempty"`
}

// DocumentRequirement represents a required document
type DocumentRequirement struct {
    Name string `json:"name"`
    NameIndonesian string `json:"name_indonesian"`
    Required bool `json:"required"`
    Status string `json:"status"` // "not_uploaded", "uploaded", "verified", "rejected"
}

// UploadedDocument represents an uploaded document
type UploadedDocument struct {
    ID string `json:"id"`
    Name string `json:"name"`
    UploadedAt time.Time `json:"uploaded_at"`
    Status string `json:"status"` // "pending_verification", "verified", "rejected"
    RejectionReason string `json:"rejection_reason,omitempty"`
}

// GetTicketProgress retrieves complete progress information for a ticket
func (s *ProgressService) GetTicketProgress(ctx context.Context, ticketCode string) (*TicketProgress, error) {
    start := time.Now()
    defer func() {
        s.monitoring.RecordDuration("silpana_get_progress_duration", time.Since(start), map[string]string{
            "operation": "get_progress",
        })
    }()
    
    // Try cache first
    cacheKey := fmt.Sprintf("silpana:progress:%s", ticketCode)
    cached, err := s.cache.Get(ctx, cacheKey)
    if err == nil && cached != nil {
        if progress, ok := cached.(*TicketProgress); ok {
            s.monitoring.IncrementCounter("silpana_progress_cache_hits", map[string]string{})
            return progress, nil
        }
    }
    
    // Cache miss, query database
    progress, err := s.fetchProgressFromDatabase(ctx, ticketCode)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch progress: %w", err)
    }
    
    // Cache the result (5 minute TTL)
    err = s.cache.Set(ctx, cacheKey, progress, 5*time.Minute)
    if err != nil {
        // Log but don't fail
        s.monitoring.IncrementCounter("silpana_cache_errors", map[string]string{"operation": "set"})
    }
    
    s.monitoring.IncrementCounter("silpana_progress_cache_misses", map[string]string{})
    return progress, nil
}

// fetchProgressFromDatabase queries database for progress information
func (s *ProgressService) fetchProgressFromDatabase(ctx context.Context, ticketCode string) (*TicketProgress, error) {
    // Query ticket info
    ticketQuery := `
        SELECT id, ticket_code, jenis_pengaduan as category, ticket_status
        FROM silpana
        WHERE ticket_code = $1
    `
    
    ticketResults, err := s.db.Query(ctx, ticketQuery, ticketCode)
    if err != nil {
        return nil, fmt.Errorf("failed to query ticket: %w", err)
    }
    
    if len(ticketResults) == 0 {
        return nil, fmt.Errorf("ticket not found")
    }
    
    ticket := ticketResults[0]
    ticketID := ticket["id"].(string)
    category := ticket["category"].(string)
    
    // Query progress data
    progressQuery := `
        SELECT 
            current_step, step_order, total_steps, completion_percentage,
            estimated_completion_date, estimated_hours_remaining,
            assigned_to_name, assigned_at,
            status_description, guest_visible_notes,
            required_documents, uploaded_documents, verified_documents,
            updated_at
        FROM ticket_progress
        WHERE ticket_id = $1
    `
    
    progressResults, err := s.db.Query(ctx, progressQuery, ticketID)
    if err != nil {
        return nil, fmt.Errorf("failed to query progress: %w", err)
    }
    
    // If no progress record exists, create default
    if len(progressResults) == 0 {
        return s.createDefaultProgress(ctx, ticketID, ticketCode, category)
    }
    
    progressData := progressResults[0]
    
    // Query steps configuration
    steps, err := s.fetchSteps(ctx, category, progressData["step_order"].(int))
    if err != nil {
        return nil, fmt.Errorf("failed to fetch steps: %w", err)
    }
    
    // Query history
    history, err := s.fetchHistory(ctx, ticketID)
    if err != nil {
        return nil, fmt.Errorf("failed to fetch history: %w", err)
    }
    
    // Build progress object
    progress := &TicketProgress{
        TicketID: ticketID,
        TicketCode: ticketCode,
        CurrentStep: progressData["current_step"].(string),
        StepOrder: progressData["step_order"].(int),
        TotalSteps: progressData["total_steps"].(int),
        CompletionPercentage: progressData["completion_percentage"].(int),
        StatusDescription: getStringValue(progressData, "status_description"),
        GuestVisibleNotes: getStringValue(progressData, "guest_visible_notes"),
        Steps: steps,
        History: history,
        LastUpdated: progressData["updated_at"].(time.Time),
    }
    
    // Optional fields
    if progressData["estimated_completion_date"] != nil {
        date := progressData["estimated_completion_date"].(time.Time)
        progress.EstimatedCompletionDate = &date
    }
    
    if progressData["estimated_hours_remaining"] != nil {
        hours := progressData["estimated_hours_remaining"].(int)
        progress.EstimatedHoursRemaining = &hours
    }
    
    if progressData["assigned_to_name"] != nil {
        progress.AssignedToName = progressData["assigned_to_name"].(string)
    }
    
    if progressData["assigned_at"] != nil {
        assignedAt := progressData["assigned_at"].(time.Time)
        progress.AssignedAt = &assignedAt
    }
    
    // Parse document requirements
    progress.RequiredDocuments = s.parseDocumentRequirements(progressData)
    progress.UploadedDocuments = s.parseUploadedDocuments(progressData)
    
    return progress, nil
}

// fetchSteps queries step configuration and marks current/completed steps
func (s *ProgressService) fetchSteps(ctx context.Context, category string, currentStepOrder int) ([]ProgressStep, error) {
    query := `
        SELECT 
            step_name, step_order, 
            step_title_indonesian as title,
            step_description_indonesian as description,
            estimated_duration_hours,
            is_active
        FROM ticket_steps
        WHERE category = $1 AND is_active = true
        ORDER BY step_order ASC
    `
    
    results, err := s.db.Query(ctx, query, category)
    if err != nil {
        return nil, err
    }
    
    steps := make([]ProgressStep, 0, len(results))
    for _, result := range results {
        stepOrder := result["step_order"].(int)
        
        // Determine status
        status := "pending"
        if stepOrder < currentStepOrder {
            status = "completed"
        } else if stepOrder == currentStepOrder {
            status = "current"
        }
        
        step := ProgressStep{
            StepName: result["step_name"].(string),
            StepOrder: stepOrder,
            Title: result["title"].(string),
            Description: result["description"].(string),
            Status: status,
            EstimatedDuration: result["estimated_duration_hours"].(int),
            IsActive: result["is_active"].(bool),
        }
        
        steps = append(steps, step)
    }
    
    return steps, nil
}

// fetchHistory queries status change history
func (s *ProgressService) fetchHistory(ctx context.Context, ticketID string) ([]StatusChange, error) {
    query := `
        SELECT 
            id, old_status, new_status, step_name,
            guest_visible_message as message,
            occurred_at, changed_by_name
        FROM status_history
        WHERE ticket_id = $1
        ORDER BY occurred_at DESC
        LIMIT 20
    `
    
    results, err := s.db.Query(ctx, query, ticketID)
    if err != nil {
        return nil, err
    }
    
    history := make([]StatusChange, 0, len(results))
    for _, result := range results {
        change := StatusChange{
            ID: result["id"].(string),
            OldStatus: getStringValue(result, "old_status"),
            NewStatus: result["new_status"].(string),
            StepName: result["step_name"].(string),
            Message: result["message"].(string),
            OccurredAt: result["occurred_at"].(time.Time),
            ChangedByName: getStringValue(result, "changed_by_name"),
        }
        
        history = append(history, change)
    }
    
    return history, nil
}

// createDefaultProgress creates default progress record for new tickets
func (s *ProgressService) createDefaultProgress(ctx context.Context, ticketID, ticketCode, category string) (*TicketProgress, error) {
    // Insert default progress
    query := `
        INSERT INTO ticket_progress (
            ticket_id, current_step, step_order, total_steps, 
            completion_percentage, status_description, guest_visible_notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
    `
    
    err := s.db.Execute(ctx, query,
        ticketID,
        "submission_received",
        1,
        5,
        20,
        "Tiket Anda telah diterima",
        "Terima kasih! Tiket Anda telah diterima oleh sistem. Petugas kami akan segera memverifikasi dokumen Anda.",
    )
    
    if err != nil {
        return nil, fmt.Errorf("failed to create default progress: %w", err)
    }
    
    // Return newly created progress
    return s.fetchProgressFromDatabase(ctx, ticketCode)
}

// Helper function for safe string extraction
func getStringValue(data map[string]interface{}, key string) string {
    if val, ok := data[key]; ok && val != nil {
        if str, ok := val.(string); ok {
            return str
        }
    }
    return ""
}
```

#### 2. API Handler

```go
// File: backend/internal/services/silpana/progress_handler.go

package silpana

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

// GetTicketProgress handles GET /api/v1/silpana/tickets/:code/progress
func (h *Handler) GetTicketProgress(c *gin.Context) {
    ticketCode := c.Param("code")
    
    if ticketCode == "" {
        c.JSON(http.StatusBadRequest, gin.H{
            "success": false,
            "error": "Kode tiket wajib diisi",
            "message": "Ticket code is required",
        })
        return
    }
    
    // Get progress data
    progress, err := h.progressService.GetTicketProgress(c.Request.Context(), ticketCode)
    if err != nil {
        c.JSON(http.StatusNotFound, gin.H{
            "success": false,
            "error": "Tiket tidak ditemukan atau terjadi kesalahan",
            "message": err.Error(),
        })
        return
    }
    
    c.JSON(http.StatusOK, gin.H{
        "success": true,
        "progress": progress,
        "message": "Progress tiket berhasil dimuat",
    })
}
```

#### 3. Route Registration

```go
// File: backend/internal/api/routes/routes.go

// Add to SILPANA routes
silpanaGroup := router.Group("/api/v1/silpana")
{
    // ... existing routes ...
    
    // Progress tracking (guest accessible)
    silpanaGroup.GET("/tickets/:code/progress", silpanaHandler.GetTicketProgress)
}
```

### Frontend Implementation

#### 1. Types Definition

```typescript
// File: frontend/src/types/silpana/progress.ts

export interface TicketProgress {
  ticket_id: string;
  ticket_code: string;
  
  // Progress tracking
  current_step: string;
  step_order: number;
  total_steps: number;
  completion_percentage: number;
  
  // Timeline
  steps: ProgressStep[];
  history: StatusChange[];
  
  // Estimated completion
  estimated_completion_date?: string;
  estimated_hours_remaining?: number;
  
  // Staff info
  assigned_to_name?: string;
  assigned_at?: string;
  
  // Notes
  status_description: string;
  guest_visible_notes: string;
  
  // Document tracking
  required_documents: DocumentRequirement[];
  uploaded_documents: UploadedDocument[];
  
  // Metadata
  last_updated: string;
}

export interface ProgressStep {
  step_name: string;
  step_order: number;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'pending';
  completed_at?: string;
  estimated_duration_hours: number;
  is_active: boolean;
}

export interface StatusChange {
  id: string;
  old_status?: string;
  new_status: string;
  step_name: string;
  message: string;
  occurred_at: string;
  changed_by_name?: string;
}

export interface DocumentRequirement {
  name: string;
  name_indonesian: string;
  required: boolean;
  status: 'not_uploaded' | 'uploaded' | 'verified' | 'rejected';
}

export interface UploadedDocument {
  id: string;
  name: string;
  uploaded_at: string;
  status: 'pending_verification' | 'verified' | 'rejected';
  rejection_reason?: string;
}
```

#### 2. API Integration

```typescript
// File: frontend/src/lib/api/silpana-progress.ts

import type { TicketProgress } from '@/types/silpana/progress';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export async function fetchTicketProgress(ticketCode: string): Promise<TicketProgress> {
  const response = await fetch(`${API_BASE_URL}/api/v1/silpana/tickets/${ticketCode}/progress`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Gagal memuat progress tiket');
  }
  
  const data = await response.json();
  return data.progress;
}
```

#### 3. Progress Display Component

```typescript
// File: frontend/src/components/silpana/TicketProgressDisplay.tsx

'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  User, 
  FileText,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import type { TicketProgress } from '@/types/silpana/progress';
import { formatDistanceToNow } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

interface Props {
  progress: TicketProgress;
}

export default function TicketProgressDisplay({ progress }: Props) {
  return (
    <div className="space-y-6">
      {/* Progress Overview Card */}
      <Card className="border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Progress Tiket</span>
            <Badge variant="outline" className="text-lg">
              {progress.completion_percentage}%
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress.completion_percentage} className="h-3" />
            <p className="text-sm text-muted-foreground">
              Langkah {progress.step_order} dari {progress.total_steps}
            </p>
          </div>
          
          {/* Current Status */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100">
                  {progress.status_description}
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  {progress.guest_visible_notes}
                </p>
              </div>
            </div>
          </div>
          
          {/* Estimated Completion */}
          {progress.estimated_hours_remaining && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Estimasi penyelesaian:</span>
              <span className="font-semibold">
                {progress.estimated_hours_remaining < 24
                  ? `${progress.estimated_hours_remaining} jam lagi`
                  : `${Math.ceil(progress.estimated_hours_remaining / 24)} hari lagi`}
              </span>
            </div>
          )}
          
          {/* Assigned Staff */}
          {progress.assigned_to_name && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Ditangani oleh: <strong>{progress.assigned_to_name}</strong></span>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Timeline Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Proses</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress.steps.map((step, index) => (
              <motion.div
                key={step.step_name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4"
              >
                {/* Step Icon */}
                <div className="flex flex-col items-center">
                  <div className={`rounded-full p-2 ${
                    step.status === 'completed'
                      ? 'bg-green-100 dark:bg-green-900/30'
                      : step.status === 'current'
                      ? 'bg-blue-100 dark:bg-blue-900/30 ring-4 ring-blue-200 dark:ring-blue-800'
                      : 'bg-gray-100 dark:bg-gray-800'
                  }`}>
                    {step.status === 'completed' ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : step.status === 'current' ? (
                      <Clock className="h-5 w-5 text-blue-600 animate-pulse" />
                    ) : (
                      <Circle className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  
                  {/* Connector Line */}
                  {index < progress.steps.length - 1 && (
                    <div className={`w-0.5 h-16 ${
                      step.status === 'completed'
                        ? 'bg-green-300 dark:bg-green-700'
                        : 'bg-gray-200 dark:bg-gray-700'
                    }`} />
                  )}
                </div>
                
                {/* Step Content */}
                <div className="flex-1 pb-8">
                  <h4 className={`font-semibold ${
                    step.status === 'current'
                      ? 'text-blue-600 dark:text-blue-400'
                      : step.status === 'completed'
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-400'
                  }`}>
                    {step.title}
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {step.description}
                  </p>
                  
                  {step.status === 'current' && step.estimated_duration_hours > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Estimasi: ~{step.estimated_duration_hours} jam</span>
                    </div>
                  )}
                  
                  {step.completed_at && (
                    <div className="mt-2 text-xs text-green-600 dark:text-green-400">
                      ✓ Selesai {formatDistanceToNow(new Date(step.completed_at), {
                        addSuffix: true,
                        locale: idLocale
                      })}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Document Requirements */}
      {progress.required_documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dokumen yang Diperlukan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progress.required_documents.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 rounded-lg border"
                >
                  <div className="flex items-center gap-3">
                    {doc.status === 'verified' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : doc.status === 'uploaded' ? (
                      <Clock className="h-5 w-5 text-blue-600" />
                    ) : doc.status === 'rejected' ? (
                      <XCircle className="h-5 w-5 text-red-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-gray-400" />
                    )}
                    
                    <div>
                      <p className="font-medium">{doc.name_indonesian}</p>
                      {doc.required && (
                        <p className="text-xs text-red-500">Wajib</p>
                      )}
                    </div>
                  </div>
                  
                  <Badge variant={
                    doc.status === 'verified' ? 'default' :
                    doc.status === 'uploaded' ? 'secondary' :
                    doc.status === 'rejected' ? 'destructive' :
                    'outline'
                  }>
                    {doc.status === 'verified' ? 'Terverifikasi' :
                     doc.status === 'uploaded' ? 'Menunggu Verifikasi' :
                     doc.status === 'rejected' ? 'Ditolak' :
                     'Belum Upload'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Riwayat Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {progress.history.map((change, index) => (
              <motion.div
                key={change.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex gap-3 pb-4 border-b last:border-0"
              >
                <div className="flex-shrink-0 mt-1">
                  <div className="h-2 w-2 rounded-full bg-blue-600" />
                </div>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">{change.message}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span>
                      {formatDistanceToNow(new Date(change.occurred_at), {
                        addSuffix: true,
                        locale: idLocale
                      })}
                    </span>
                    {change.changed_by_name && (
                      <>
                        <span>•</span>
                        <span>oleh {change.changed_by_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Last Updated */}
      <div className="text-center text-sm text-muted-foreground">
        Terakhir diperbarui: {formatDistanceToNow(new Date(progress.last_updated), {
          addSuffix: true,
          locale: idLocale
        })}
      </div>
    </div>
  );
}
```

#### 4. Integration with Ticket Lookup

```typescript
// File: frontend/src/components/silpana/TicketStatusDisplay.tsx
// Add progress display integration

import { useState, useEffect } from 'react';
import { fetchTicketProgress } from '@/lib/api/silpana-progress';
import TicketProgressDisplay from './TicketProgressDisplay';
import type { TicketProgress } from '@/types/silpana/progress';

// Inside TicketStatusDisplay component
const [progress, setProgress] = useState<TicketProgress | null>(null);
const [loadingProgress, setLoadingProgress] = useState(false);

// Fetch progress when ticket is loaded
useEffect(() => {
  if (ticket?.ticket_code) {
    loadProgress();
  }
}, [ticket?.ticket_code]);

const loadProgress = async () => {
  if (!ticket?.ticket_code) return;
  
  setLoadingProgress(true);
  try {
    const progressData = await fetchTicketProgress(ticket.ticket_code);
    setProgress(progressData);
  } catch (error) {
    console.error('Failed to load progress:', error);
    // Optionally show error toast
  } finally {
    setLoadingProgress(false);
  }
};

// In render
return (
  <div className="space-y-6">
    {/* Existing ticket details... */}
    
    {/* Progress Display */}
    {loadingProgress ? (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="ml-3">Memuat progress...</span>
          </div>
        </CardContent>
      </Card>
    ) : progress ? (
      <TicketProgressDisplay progress={progress} />
    ) : null}
  </div>
);
```

### Testing Strategy

#### 1. Backend Tests

```go
// File: backend/test/integration/silpana_progress_test.go

func TestGetTicketProgress(t *testing.T) {
    // Create test ticket
    ticket := createTestTicket(t)
    
    // Test progress retrieval
    progress, err := progressService.GetTicketProgress(context.Background(), ticket.Code)
    
    assert.NoError(t, err)
    assert.NotNil(t, progress)
    assert.Equal(t, ticket.Code, progress.TicketCode)
    assert.GreaterOrEqual(t, progress.CompletionPercentage, 0)
    assert.LessOrEqual(t, progress.CompletionPercentage, 100)
    assert.NotEmpty(t, progress.Steps)
    assert.Equal(t, "submission_received", progress.CurrentStep)
}

func TestProgressStepTransitions(t *testing.T) {
    ticket := createTestTicket(t)
    
    // Test moving through steps
    steps := []string{
        "submission_received",
        "document_verification",
        "data_processing",
        "document_printing",
        "ready_for_pickup",
    }
    
    for i, step := range steps {
        err := progressService.UpdateStep(context.Background(), ticket.ID, step, i+1)
        assert.NoError(t, err)
        
        progress, err := progressService.GetTicketProgress(context.Background(), ticket.Code)
        assert.NoError(t, err)
        assert.Equal(t, step, progress.CurrentStep)
        assert.Equal(t, i+1, progress.StepOrder)
    }
}
```

#### 2. Frontend Tests

```typescript
// File: frontend/src/__tests__/silpana/TicketProgressDisplay.test.tsx

describe('TicketProgressDisplay', () => {
  const mockProgress: TicketProgress = {
    ticket_id: 'test-id',
    ticket_code: 'SPL251006TEST123',
    current_step: 'document_verification',
    step_order: 2,
    total_steps: 5,
    completion_percentage: 40,
    status_description: 'Dokumen sedang diverifikasi',
    guest_visible_notes: 'Petugas kami sedang memverifikasi dokumen',
    steps: [
      {
        step_name: 'submission_received',
        step_order: 1,
        title: 'Pengajuan Diterima',
        description: 'Tiket diterima',
        status: 'completed',
        estimated_duration_hours: 2,
        is_active: true,
      },
      // ... more steps
    ],
    history: [],
    required_documents: [],
    uploaded_documents: [],
    last_updated: new Date().toISOString(),
  };
  
  it('should render progress overview', () => {
    render(<TicketProgressDisplay progress={mockProgress} />);
    
    expect(screen.getByText('Progress Tiket')).toBeInTheDocument();
    expect(screen.getByText('40%')).toBeInTheDocument();
    expect(screen.getByText('Langkah 2 dari 5')).toBeInTheDocument();
  });
  
  it('should render timeline steps', () => {
    render(<TicketProgressDisplay progress={mockProgress} />);
    
    expect(screen.getByText('Pengajuan Diterima')).toBeInTheDocument();
    expect(screen.getByText('Timeline Proses')).toBeInTheDocument();
  });
  
  it('should highlight current step', () => {
    render(<TicketProgressDisplay progress={mockProgress} />);
    
    const currentStep = screen.getByText('Verifikasi Dokumen');
    expect(currentStep).toHaveClass('text-blue-600');
  });
});
```

### Deployment Checklist

#### Phase 1: Database Setup (Day 1)

- [ ] Run migration to create `ticket_progress` table
- [ ] Run migration to create `status_history` table
- [ ] Run migration to create `ticket_steps` table
- [ ] Populate `ticket_steps` with default data for all categories
- [ ] Test RLS policies
- [ ] Verify indexes created

#### Phase 2: Backend Deployment (Day 2)

- [ ] Deploy `progress_service.go`
- [ ] Deploy `progress_handler.go`
- [ ] Register progress routes
- [ ] Test API endpoint: `GET /api/v1/silpana/tickets/:code/progress`
- [ ] Verify caching works (5 min TTL)
- [ ] Monitor performance metrics

#### Phase 3: Frontend Deployment (Day 3)

- [ ] Deploy type definitions
- [ ] Deploy API integration functions
- [ ] Deploy `TicketProgressDisplay` component
- [ ] Integrate with `TicketStatusDisplay`
- [ ] Test on staging environment
- [ ] Verify responsive design on mobile

#### Phase 4: Testing & Validation (Day 4)

- [ ] Run integration tests
- [ ] Run frontend component tests
- [ ] User acceptance testing
- [ ] Performance testing (load time < 500ms)
- [ ] Cross-browser testing

#### Phase 5: Production Release (Day 5)

- [ ] Deploy to production
- [ ] Monitor error rates
- [ ] Monitor API response times
- [ ] Collect user feedback
- [ ] Document any issues

## Success Metrics

### Technical Metrics

- **API Response Time**: < 200ms for progress endpoint
- **Cache Hit Ratio**: > 80% for progress queries
- **Error Rate**: < 0.5%
- **Database Query Time**: < 50ms

### User Experience Metrics

- **Progress View Rate**: % of users who view progress after lookup
- **Time on Progress Page**: Average session duration
- **Bounce Rate**: % of users who leave immediately
- **User Satisfaction**: Feedback rating > 4.5/5

### Business Metrics

- **Support Ticket Reduction**: Target 30% reduction in "where's my ticket" inquiries
- **User Engagement**: Increased return visits to check progress
- **Transparency Score**: User perception of process transparency

## Future Enhancements (Admin Panel Integration)

### Phase 2: Admin Features

1. **Manual Status Updates**
   - Admin interface to update progress
   - Bulk status updates
   - Custom messages for users

2. **Document Verification**
   - Admin can verify/reject documents
   - Add verification notes
   - Request additional documents

3. **Step Management**
   - Add custom steps per ticket
   - Modify step order
   - Configure step requirements

4. **Analytics Dashboard**
   - Average completion time per step
   - Bottleneck identification
   - Staff performance metrics

5. **Notifications**
   - Email notifications on status change
   - SMS notifications (optional)
   - Push notifications (PWA)

6. **Real-time Updates**
   - WebSocket integration for live updates
   - Admin sees guest viewing progress
   - Instant status sync

## Appendix

### A. Sample Progress Data

```json
{
  "ticket_id": "123e4567-e89b-12d3-a456-426614174000",
  "ticket_code": "SPL251006D9EC8737",
  "current_step": "document_verification",
  "step_order": 2,
  "total_steps": 5,
  "completion_percentage": 40,
  "steps": [
    {
      "step_name": "submission_received",
      "step_order": 1,
      "title": "Pengajuan Diterima",
      "description": "Tiket pengajuan Anda telah diterima oleh sistem",
      "status": "completed",
      "completed_at": "2025-10-06T10:30:00Z",
      "estimated_duration_hours": 2,
      "is_active": true
    },
    {
      "step_name": "document_verification",
      "step_order": 2,
      "title": "Verifikasi Dokumen",
      "description": "Petugas sedang memverifikasi kelengkapan dokumen",
      "status": "current",
      "estimated_duration_hours": 24,
      "is_active": true
    },
    {
      "step_name": "data_processing",
      "step_order": 3,
      "title": "Pemrosesan Data",
      "description": "Data Anda sedang diproses ke sistem",
      "status": "pending",
      "estimated_duration_hours": 48,
      "is_active": true
    }
  ],
  "history": [
    {
      "id": "hist-001",
      "old_status": null,
      "new_status": "pending",
      "step_name": "submission_received",
      "message": "Tiket Anda telah dibuat dan menunggu pemrosesan",
      "occurred_at": "2025-10-06T10:30:00Z"
    },
    {
      "id": "hist-002",
      "old_status": "pending",
      "new_status": "in_progress",
      "step_name": "document_verification",
      "message": "Petugas telah mulai memverifikasi dokumen Anda",
      "occurred_at": "2025-10-06T11:15:00Z",
      "changed_by_name": "Petugas A"
    }
  ],
  "status_description": "Dokumen sedang diverifikasi",
  "guest_visible_notes": "Petugas kami sedang memverifikasi kelengkapan dan keabsahan dokumen yang Anda upload. Proses ini biasanya memakan waktu 1-2 hari kerja.",
  "estimated_hours_remaining": 20,
  "assigned_to_name": "Petugas A",
  "required_documents": [
    {
      "name": "birth_certificate_hospital",
      "name_indonesian": "Surat Keterangan Lahir dari RS/Bidan",
      "required": true,
      "status": "verified"
    },
    {
      "name": "parent_ktp",
      "name_indonesian": "KTP Orang Tua",
      "required": true,
      "status": "uploaded"
    },
    {
      "name": "family_card",
      "name_indonesian": "Kartu Keluarga",
      "required": true,
      "status": "not_uploaded"
    }
  ],
  "uploaded_documents": [
    {
      "id": "doc-001",
      "name": "Surat Keterangan Lahir",
      "uploaded_at": "2025-10-06T10:25:00Z",
      "status": "verified"
    },
    {
      "id": "doc-002",
      "name": "KTP Ayah",
      "uploaded_at": "2025-10-06T10:26:00Z",
      "status": "pending_verification"
    }
  ],
  "last_updated": "2025-10-06T11:15:00Z"
}
```

### B. Migration Scripts

See separate migration files:

- `backend/migrations/008_create_ticket_progress_table.sql`
- `backend/migrations/009_create_status_history_table.sql`
- `backend/migrations/010_create_ticket_steps_table.sql`
- `backend/migrations/011_populate_default_steps.sql`

### C. API Endpoints Summary

```
GET  /api/v1/silpana/tickets/:code/progress
     → Returns complete progress information
     → Guest accessible (with ticket code)
     → Cached for 5 minutes
     → Response time target: < 200ms
```

---

**Last Updated**: 2025-10-06
**Status**: 🚧 Planning Phase
**Next Steps**: Review with team, begin database schema implementation
**Estimated Implementation Time**: 5 days
**Target Release**: 2025-10-13 (1 week from today)
