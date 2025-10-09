# SILPANA Admin Panel Planning & Architecture

**Document**: SILPANA Admin Panel Implementation Plan
**Project Date**: 2025-10-08
**Created**: 2025-10-08
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: Bilingual (English + Indonesian)
**Audience**: Development Team
**Type**: Architecture & Implementation Guide

## Executive Summary

This document provides a comprehensive plan for creating a production-ready admin panel for SILPANA (Sistem Layanan Administrasi) within the protected route `/frontend/src/app/(protected)/silpana/*`. The plan builds upon existing guest mode functionality, adds admin-specific features including ticket management, user management, analytics, and real-time monitoring with WebSocket integration.

The implementation follows Next.js 15 best practices, maintains consistency with existing SILPANA components, and ensures proper authentication/authorization through Supabase RLS policies.

## Current State Analysis

### Existing SILPANA Infrastructure

#### 1. Guest Mode (Public Access)

**Location**: `/frontend/src/app/silpana/page.tsx`

**Key Features**:

- Anonymous ticket submission with NIK validation
- Ticket lookup by code + phone/NIK verification
- Progress tracking with real-time updates
- Multi-tab navigation (Form, Lookup, Rekap)
- Comprehensive form validation
- WebSocket integration for real-time updates

**Component Architecture**:

```typescript
// Main Components (23 components total)
├── SilpanaHeader.tsx          // Branding & navigation header
├── SilpanaActions.tsx         // Quick action buttons
├── SilpanaForm.tsx            // Ticket submission form (1953 lines)
├── SilpanaTable.tsx           // Data table with filtering (1418 lines)
├── TicketLookup.tsx           // Public ticket lookup (634 lines)
├── TicketSuccessFeedback.tsx  // Success confirmation
├── TicketProgressDisplay.tsx  // Progress tracking UI
├── TicketStatusDisplay.tsx    // Status visualization
├── EnhancedNavigation.tsx     // Tab navigation
├── EmptyState.tsx             // Empty states
└── LoadingState.tsx           // Loading indicators
```

**State Management**:

```typescript
// Key state variables from page.tsx
const [activeMode, setActiveMode] = useState<SilpanaMode>(SilpanaMode.LOOKUP);
const [formData, setFormData] = useState<SilpanaFormData>({ ... });
const [rekapData, setRekapData] = useState<SilpanaData[]>([]);
const [foundTicket, setFoundTicket] = useState<EnhancedSilpanaData | null>(null);
const [loading, setLoading] = useState(false);
```

**API Integration**:

- Direct Supabase calls for anonymous submissions
- Backend Go API for authenticated operations
- WebSocket for real-time updates
- Progress tracking via `/api/v1/silpana/progress/:code`

#### 2. Protected Admin Routes (Partially Implemented)

**Location**: `/frontend/src/app/(protected)/silpana/`

**Existing Pages**:

1. **Admin Dashboard** (`admin/page.tsx` - 282 lines)
   - Basic statistics display
   - Date range filtering
   - Popular categories chart
   - Pending/resolved counts

2. **Complaints List** (`complaints/page.tsx` - 489 lines)
   - Complaint listing with pagination
   - Search and filtering
   - Status updates
   - Detail view modal

**Gaps Identified**:

- No unified admin panel layout
- Limited ticket management capabilities
- No user role management
- Missing analytics dashboards
- No bulk operations
- Limited reporting features
- No audit trail visibility
- Missing assignment workflows

#### 3. Backend API Support

**Available Endpoints** (`backend/internal/api/routes/routes.go`):

```go
// Public endpoints
POST   /api/v1/silpana/tickets                  // Create ticket
POST   /api/v1/silpana/tickets/lookup           // Lookup ticket
GET    /api/v1/silpana/progress/:code           // Get progress

// Protected endpoints (require auth)
GET    /api/v1/silpana/tickets/:id              // Get ticket details
GET    /api/v1/silpana/tickets/:id/history      // Get ticket history
PUT    /api/v1/silpana/tickets/:id/status       // Update status
GET    /api/v1/silpana/stats                    // Get statistics
GET    /api/v1/silpana/tickets/status/:status   // Get by status
GET    /api/v1/silpana/health                   // Health check
```

**Backend Services**:

```go
// Key services in backend/internal/services/silpana/
├── service.go              // Main service implementation
├── operations.go           // CRUD operations
├── handler.go              // HTTP handlers
├── progress_service.go     // Progress tracking logic
├── progress_handler.go     // Progress endpoints
├── websocket.go            // WebSocket integration
├── websocket_broadcaster.go // Broadcasting service
└── types.go                // Type definitions
```

#### 4. Database Schema

**Main Table**: `silpana` (from `002_silpana_ticketing_system.sql`)

```sql
-- Core fields
id UUID PRIMARY KEY
ticket_code VARCHAR(20) UNIQUE         -- SPL251006XXXXXXXX
ticket_status VARCHAR(20)              -- submitted, in_progress, resolved, etc.
priority_level VARCHAR(10)             -- low, medium, high, critical

-- Personal information
nama_pengaduan VARCHAR(200)            -- Name
nik_pengaduan VARCHAR(20)              -- National ID
nomor_telepon VARCHAR(20)              -- Phone
email VARCHAR(100)                     -- Email (optional)
alamat TEXT                            -- Address (optional)

-- Complaint details
kategori_pengaduan VARCHAR(100)        -- Category
sub_kategori_pengaduan VARCHAR(100)    -- Sub-category
alasan_pengaduan TEXT                  -- Reason
deskripsi_pengaduan TEXT               -- Description
tindak_lanjut_pengaduan TEXT           -- Follow-up action

-- Ticketing system
assigned_to VARCHAR(100)               -- Assigned admin
estimated_resolution TIMESTAMP
actual_resolution TIMESTAMP
resolution_notes TEXT
created_by_ip INET

-- Timestamps
created_at TIMESTAMP
updated_at TIMESTAMP
last_updated TIMESTAMP
```

**Related Tables**:

- `silpana_ticket_history` - Status change history
- `silpana_ticket_communications` - Messages between admin and submitter
- `silpana_progress_steps` - Step configurations for progress tracking
- `silpana_progress_history` - Detailed progress history

#### 5. Type Definitions

**Frontend Types** (`frontend/src/types/silpana/silpana.ts`):

```typescript
// Core enums
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

export enum PriorityLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum SilpanaMode {
  FORM = 'form',
  LOOKUP = 'lookup',
  REKAP = 'rekap',
  ADMIN = 'admin'
}

// Main data interface
export interface SilpanaData { ... }
export interface EnhancedSilpanaData extends SilpanaData { ... }
export interface TicketHistory { ... }
export interface TicketCommunication { ... }
```

**Progress Types** (`frontend/src/types/silpana/progress.ts`):

```typescript
export interface TicketProgressResponse {
  ticket_id: string;
  ticket_code: string;
  category: string;
  current_step: string;
  step_order: number;
  total_steps: number;
  completion_percentage: number;
  estimated_completion_date?: string;
  steps: StepConfiguration[];
  history: StatusHistoryEntry[];
}
```

### Recent Development Context

**Latest Commits** (from `git log`):

```text
955a365 feat(silpana): complete progress tracker integration with Flowbite UI
42ae750 feat(silpana): polish UI/UX with Flowbite components
95b1722 fix(silpana): complete integration fixes for lookup and progress tracking
962d86d fix(silpana): replace SQL queries with direct Supabase client calls
860fd00 fix(silpana): update backend query to use actual database schema columns
```

**Key Learnings**:

1. Direct Supabase client calls preferred over complex SQL queries
2. Flowbite UI components provide consistent design
3. Progress tracking requires careful state management
4. WebSocket integration crucial for real-time updates
5. Column name mismatches between schema and queries caused issues

## Admin Panel Architecture

### Design Principles

1. **Separation of Concerns**
   - Public guest mode: `/app/silpana/*` (existing)
   - Protected admin panel: `/app/(protected)/silpana/*` (to be enhanced)

2. **Authentication & Authorization**
   - Supabase Auth for user authentication
   - Role-based access control (RBAC)
   - RLS policies for data security
   - Admin role verification middleware

3. **Performance First**
   - Server-side data fetching where possible
   - Client-side caching with React Query
   - Pagination for large datasets
   - Optimistic UI updates
   - WebSocket for real-time notifications

4. **User Experience**
   - Intuitive navigation with breadcrumbs
   - Responsive design (mobile/tablet/desktop)
   - Loading states and error handling
   - Toast notifications for actions
   - Keyboard shortcuts for power users

5. **Maintainability**
   - Reuse existing components where possible
   - Consistent naming conventions
   - Comprehensive TypeScript types
   - Inline documentation
   - Component composition over complexity

### Route Structure

```text
/app/(protected)/silpana/
├── layout.tsx                      // Shared admin layout
├── page.tsx                        // Admin dashboard (overview)
├── tickets/
│   ├── page.tsx                    // All tickets list
│   ├── [id]/
│   │   ├── page.tsx                // Ticket detail view
│   │   └── edit/page.tsx           // Ticket edit form
│   ├── new/page.tsx                // Create new ticket (admin)
│   └── bulk-actions/page.tsx       // Bulk operations
├── analytics/
│   ├── page.tsx                    // Analytics dashboard
│   ├── reports/page.tsx            // Reports listing
│   └── exports/page.tsx            // Export center
├── users/
│   ├── page.tsx                    // User management
│   └── [id]/page.tsx               // User detail/edit
├── settings/
│   ├── page.tsx                    // General settings
│   ├── categories/page.tsx         // Category management
│   ├── workflows/page.tsx          // Workflow configuration
│   └── notifications/page.tsx      // Notification settings
└── audit/
    └── page.tsx                    // Audit trail viewer
```

### Component Architecture

```text
/components/silpana/admin/
├── layout/
│   ├── AdminLayout.tsx             // Main admin layout wrapper
│   ├── AdminSidebar.tsx            // Navigation sidebar
│   ├── AdminHeader.tsx             // Top header bar
│   └── BreadcrumbNav.tsx           // Breadcrumb navigation
├── dashboard/
│   ├── StatsCard.tsx               // Statistic display card
│   ├── ChartCard.tsx               // Chart container
│   ├── RecentActivity.tsx          // Recent activity feed
│   ├── QuickActions.tsx            // Quick action buttons
│   └── AlertsPanel.tsx             // Important alerts
├── tickets/
│   ├── TicketTable.tsx             // Enhanced ticket table
│   ├── TicketFilters.tsx           // Advanced filters
│   ├── TicketDetail.tsx            // Detailed view
│   ├── TicketEditor.tsx            // Edit form
│   ├── StatusUpdateModal.tsx       // Status change modal
│   ├── AssignmentModal.tsx         // Assignment dialog
│   ├── BulkActionsBar.tsx          // Bulk operation bar
│   └── TicketTimeline.tsx          // Activity timeline
├── analytics/
│   ├── TicketTrendsChart.tsx       // Trends visualization
│   ├── CategoryBreakdown.tsx       // Category distribution
│   ├── PerformanceMetrics.tsx      // Performance KPIs
│   └── ReportBuilder.tsx           // Custom report builder
├── users/
│   ├── UserTable.tsx               // User listing table
│   ├── UserEditor.tsx              // User edit form
│   └── RoleManager.tsx             // Role assignment
└── shared/
    ├── DataTable.tsx               // Reusable data table
    ├── FilterPanel.tsx             // Generic filter panel
    ├── ExportButton.tsx            // Data export
    └── SearchBar.tsx               // Enhanced search
```

## Implementation Plan

### Phase 1: Foundation (Days 1-2)

#### Day 1: Layout & Navigation

**Tasks**:

1. **Create Admin Layout Component**
   - File: `components/silpana/admin/layout/AdminLayout.tsx`
   - Features:
     - Responsive sidebar navigation
     - Top header with user menu
     - Breadcrumb navigation
     - Theme toggle
     - Notification bell
   - Dependencies:
     - shadcn/ui: Sheet, Avatar, DropdownMenu
     - lucide-react: icons
     - next/link: navigation

2. **Create Admin Sidebar**
   - File: `components/silpana/admin/layout/AdminSidebar.tsx`
   - Navigation items:
     - Dashboard (Home)
     - Tickets (with counter badge)
     - Analytics
     - Users (admin only)
     - Settings
     - Audit Log
   - Features:
     - Collapsible sidebar
     - Active state highlighting
     - Icon + label display
     - Permission-based visibility

3. **Update Protected Layout**
   - File: `app/(protected)/silpana/layout.tsx`
   - Integrate AdminLayout
   - Add authentication check
   - Add role verification

**Acceptance Criteria**:

- [ ] Sidebar renders with all menu items
- [ ] Active route is highlighted
- [ ] Layout is responsive (mobile/desktop)
- [ ] User menu shows logout option
- [ ] Breadcrumbs update based on route

#### Day 2: Dashboard Overview

**Tasks**:

1. **Create Dashboard Page**
   - File: `app/(protected)/silpana/page.tsx`
   - Sections:
     - Welcome header with user name
     - Key metrics (4 stats cards)
     - Recent tickets table
     - Activity timeline
     - Quick actions panel

2. **Create Stats Cards**
   - File: `components/silpana/admin/dashboard/StatsCard.tsx`
   - Display:
     - Total tickets
     - Pending review (critical count)
     - Resolved today
     - Average resolution time
   - Features:
     - Animated counters
     - Trend indicators (↑↓)
     - Click to filter

3. **Create Recent Activity Feed**
   - File: `components/silpana/admin/dashboard/RecentActivity.tsx`
   - Display:
     - Last 10 activities
     - Activity type icon
     - Timestamp (relative)
     - Actor name
     - Quick action link

**Data Fetching**:

```typescript
// app/(protected)/silpana/page.tsx
async function getDashboardStats() {
  const { data: stats } = await supabase
    .from('silpana')
    .select('ticket_status, priority_level, created_at')
    .gte('created_at', getStartOfDay());

  return {
    totalTickets: stats.length,
    pendingReview: stats.filter(s => s.ticket_status === 'under_review').length,
    resolvedToday: stats.filter(s => s.ticket_status === 'resolved').length,
    avgResolutionTime: calculateAvgResolution(stats)
  };
}
```

**Acceptance Criteria**:

- [ ] Dashboard loads in <2 seconds
- [ ] Stats cards show correct counts
- [ ] Recent activity updates in real-time
- [ ] Quick actions navigate correctly
- [ ] Error states handled gracefully

### Phase 2: Ticket Management (Days 3-5)

#### Day 3: Ticket List & Filters

**Tasks**:

1. **Create Enhanced Ticket Table**
   - File: `components/silpana/admin/tickets/TicketTable.tsx`
   - Columns:
     - Checkbox (for bulk selection)
     - Ticket code (with link)
     - Submitter name
     - Category
     - Status badge
     - Priority badge
     - Assigned to
     - Created date
     - Actions dropdown
   - Features:
     - Column sorting
     - Row selection
     - Inline status update
     - Inline priority update
     - Keyboard navigation

2. **Create Advanced Filters**
   - File: `components/silpana/admin/tickets/TicketFilters.tsx`
   - Filters:
     - Status (multi-select)
     - Priority (multi-select)
     - Category (dropdown)
     - Date range picker
     - Assigned to (user select)
     - Search query
   - Features:
     - Filter persistence in URL
     - Clear all filters
     - Saved filter presets
     - Filter count indicator

3. **Create Ticket List Page**
   - File: `app/(protected)/silpana/tickets/page.tsx`
   - Features:
     - Filter panel (collapsible)
     - Ticket table
     - Pagination
     - Bulk action bar
     - Export button
     - Create new ticket button

**API Integration**:

```typescript
// lib/api/silpana-admin.ts
export async function getTickets(params: TicketQueryParams) {
  let query = supabase
    .from('silpana')
    .select('*, assigned_user:users(name)', { count: 'exact' });

  // Apply filters
  if (params.status?.length) {
    query = query.in('ticket_status', params.status);
  }
  
  if (params.priority?.length) {
    query = query.in('priority_level', params.priority);
  }
  
  if (params.category) {
    query = query.eq('kategori_pengaduan', params.category);
  }
  
  if (params.dateRange) {
    query = query.gte('created_at', params.dateRange.from)
                 .lte('created_at', params.dateRange.to);
  }
  
  if (params.assignedTo) {
    query = query.eq('assigned_to', params.assignedTo);
  }
  
  if (params.search) {
    query = query.or(
      `ticket_code.ilike.%${params.search}%,` +
      `nama_pengaduan.ilike.%${params.search}%,` +
      `alasan_pengaduan.ilike.%${params.search}%`
    );
  }
  
  // Sorting
  query = query.order(params.sortBy, { ascending: params.sortOrder === 'asc' });
  
  // Pagination
  const from = (params.page - 1) * params.pageSize;
  query = query.range(from, from + params.pageSize - 1);
  
  return query;
}
```

**Acceptance Criteria**:

- [ ] Table displays all tickets correctly
- [ ] Filters work independently and combined
- [ ] Sorting works on all columns
- [ ] Pagination handles large datasets
- [ ] URL persists filter state
- [ ] Loading states during fetch

#### Day 4: Ticket Detail & Edit

**Tasks**:

1. **Create Ticket Detail Page**
   - File: `app/(protected)/silpana/tickets/[id]/page.tsx`
   - Sections:
     - Header (code, status, priority)
     - Submitter information
     - Complaint details
     - Timeline/history
     - Communications
     - Attachments (if any)
     - Admin actions
   - Actions:
     - Edit ticket
     - Change status
     - Reassign
     - Add note
     - Close ticket

2. **Create Ticket Detail Component**
   - File: `components/silpana/admin/tickets/TicketDetail.tsx`
   - Features:
     - Read-only field display
     - Formatted dates
     - Status history timeline
     - Communication thread
     - Document viewer

3. **Create Status Update Modal**
   - File: `components/silpana/admin/tickets/StatusUpdateModal.tsx`
   - Features:
     - Status dropdown
     - Reason text area
     - Estimated resolution date
     - Notify submitter checkbox
     - Confirmation dialog

4. **Create Assignment Modal**
   - File: `components/silpana/admin/tickets/AssignmentModal.tsx`
   - Features:
     - User search/select
     - Assignment reason
     - Notify assignee
     - Priority adjustment option

**WebSocket Integration**:

```typescript
// hooks/use-ticket-updates.ts
export function useTicketUpdates(ticketId: string) {
  const [ticket, setTicket] = useState<EnhancedSilpanaData | null>(null);
  
  useEffect(() => {
    // Subscribe to ticket updates
    const ws = new WebSocketClient(process.env.NEXT_PUBLIC_WS_URL!);
    
    ws.connect();
    ws.subscribe(`ticket-${ticketId}`);
    
    ws.on('ticket-updated', (data) => {
      setTicket(prev => ({ ...prev, ...data }));
      toast.info('Ticket updated by another user');
    });
    
    return () => {
      ws.unsubscribe(`ticket-${ticketId}`);
      ws.disconnect();
    };
  }, [ticketId]);
  
  return ticket;
}
```

**Acceptance Criteria**:

- [ ] Detail page shows all ticket information
- [ ] Timeline displays in chronological order
- [ ] Status update reflects immediately
- [ ] Assignment notifies user
- [ ] Real-time updates via WebSocket
- [ ] Communication thread is interactive

#### Day 5: Bulk Operations

**Tasks**:

1. **Create Bulk Actions Bar**
   - File: `components/silpana/admin/tickets/BulkActionsBar.tsx`
   - Actions:
     - Update status (multiple)
     - Assign to user
     - Change priority
     - Export selected
     - Delete (with confirmation)
   - Features:
     - Selection count
     - Clear selection
     - Action confirmation dialogs

2. **Implement Bulk Operations API**
   - File: `lib/api/silpana-bulk-operations.ts`
   - Functions:
     - `bulkUpdateStatus(ids, status, reason)`
     - `bulkAssign(ids, userId)`
     - `bulkUpdatePriority(ids, priority)`
     - `bulkExport(ids, format)`
     - `bulkDelete(ids)` (soft delete)

3. **Create Bulk Actions Page**
   - File: `app/(protected)/silpana/tickets/bulk-actions/page.tsx`
   - Features:
     - Import tickets from CSV
     - Batch status updates
     - Mass reassignment
     - Bulk closure

**Acceptance Criteria**:

- [ ] Can select multiple tickets
- [ ] Bulk actions execute successfully
- [ ] Progress indicator during operations
- [ ] Error handling for partial failures
- [ ] Audit log records bulk actions

### Phase 3: Analytics & Reporting (Days 6-7)

#### Day 6: Analytics Dashboard

**Tasks**:

1. **Create Analytics Page**
   - File: `app/(protected)/silpana/analytics/page.tsx`
   - Charts:
     - Ticket trends (line chart)
     - Category breakdown (pie chart)
     - Status distribution (bar chart)
     - Resolution time trends (line chart)
     - Team performance (table)

2. **Create Chart Components**
   - File: `components/silpana/admin/analytics/TicketTrendsChart.tsx`
   - Library: Recharts or Chart.js
   - Features:
     - Interactive tooltips
     - Date range selector
     - Export chart as image
     - Responsive sizing

3. **Create Performance Metrics**
   - File: `components/silpana/admin/analytics/PerformanceMetrics.tsx`
   - Metrics:
     - Average resolution time
     - First response time
     - SLA compliance rate
     - Ticket volume by hour
     - Peak times

**Data Aggregation**:

```typescript
// lib/analytics/ticket-analytics.ts
export async function getTicketTrends(dateRange: DateRange) {
  const { data } = await supabase
    .from('silpana')
    .select('created_at, ticket_status')
    .gte('created_at', dateRange.from)
    .lte('created_at', dateRange.to);
  
  // Group by date
  const trends = data.reduce((acc, ticket) => {
    const date = new Date(ticket.created_at).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = { date, count: 0, statuses: {} };
    acc[date].count++;
    acc[date].statuses[ticket.ticket_status] = 
      (acc[date].statuses[ticket.ticket_status] || 0) + 1;
    return acc;
  }, {} as Record<string, any>);
  
  return Object.values(trends);
}
```

**Acceptance Criteria**:

- [ ] Charts render with correct data
- [ ] Date range filter updates charts
- [ ] Charts are responsive
- [ ] Performance metrics calculate correctly
- [ ] Export functionality works

#### Day 7: Reports & Export

**Tasks**:

1. **Create Reports Page**
   - File: `app/(protected)/silpana/analytics/reports/page.tsx`
   - Report types:
     - Daily summary
     - Weekly digest
     - Monthly report
     - Custom date range
     - Category report
     - User performance report

2. **Create Export Center**
   - File: `app/(protected)/silpana/analytics/exports/page.tsx`
   - Formats:
     - CSV
     - Excel (XLSX)
     - PDF (future)
     - JSON (for API integration)
   - Features:
     - Export history
     - Scheduled exports
     - Email delivery option

3. **Implement Export Service**
   - File: `lib/services/export-service.ts`
   - Functions:
     - `exportToCSV(data, filename)`
     - `exportToExcel(data, filename)`
     - `generateReport(type, params)`

**Acceptance Criteria**:

- [ ] Reports generate correctly
- [ ] Export formats work properly
- [ ] Large datasets export without timeout
- [ ] Export history is tracked
- [ ] Email delivery works

### Phase 4: User & Settings (Days 8-9)

#### Day 8: User Management

**Tasks**:

1. **Create User Management Page**
   - File: `app/(protected)/silpana/users/page.tsx`
   - Features:
     - User list table
     - Search users
     - Filter by role
     - Add new user
     - Edit user
     - Deactivate user

2. **Create User Editor**
   - File: `components/silpana/admin/users/UserEditor.tsx`
   - Fields:
     - Name
     - Email
     - Role (dropdown)
     - Department
     - Permissions
     - Active status

3. **Implement User API**
   - File: `lib/api/user-management.ts`
   - Functions:
     - `getUsers(params)`
     - `createUser(data)`
     - `updateUser(id, data)`
     - `deleteUser(id)`
     - `updateUserRole(id, role)`

**RLS Policies**:

```sql
-- Only admins can manage users
CREATE POLICY "admin_manage_users" ON users
FOR ALL USING (
  auth.jwt() ->> 'role' = 'admin'
);
```

**Acceptance Criteria**:

- [ ] User list displays correctly
- [ ] Can create new users
- [ ] Can edit user details
- [ ] Role changes apply immediately
- [ ] Deactivation works properly

#### Day 9: Settings & Configuration

**Tasks**:

1. **Create Settings Page**
   - File: `app/(protected)/silpana/settings/page.tsx`
   - Sections:
     - General settings
     - Notification preferences
     - Email templates
     - SLA configuration
     - System maintenance

2. **Create Category Management**
   - File: `app/(protected)/silpana/settings/categories/page.tsx`
   - Features:
     - Add/edit/delete categories
     - Add sub-categories
     - Reorder categories
     - Set category icons
     - Configure SLA per category

3. **Create Workflow Configuration**
   - File: `app/(protected)/silpana/settings/workflows/page.tsx`
   - Features:
     - Define status transitions
     - Set approval workflows
     - Configure auto-assignment rules
     - Set escalation rules

**Acceptance Criteria**:

- [ ] Settings persist correctly
- [ ] Category changes reflect in forms
- [ ] Workflow rules apply to tickets
- [ ] Email templates preview correctly

### Phase 5: Audit & Polish (Day 10)

#### Day 10: Audit Log & Final Polish

**Tasks**:

1. **Create Audit Log Page**
   - File: `app/(protected)/silpana/audit/page.tsx`
   - Display:
     - Timestamp
     - User
     - Action type
     - Entity affected
     - Changes (before/after)
     - IP address

2. **Final Testing**
   - Cross-browser testing
   - Mobile responsiveness
   - Performance optimization
   - Security audit
   - Documentation update

3. **Documentation**
   - Admin user guide
   - API documentation
   - Deployment checklist
   - Troubleshooting guide

**Acceptance Criteria**:

- [ ] Audit log captures all actions
- [ ] All pages work on mobile
- [ ] No console errors
- [ ] Performance meets targets
- [ ] Documentation complete

## Technical Specifications

### Authentication Flow

```typescript
// middleware.ts or layout.tsx
async function checkAdminAccess() {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect('/login?redirect=/silpana/admin');
  }
  
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();
  
  if (profile?.role !== 'admin') {
    redirect('/unauthorized');
  }
  
  return { session, profile };
}
```

### RLS Policies

```sql
-- Admin read access
CREATE POLICY "admin_read_all_tickets" ON silpana
FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin update access
CREATE POLICY "admin_update_tickets" ON silpana
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Admin delete access (soft delete)
CREATE POLICY "admin_soft_delete_tickets" ON silpana
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
)
WITH CHECK (deleted_at IS NOT NULL);
```

### State Management Strategy

#### Option 1: React Query (Recommended)

```typescript
// hooks/use-tickets.ts
export function useTickets(params: TicketQueryParams) {
  return useQuery({
    queryKey: ['tickets', params],
    queryFn: () => getTickets(params),
    staleTime: 30000, // 30 seconds
    refetchOnWindowFocus: true
  });
}

export function useUpdateTicketStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, status, reason }: UpdateStatusParams) =>
      updateTicketStatus(id, status, reason),
    onSuccess: (data, variables) => {
      // Optimistic update
      queryClient.setQueryData(['ticket', variables.id], data);
      // Invalidate list
      queryClient.invalidateQueries(['tickets']);
      toast.success('Status updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    }
  });
}
```

#### Option 2: Zustand (Alternative)

```typescript
// stores/tickets-store.ts
import create from 'zustand';

interface TicketsStore {
  tickets: SilpanaData[];
  filters: TicketFilters;
  selectedIds: string[];
  setTickets: (tickets: SilpanaData[]) => void;
  setFilters: (filters: TicketFilters) => void;
  toggleSelection: (id: string) => void;
  clearSelection: () => void;
}

export const useTicketsStore = create<TicketsStore>((set) => ({
  tickets: [],
  filters: {},
  selectedIds: [],
  setTickets: (tickets) => set({ tickets }),
  setFilters: (filters) => set({ filters }),
  toggleSelection: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter(sid => sid !== id)
      : [...state.selectedIds, id]
  })),
  clearSelection: () => set({ selectedIds: [] })
}));
```

### Performance Optimization

#### 1. Code Splitting

```typescript
// Dynamic imports for heavy components
const TicketTable = dynamic(() => import('@/components/silpana/admin/tickets/TicketTable'), {
  loading: () => <TableSkeleton />,
  ssr: false
});

const ChartComponent = dynamic(() => import('@/components/silpana/admin/analytics/TicketTrendsChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false
});
```

#### 2. Pagination & Virtual Scrolling

```typescript
// Using TanStack Virtual for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

function TicketList({ tickets }: { tickets: SilpanaData[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const virtualizer = useVirtualizer({
    count: tickets.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Row height
    overscan: 5
  });
  
  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <TicketRow
            key={virtualRow.key}
            ticket={tickets[virtualRow.index]}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`
            }}
          />
        ))}
      </div>
    </div>
  );
}
```

#### 3. Memoization

```typescript
// Expensive calculations
const stats = useMemo(() => 
  calculateTicketStats(tickets), 
  [tickets]
);

// Callbacks
const handleStatusUpdate = useCallback((id: string, status: TicketStatus) => {
  updateStatus.mutate({ id, status });
}, [updateStatus]);
```

### Error Handling Pattern

```typescript
// lib/error-handler.ts
export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleApiError(error: unknown): never {
  if (error instanceof AppError) {
    throw error;
  }
  
  if (error instanceof PostgrestError) {
    throw new AppError(
      error.message,
      error.code,
      error.details ? 400 : 500
    );
  }
  
  throw new AppError(
    'An unexpected error occurred',
    'UNKNOWN_ERROR',
    500
  );
}

// Usage in components
try {
  await updateTicketStatus(id, status);
  toast.success('Status updated successfully');
} catch (error) {
  if (error instanceof AppError) {
    toast.error(error.message);
  } else {
    toast.error('Terjadi kesalahan yang tidak terduga');
  }
}
```

## UI/UX Guidelines

### Design System

**Colors** (from existing theme):

```typescript
// Ticket status colors
const statusColors = {
  submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
  under_review: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
  pending_info: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
  escalated: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
};

// Priority colors
const priorityColors = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
};
```

**Typography**:

```typescript
// Import from existing lib/typography
import { typo, textColors } from '@/lib/typography';

// Usage
<h1 className={cn(typo.h1, textColors.primary)}>Dashboard</h1>
<p className={cn(typo.body, textColors.secondary)}>Overview of tickets</p>
```

**Components** (shadcn/ui):

- Button: Primary actions
- Badge: Status/priority indicators
- Card: Content containers
- Table: Data display
- Dialog/Modal: Confirmations
- Sheet: Sidebar/filters
- Select: Dropdowns
- Input: Text entry
- Textarea: Long text
- DatePicker: Date selection
- Toast: Notifications

### Responsive Breakpoints

```typescript
// Tailwind breakpoints
const breakpoints = {
  sm: '640px',   // Mobile landscape
  md: '768px',   // Tablet
  lg: '1024px',  // Desktop
  xl: '1280px',  // Large desktop
  '2xl': '1536px' // Extra large
};

// Usage
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
  {/* Stats cards */}
</div>
```

### Loading States

```typescript
// Skeleton components
<Card>
  <CardHeader>
    <Skeleton className="h-8 w-[250px]" />
  </CardHeader>
  <CardContent>
    <Skeleton className="h-4 w-full mb-2" />
    <Skeleton className="h-4 w-[80%]" />
  </CardContent>
</Card>

// Loading spinner
<div className="flex items-center justify-center h-64">
  <Loader2 className="h-8 w-8 animate-spin text-primary" />
  <span className="ml-2">Loading tickets...</span>
</div>
```

### Empty States

```typescript
// Empty state component
<div className="flex flex-col items-center justify-center h-64 text-center">
  <FileText className="h-16 w-16 text-gray-400 mb-4" />
  <h3 className="text-lg font-semibold mb-2">No tickets found</h3>
  <p className="text-gray-600 mb-4">
    Try adjusting your filters or create a new ticket
  </p>
  <Button>Create New Ticket</Button>
</div>
```

## Testing Strategy

### Unit Tests

```typescript
// __tests__/components/TicketTable.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { TicketTable } from '@/components/silpana/admin/tickets/TicketTable';

describe('TicketTable', () => {
  const mockTickets = [
    {
      id: '1',
      ticket_code: 'SPL251008001',
      nama_pengaduan: 'John Doe',
      ticket_status: 'submitted',
      // ... other fields
    }
  ];
  
  it('renders ticket list correctly', () => {
    render(<TicketTable tickets={mockTickets} />);
    expect(screen.getByText('SPL251008001')).toBeInTheDocument();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
  
  it('handles status update', async () => {
    const onStatusUpdate = jest.fn();
    render(<TicketTable tickets={mockTickets} onStatusUpdate={onStatusUpdate} />);
    
    const statusButton = screen.getByRole('button', { name: /change status/i });
    fireEvent.click(statusButton);
    
    const resolvedOption = screen.getByText('Resolved');
    fireEvent.click(resolvedOption);
    
    expect(onStatusUpdate).toHaveBeenCalledWith('1', 'resolved');
  });
});
```

### Integration Tests

```typescript
// __tests__/pages/tickets/[id].test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import TicketDetailPage from '@/app/(protected)/silpana/tickets/[id]/page';

const server = setupServer(
  rest.get('/api/v1/silpana/tickets/:id', (req, res, ctx) => {
    return res(ctx.json({
      id: req.params.id,
      ticket_code: 'SPL251008001',
      // ... mock data
    }));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('TicketDetailPage', () => {
  it('loads and displays ticket details', async () => {
    render(<TicketDetailPage params={{ id: '1' }} />);
    
    await waitFor(() => {
      expect(screen.getByText('SPL251008001')).toBeInTheDocument();
    });
  });
});
```

### E2E Tests (Playwright)

```typescript
// e2e/admin-tickets.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Admin Ticket Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('[name="email"]', 'admin@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });
  
  test('can update ticket status', async ({ page }) => {
    await page.goto('/silpana/tickets');
    
    // Find first ticket
    await page.click('table tbody tr:first-child');
    
    // Change status
    await page.click('[data-testid="status-dropdown"]');
    await page.click('text=Resolved');
    
    // Confirm
    await page.click('button:has-text("Confirm")');
    
    // Verify success
    await expect(page.locator('.toast')).toContainText('Status updated');
  });
});
```

## Deployment Checklist

### Pre-deployment

- [ ] All TypeScript errors resolved
- [ ] All tests passing (unit + integration)
- [ ] No console errors/warnings
- [ ] Performance audit passed (Lighthouse score >90)
- [ ] Accessibility audit passed (WCAG AA)
- [ ] Security audit completed
- [ ] Database migrations tested
- [ ] RLS policies verified
- [ ] Environment variables configured
- [ ] Error tracking setup (Sentry)
- [ ] Analytics setup (PostHog/Mixpanel)

### Deployment Steps

#### 1. Database Migration

```bash
# Apply migrations
cd backend
go run cmd/migration/main.go up

# Verify
psql $DATABASE_URL -c "SELECT * FROM silpana LIMIT 1;"
```

#### 2. Build Frontend

```powershell
cd frontend
pnpm build
pnpm test:performance
```

#### 3. Deploy Backend

```powershell
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
# Deploy to server
```

#### 4. Deploy Frontend

```powershell
cd frontend
pnpm build
# Deploy static build to CDN
```

#### 5. Post-deployment Verification

```bash
# Health checks
curl https://api.yourdomain.com/health
curl https://api.yourdomain.com/api/v1/silpana/health

# Smoke tests
npm run test:e2e:production
```

### Rollback Plan

1. Revert database migrations
2. Restore previous frontend deployment
3. Clear CDN cache
4. Notify users of issues

## Maintenance & Support

### Monitoring

**Key Metrics**:

- API response time (<200ms p95)
- Error rate (<0.1%)
- Active users (real-time)
- Ticket processing rate
- Database query performance
- Cache hit ratio (>85%)

**Alerting**:

- Critical: System down
- High: Error rate >1%
- Medium: Slow response time
- Low: High ticket volume

### Documentation

**User Documentation**:

- Admin guide (Indonesian)
- FAQ section
- Video tutorials
- Troubleshooting guide

**Developer Documentation**:

- API documentation (OpenAPI/Swagger)
- Component documentation (Storybook)
- Database schema documentation
- Architecture decision records (ADRs)

## Success Metrics

### User Metrics

- Admin user adoption rate >80%
- Average time to resolve ticket <24 hours
- User satisfaction score >4.5/5
- Ticket submission accuracy >95%

### Technical Metrics

- Page load time <2 seconds
- Time to interactive <3 seconds
- Bundle size <500KB (gzipped)
- API response time <200ms p95
- Uptime >99.9%

### Business Metrics

- Ticket processing volume increase >30%
- Resolution time reduction >40%
- Admin efficiency improvement >50%
- Cost per ticket reduction >25%

## Next Steps

1. **Review this document** with the development team
2. **Prioritize features** based on business needs
3. **Set up development environment** with proper tools
4. **Create task board** (Jira/GitHub Projects) with tickets
5. **Start Phase 1** implementation
6. **Daily standup** to track progress
7. **Weekly demo** to stakeholders
8. **Iterate** based on feedback

## References

- [SILPANA Architecture Analysis](../SILPANA-ARCHITECTURE-ANALYSIS.md)
- [Phase 4 Launch Summary](../PHASE4-LAUNCH-SUMMARY.md)
- [Day 4 Completion Report](../bydate/2025-10-06/2025-10-06-DAY4-COMPLETION-REPORT.md)
- [Next.js 15 Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [Flowbite Components](https://flowbite.com)

---

**Last Updated**: 2025-10-08
**Author**: Development Team
**Status**: Ready for Implementation
**Estimated Timeline**: 10 working days
