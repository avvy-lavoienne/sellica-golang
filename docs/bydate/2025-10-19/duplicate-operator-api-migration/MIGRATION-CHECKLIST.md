# DUPLICATE OPERATOR API MIGRATION CHECKLIST

**Document**: Duplicate Operator - Complete Migration Checklist
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: 📝 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team, Project Managers
**Type**: Implementation Checklist

---

## 📋 Overview

This comprehensive checklist tracks the migration of the Duplicate Operator module from direct Supabase calls to Go backend with Supabase integration. Follow each section sequentially and mark items as complete.

**Total Tasks**: 78
**Estimated Duration**: 15-20 hours
**Team Size**: 2-3 developers

---

## PHASE 1: PLANNING & SETUP

### 1.1 Environment & Preparation
- [ ] **1.1.1** Review analysis document: `01-ANALYSIS.md`
- [ ] **1.1.2** Review Go migration reference: `/docs/bydate/2025-10-19/component-api-migration/`
- [ ] **1.1.3** Set up local development environment (Go, Node.js, Docker)
- [ ] **1.1.4** Create feature branch: `feat/duplicate-operator-go-migration`
- [ ] **1.1.5** Update `.gitignore` for build artifacts
- [ ] **1.1.6** Document baseline performance metrics

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 1.2 Backend Project Structure
- [ ] **1.2.1** Create directory: `backend/internal/services/duplicate_operator/`
- [ ] **1.2.2** Create directory: `backend/internal/api/handlers/` (if needed)
- [ ] **1.2.3** Create directory: `backend/test/integration/duplicate_operator/`
- [ ] **1.2.4** Create directory: `backend/test/unit/services/duplicate_operator/`
- [ ] **1.2.5** Create initial file structure with stubs

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 1.3 Frontend Project Structure
- [ ] **1.3.1** Create file: `frontend/src/lib/api/endpoints/duplicate-operator.ts`
- [ ] **1.3.2** Create file: `frontend/src/hooks/useDuplicateOperator.ts`
- [ ] **1.3.3** Create file: `frontend/src/lib/api/types/duplicate-operator.ts`
- [ ] **1.3.4** Update frontend type imports to use new location
- [ ] **1.3.5** Create test file: `frontend/src/__tests__/api/duplicate-operator.test.ts`

**Progress**: ___/5 | **Status**: 🚫 Not Started

---

## PHASE 2: BACKEND SERVICE IMPLEMENTATION

### 2.1 Data Models & Types

#### 2.1.1 Go Request/Response Types
- [ ] **2.1.1.1** Create `backend/internal/services/duplicate_operator/types.go`
  - [ ] Define `CreateDuplicateOperatorRequest`
  - [ ] Define `UpdateDuplicateOperatorRequest`
  - [ ] Define `DuplicateOperatorResponse`
  - [ ] Define `ListDuplicateOperatorResponse`
  - [ ] Define `PaginationMeta`
  - [ ] Define `ErrorResponse`
- [ ] **2.1.1.2** Add field validation tags (JSON, binding, validate)
- [ ] **2.1.1.3** Add JSON marshaling tests

**Progress**: ___/3 | **Status**: 🚫 Not Started

#### 2.1.2 Database Adapter Interface
- [ ] **2.1.2.1** Create `backend/internal/services/duplicate_operator/database_adapter.go`
- [ ] **2.1.2.2** Define `DatabaseAdapter` interface:
  - [ ] `GetRecordByID(ctx, id) (*DuplicateOperatorData, error)`
  - [ ] `ListRecords(ctx, filters, page, pageSize) ([]*DuplicateOperatorData, int64, error)`
  - [ ] `CreateRecord(ctx, data) (*DuplicateOperatorData, error)`
  - [ ] `UpdateRecord(ctx, id, data) (*DuplicateOperatorData, error)`
  - [ ] `DeleteRecord(ctx, id) error`
  - [ ] `SearchRecords(ctx, query, filters) ([]*DuplicateOperatorData, error)`
- [ ] **2.1.2.3** Add documentation for each interface method

**Progress**: ___/3 | **Status**: 🚫 Not Started

#### 2.1.3 Supabase Implementation
- [ ] **2.1.3.1** Create `backend/internal/services/duplicate_operator/supabase_adapter.go`
- [ ] **2.1.3.2** Implement `GetRecordByID()` method
  - [ ] Query by UUID
  - [ ] Handle not found errors
  - [ ] Map database row to struct
- [ ] **2.1.3.3** Implement `ListRecords()` method
  - [ ] Calculate offset from page/pageSize
  - [ ] Build dynamic query with filters
  - [ ] Apply sorting (default: created_at DESC)
  - [ ] Handle pagination with count
  - [ ] Return total count
- [ ] **2.1.3.4** Implement `CreateRecord()` method
  - [ ] Validate required fields
  - [ ] Insert row with defaults
  - [ ] Return created record with ID
  - [ ] Handle constraint violations
- [ ] **2.1.3.5** Implement `UpdateRecord()` method
  - [ ] Check record exists first
  - [ ] Update only provided fields
  - [ ] Update `updated_at` timestamp
  - [ ] Return updated record
- [ ] **2.1.3.6** Implement `DeleteRecord()` method
  - [ ] Soft delete or hard delete (decision needed)
  - [ ] Check permissions before delete
  - [ ] Log deletion
- [ ] **2.1.3.7** Implement `SearchRecords()` method
  - [ ] Support full-text search on name fields
  - [ ] Support NIK search
  - [ ] Support date range filters
  - [ ] Support status filters

**Progress**: ___/7 | **Status**: 🚫 Not Started

### 2.2 Service Layer

#### 2.2.1 Service Interface
- [ ] **2.2.1.1** Create `backend/internal/services/duplicate_operator/service.go`
- [ ] **2.2.1.2** Define `DuplicateOperatorService` interface:
  - [ ] `Initialize(ctx) error`
  - [ ] `GetRecord(ctx, id) (*DuplicateOperatorResponse, error)`
  - [ ] `ListRecords(ctx, filters, page, pageSize) (*ListResponse, error)`
  - [ ] `CreateRecord(ctx, data) (*DuplicateOperatorResponse, error)`
  - [ ] `UpdateRecord(ctx, id, data) (*DuplicateOperatorResponse, error)`
  - [ ] `DeleteRecord(ctx, id) error`
  - [ ] `SearchRecords(ctx, query) (*ListResponse, error)`
- [ ] **2.2.1.3** Add proper documentation

**Progress**: ___/3 | **Status**: 🚫 Not Started

#### 2.2.2 Service Implementation
- [ ] **2.2.2.1** Create `backend/internal/services/duplicate_operator/impl.go`
- [ ] **2.2.2.2** Implement `NewDuplicateOperatorService()` factory
  - [ ] Accept database adapter
  - [ ] Accept cache adapter (optional)
  - [ ] Accept auth service
  - [ ] Accept monitoring service
  - [ ] Return service instance
- [ ] **2.2.2.3** Implement `GetRecord()` with:
  - [ ] Cache lookup (if cache available)
  - [ ] Database query
  - [ ] Cache set on miss
  - [ ] Permission check
  - [ ] Proper error handling
- [ ] **2.2.2.4** Implement `ListRecords()` with:
  - [ ] Input validation
  - [ ] Cache lookup with filters
  - [ ] Database query with sorting
  - [ ] Cache set on miss
  - [ ] Response formatting with pagination
- [ ] **2.2.2.5** Implement `CreateRecord()` with:
  - [ ] Input validation (all required fields)
  - [ ] NIK format validation (16 digits)
  - [ ] Date format validation
  - [ ] User ID capture
  - [ ] Database insert
  - [ ] Cache invalidation
  - [ ] Audit logging
- [ ] **2.2.2.6** Implement `UpdateRecord()` with:
  - [ ] Permission check (admin/superuser only)
  - [ ] Input validation (partial update)
  - [ ] Record existence check
  - [ ] Database update
  - [ ] Cache invalidation
  - [ ] Audit logging
- [ ] **2.2.2.7** Implement `DeleteRecord()` with:
  - [ ] Permission check
  - [ ] Record existence check
  - [ ] Database delete
  - [ ] Cache invalidation
  - [ ] Audit logging
- [ ] **2.2.2.8** Implement `SearchRecords()` with:
  - [ ] Full-text search logic
  - [ ] Filter building
  - [ ] Result formatting

**Progress**: ___/8 | **Status**: 🚫 Not Started

### 2.3 Validation Layer

#### 2.3.1 Input Validation
- [ ] **2.3.1.1** Create `backend/internal/services/duplicate_operator/validator.go`
- [ ] **2.3.1.2** Implement `ValidateCreateRequest()`:
  - [ ] Check all required fields present
  - [ ] Validate NIK format (16 digits, numeric only)
  - [ ] Validate names (non-empty, max length 255)
  - [ ] Validate date formats (YYYY-MM-DD or null)
  - [ ] Validate date logic (perekaman <= estimasi_perekaman)
  - [ ] Return detailed field errors
- [ ] **2.3.1.3** Implement `ValidateUpdateRequest()`:
  - [ ] Allow partial updates
  - [ ] Validate provided fields only
  - [ ] Same validation rules as create
- [ ] **2.3.1.4** Implement `ValidateBulkOperation()` (if needed)

**Progress**: ___/4 | **Status**: 🚫 Not Started

### 2.4 HTTP Handlers

#### 2.4.1 Handler Setup
- [ ] **2.4.1.1** Create `backend/internal/api/handlers/duplicate_operator_handler.go`
- [ ] **2.4.1.2** Define `DuplicateOperatorHandler` struct:
  - [ ] service field
  - [ ] auth service field
  - [ ] logger field
  - [ ] monitoring field
- [ ] **2.4.1.3** Create `NewDuplicateOperatorHandler()` factory

**Progress**: ___/3 | **Status**: 🚫 Not Started

#### 2.4.2 Handler Methods
- [ ] **2.4.2.1** Implement `ListRecords()` handler:
  - [ ] Parse query params (page, page_size, search, filter)
  - [ ] Call service method
  - [ ] Return JSON response with pagination
  - [ ] Error handling
- [ ] **2.4.2.2** Implement `GetRecord()` handler:
  - [ ] Parse URI param (id)
  - [ ] Call service method
  - [ ] Return JSON response
  - [ ] Handle 404 cases
- [ ] **2.4.2.3** Implement `CreateRecord()` handler:
  - [ ] Parse JSON body
  - [ ] Validate schema
  - [ ] Call service method
  - [ ] Return 201 Created
  - [ ] Include created record in response
- [ ] **2.4.2.4** Implement `UpdateRecord()` handler:
  - [ ] Parse URI param (id)
  - [ ] Parse JSON body
  - [ ] Validate schema
  - [ ] Call service method
  - [ ] Return updated record
  - [ ] Handle 404/409 cases
- [ ] **2.4.2.5** Implement `DeleteRecord()` handler:
  - [ ] Parse URI param (id)
  - [ ] Call service method
  - [ ] Return 204 No Content
  - [ ] Handle 404 cases
- [ ] **2.4.2.6** Implement `SearchRecords()` handler:
  - [ ] Parse query params (q, type)
  - [ ] Call service method
  - [ ] Return results with highlighting (if supported)

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 2.5 Middleware & Utilities

#### 2.5.1 Authorization Middleware
- [ ] **2.5.1.1** Create middleware: `backend/internal/middleware/duplicate_operator_auth.go`
- [ ] **2.5.1.2** Check user is authenticated
- [ ] **2.5.1.3** Check user role for write operations
- [ ] **2.5.1.4** Inject user ID into context
- [ ] **2.5.1.5** Return proper error responses

**Progress**: ___/5 | **Status**: 🚫 Not Started

#### 2.5.2 Error Response Formatter
- [ ] **2.5.2.1** Update error handler to use consistent format
- [ ] **2.5.2.2** Map Go errors to HTTP status codes
- [ ] **2.5.2.3** Include validation errors in response
- [ ] **2.5.2.4** Log errors with context

**Progress**: ___/4 | **Status**: 🚫 Not Started

### 2.6 Route Registration

#### 2.6.1 Add Routes to Main Router
- [ ] **2.6.1.1** Update `backend/internal/api/routes/routes.go`
- [ ] **2.6.1.2** Register handler: `GET /api/v1/duplicate-operator`
- [ ] **2.6.1.3** Register handler: `GET /api/v1/duplicate-operator/:id`
- [ ] **2.6.1.4** Register handler: `POST /api/v1/duplicate-operator`
- [ ] **2.6.1.5** Register handler: `PUT /api/v1/duplicate-operator/:id`
- [ ] **2.6.1.6** Register handler: `DELETE /api/v1/duplicate-operator/:id`
- [ ] **2.6.1.7** Apply auth middleware to all routes

**Progress**: ___/7 | **Status**: 🚫 Not Started

### 2.7 Service Integration

#### 2.7.1 Service Initialization
- [ ] **2.7.1.1** Update `backend/cmd/server/main.go` (initializeServices)
- [ ] **2.7.1.2** Create DuplicateOperatorService instance
- [ ] **2.7.1.3** Inject dependencies (database, cache, auth)
- [ ] **2.7.1.4** Add to services map/struct
- [ ] **2.7.1.5** Call Initialize() method
- [ ] **2.7.1.6** Handle initialization errors

**Progress**: ___/6 | **Status**: 🚫 Not Started

#### 2.7.2 Handler Registration
- [ ] **2.7.2.1** Update `backend/internal/api/routes/routes.go` (GetServices)
- [ ] **2.7.2.2** Create handler instance with service
- [ ] **2.7.2.3** Pass to route setup function

**Progress**: ___/3 | **Status**: 🚫 Not Started

---

## PHASE 3: BACKEND TESTING

### 3.1 Unit Tests

#### 3.1.1 Service Tests
- [ ] **3.1.1.1** Create `backend/test/unit/services/duplicate_operator/service_test.go`
- [ ] **3.1.1.2** Test `GetRecord()`:
  - [ ] Happy path: record exists
  - [ ] Error path: record not found
  - [ ] Error path: invalid UUID
  - [ ] Test cache hit/miss
- [ ] **3.1.1.3** Test `ListRecords()`:
  - [ ] Happy path: multiple records
  - [ ] Empty list
  - [ ] Pagination works correctly
  - [ ] Filters applied correctly
  - [ ] Sorting works
- [ ] **3.1.1.4** Test `CreateRecord()`:
  - [ ] Happy path: valid data
  - [ ] Error path: missing required fields
  - [ ] Error path: invalid NIK format
  - [ ] Error path: invalid dates
  - [ ] Cache invalidation
  - [ ] Audit log created
- [ ] **3.1.1.5** Test `UpdateRecord()`:
  - [ ] Happy path: valid update
  - [ ] Error path: record not found
  - [ ] Error path: invalid update data
  - [ ] Partial update works
  - [ ] Permission check enforced
- [ ] **3.1.1.6** Test `DeleteRecord()`:
  - [ ] Happy path: record deleted
  - [ ] Error path: record not found
  - [ ] Permission check enforced
  - [ ] Cache invalidation
  - [ ] Audit log created

**Progress**: ___/6 | **Status**: 🚫 Not Started

#### 3.1.2 Validation Tests
- [ ] **3.1.2.1** Create `backend/test/unit/services/duplicate_operator/validator_test.go`
- [ ] **3.1.2.2** Test NIK validation (16 digits)
- [ ] **3.1.2.3** Test date format validation
- [ ] **3.1.2.4** Test required field validation
- [ ] **3.1.2.5** Test date logic validation

**Progress**: ___/5 | **Status**: 🚫 Not Started

#### 3.1.3 Handler Tests
- [ ] **3.1.3.1** Create `backend/test/unit/api/handlers/duplicate_operator_handler_test.go`
- [ ] **3.1.3.2** Test ListRecords handler:
  - [ ] Happy path: return list
  - [ ] Query params parsing
  - [ ] Pagination metadata
  - [ ] Error responses
- [ ] **3.1.3.3** Test CreateRecord handler:
  - [ ] Happy path: 201 response
  - [ ] Validation errors: 400 response
  - [ ] Auth errors: 401 response
  - [ ] Permission errors: 403 response
- [ ] **3.1.3.4** Test UpdateRecord handler:
  - [ ] Happy path: 200 response
  - [ ] Not found: 404 response
  - [ ] Permission errors: 403 response
- [ ] **3.1.3.5** Test DeleteRecord handler:
  - [ ] Happy path: 204 response
  - [ ] Not found: 404 response
  - [ ] Permission errors: 403 response

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 3.2 Integration Tests

#### 3.2.1 Database Integration
- [ ] **3.2.1.1** Create `backend/test/integration/duplicate_operator/db_test.go`
- [ ] **3.2.1.2** Test with real Supabase instance (test DB)
- [ ] **3.2.1.3** Test end-to-end CRUD operations
- [ ] **3.2.1.4** Test RLS policy compliance
- [ ] **3.2.1.5** Test transaction rollback on errors
- [ ] **3.2.1.6** Clean up test data after tests

**Progress**: ___/6 | **Status**: 🚫 Not Started

#### 3.2.2 API Endpoint Tests
- [ ] **3.2.2.1** Create `backend/test/integration/duplicate_operator/api_test.go`
- [ ] **3.2.2.2** Test GET /api/v1/duplicate-operator:
  - [ ] Returns 200 with records
  - [ ] Pagination works
  - [ ] Filters work
  - [ ] Search works
- [ ] **3.2.2.3** Test POST /api/v1/duplicate-operator:
  - [ ] Creates record (201)
  - [ ] Validates input (400)
  - [ ] Requires auth (401)
- [ ] **3.2.2.4** Test PUT /api/v1/duplicate-operator/:id:
  - [ ] Updates record (200)
  - [ ] Checks permissions (403)
  - [ ] Returns 404 if not found
- [ ] **3.2.2.5** Test DELETE /api/v1/duplicate-operator/:id:
  - [ ] Deletes record (204)
  - [ ] Checks permissions (403)
  - [ ] Returns 404 if not found

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 3.3 Performance Tests

#### 3.3.1 Load Testing
- [ ] **3.3.1.1** Create `backend/test/performance/duplicate_operator_bench_test.go`
- [ ] **3.3.1.2** Benchmark ListRecords with 1000+ records
- [ ] **3.3.1.3** Benchmark GetRecord (cache hit)
- [ ] **3.3.1.4** Benchmark GetRecord (cache miss)
- [ ] **3.3.1.5** Benchmark CreateRecord with validation
- [ ] **3.3.1.6** Run benchmarks and document results
- [ ] **3.3.1.7** Target: <100ms for all operations

**Progress**: ___/7 | **Status**: 🚫 Not Started

### 3.4 Run Tests & Fix Issues

- [ ] **3.4.1** Run all unit tests: `cd backend && go test ./...`
- [ ] **3.4.2** Run integration tests with test DB
- [ ] **3.4.3** Fix any failing tests
- [ ] **3.4.4** Achieve >90% code coverage
- [ ] **3.4.5** Run benchmarks and document baseline
- [ ] **3.4.6** Address any performance regressions

**Progress**: ___/6 | **Status**: 🚫 Not Started

---

## PHASE 4: FRONTEND API CLIENT

### 4.1 Type Definitions

#### 4.1.1 Create API Types
- [ ] **4.1.1.1** Create `frontend/src/lib/api/types/duplicate-operator.ts`
- [ ] **4.1.1.2** Define request types:
  - [ ] `CreateDuplicateOperatorRequest`
  - [ ] `UpdateDuplicateOperatorRequest`
  - [ ] Validation + JSDoc comments
- [ ] **4.1.1.3** Define response types:
  - [ ] `DuplicateOperatorResponse`
  - [ ] `DuplicateOperatorListResponse`
  - [ ] `PaginationMeta`
  - [ ] Full TypeScript documentation
- [ ] **4.1.1.4** Define error types:
  - [ ] `DuplicateOperatorError`
  - [ ] `ValidationError`
  - [ ] `FieldError`

**Progress**: ___/4 | **Status**: 🚫 Not Started

### 4.2 API Client

#### 4.2.1 Endpoint Functions
- [ ] **4.2.1.1** Create `frontend/src/lib/api/endpoints/duplicate-operator.ts`
- [ ] **4.2.1.2** Implement `fetchDuplicateOperators()`:
  - [ ] Parameters: page, pageSize, search, filter
  - [ ] Returns: Promise<DuplicateOperatorListResponse>
  - [ ] Error handling + logging
  - [ ] Timeout handling
- [ ] **4.2.1.3** Implement `fetchDuplicateOperatorById()`:
  - [ ] Parameter: id
  - [ ] Returns: Promise<DuplicateOperatorResponse>
  - [ ] 404 handling
- [ ] **4.2.1.4** Implement `createDuplicateOperator()`:
  - [ ] Parameter: data
  - [ ] Returns: Promise<DuplicateOperatorResponse>
  - [ ] Validation error handling
  - [ ] 401/403 handling
- [ ] **4.2.1.5** Implement `updateDuplicateOperator()`:
  - [ ] Parameters: id, data
  - [ ] Returns: Promise<DuplicateOperatorResponse>
  - [ ] Conflict handling
  - [ ] Permission checking
- [ ] **4.2.1.6** Implement `deleteDuplicateOperator()`:
  - [ ] Parameter: id
  - [ ] Returns: Promise<void>
  - [ ] 404 handling
- [ ] **4.2.1.7** Implement `searchDuplicateOperators()`:
  - [ ] Parameter: query
  - [ ] Returns: Promise<DuplicateOperatorResponse[]>

**Progress**: ___/7 | **Status**: 🚫 Not Started

### 4.3 React Hooks

#### 4.3.1 Custom Hooks
- [ ] **4.3.1.1** Create `frontend/src/hooks/useDuplicateOperator.ts`
- [ ] **4.3.1.2** Implement `useDuplicateOperators()`:
  - [ ] Parameters: page, pageSize, search, filter
  - [ ] Returns: data, loading, error, refetch
  - [ ] Auto-fetch on mount
  - [ ] Refetch on parameter change
  - [ ] Debounce search
- [ ] **4.3.1.3** Implement `useDuplicateOperatorById()`:
  - [ ] Parameter: id
  - [ ] Returns: data, loading, error
  - [ ] Cache results
- [ ] **4.3.1.4** Implement `useCreateDuplicateOperator()`:
  - [ ] Returns: mutate, loading, error
  - [ ] Optimistic updates (if desired)
  - [ ] Error boundary support
- [ ] **4.3.1.5** Implement `useUpdateDuplicateOperator()`:
  - [ ] Returns: mutate, loading, error
  - [ ] Auto-refetch on success
- [ ] **4.3.1.6** Implement `useDeleteDuplicateOperator()`:
  - [ ] Returns: mutate, loading, error
  - [ ] Confirmation handling

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 4.4 Error Handling

#### 4.4.1 Error Mapping
- [ ] **4.4.1.1** Create `frontend/src/lib/api/error-handler.ts`
- [ ] **4.4.1.2** Map HTTP status codes to user messages:
  - [ ] 400: "Data tidak valid. Periksa kembali form Anda."
  - [ ] 401: "Sesi Anda telah berakhir. Silakan login kembali."
  - [ ] 403: "Anda tidak memiliki izin untuk aksi ini."
  - [ ] 404: "Data tidak ditemukan."
  - [ ] 409: "Data sudah diubah oleh pengguna lain. Silakan muat ulang."
  - [ ] 500: "Terjadi kesalahan server. Silakan coba lagi."
- [ ] **4.4.1.3** Extract validation errors for form display
- [ ] **4.4.1.4** Log errors for debugging

**Progress**: ___/4 | **Status**: 🚫 Not Started

---

## PHASE 5: FRONTEND COMPONENT MIGRATION

### 5.1 Page Component

#### 5.1.1 Update page.tsx
- [ ] **5.1.1.1** Replace Supabase import with API client import
- [ ] **5.1.1.2** Replace manual Supabase calls with hooks:
  - [ ] Use `useDuplicateOperators()` for list fetch
  - [ ] Use `useCreateDuplicateOperator()` for create
  - [ ] Use `useUpdateDuplicateOperator()` for update
  - [ ] Use `useDeleteDuplicateOperator()` for delete
- [ ] **5.1.1.3** Update error handling to use new error messages
- [ ] **5.1.1.4** Keep auth check (auth still from Supabase)
- [ ] **5.1.1.5** Update loading states (use hook loading)
- [ ] **5.1.1.6** Test in browser

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 5.2 DuplicateOperatorForm Component

#### 5.2.1 Update Form Component
- [ ] **5.2.1.1** Replace Supabase calls with hook calls
- [ ] **5.2.1.2** Update form submission:
  - [ ] Call `useCreateDuplicateOperator()` or `useUpdateDuplicateOperator()`
  - [ ] Use returned mutate function
  - [ ] Handle loading state from hook
- [ ] **5.2.1.3** Update error display:
  - [ ] Show validation errors from API
  - [ ] Map to form fields
- [ ] **5.2.1.4** Update success handling:
  - [ ] Show success toast
  - [ ] Trigger parent refetch
  - [ ] Reset form
- [ ] **5.2.1.5** Test form submission in browser

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 5.3 DuplicateOperatorTable Component

#### 5.3.1 Update Table Component
- [ ] **5.3.1.1** Replace Supabase list call with hook:
  - [ ] Use `useDuplicateOperators()`
  - [ ] Update pagination handlers
  - [ ] Update search handlers
- [ ] **5.3.1.2** Update status toggle:
  - [ ] Call `useUpdateDuplicateOperator()`
  - [ ] Show loading state during update
- [ ] **5.3.1.3** Update date field edits:
  - [ ] Call `useUpdateDuplicateOperator()`
  - [ ] Show loading state during save
- [ ] **5.3.1.4** Update delete handler:
  - [ ] Call `useDeleteDuplicateOperator()`
  - [ ] Show confirmation
  - [ ] Handle deletion errors
- [ ] **5.3.1.5** Update search/filter:
  - [ ] Debounce search input
  - [ ] Pass to hook parameters
  - [ ] Clear filters button
- [ ] **5.3.1.6** Test all interactions in browser

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 5.4 Component Testing

#### 5.4.1 Component Tests
- [ ] **5.4.1.1** Create `frontend/src/__tests__/components/duplicate-operator-page.test.tsx`
- [ ] **5.4.1.2** Test page component:
  - [ ] Renders without crashing
  - [ ] Loads data on mount
  - [ ] Handles errors gracefully
- [ ] **5.4.1.3** Create `frontend/src/__tests__/components/duplicate-operator-form.test.tsx`
- [ ] **5.4.1.4** Test form component:
  - [ ] Form submission works
  - [ ] Validation errors display
  - [ ] Success toast shows
- [ ] **5.4.1.5** Create `frontend/src/__tests__/components/duplicate-operator-table.test.tsx`
- [ ] **5.4.1.6** Test table component:
  - [ ] Table renders
  - [ ] Pagination works
  - [ ] Search works
  - [ ] Delete works

**Progress**: ___/6 | **Status**: 🚫 Not Started

---

## PHASE 6: INTEGRATION & TESTING

### 6.1 End-to-End Testing

#### 6.1.1 Manual Testing
- [ ] **6.1.1.1** Start backend: `cd backend && go run cmd/server/main.go`
- [ ] **6.1.1.2** Start frontend: `cd frontend && pnpm dev`
- [ ] **6.1.1.3** Test complete flow:
  - [ ] Load page (check loading state)
  - [ ] See initial data (from backend)
  - [ ] Create new record (validate on backend)
  - [ ] View created record in list
  - [ ] Edit record (update on backend)
  - [ ] Toggle status (see update reflected)
  - [ ] Search functionality
  - [ ] Pagination
  - [ ] Delete record (confirm dialog)
- [ ] **6.1.1.4** Test error scenarios:
  - [ ] Network error (show error state)
  - [ ] Validation error (show form errors)
  - [ ] Permission error (403)
  - [ ] Not found (404)
  - [ ] Session expired (redirect to login)
- [ ] **6.1.1.5** Check browser console (no errors)
- [ ] **6.1.1.6** Check browser network tab (correct endpoints)

**Progress**: ___/6 | **Status**: 🚫 Not Started

#### 6.1.2 Automated Integration Tests
- [ ] **6.1.2.1** Create `frontend/src/__tests__/integration/duplicate-operator-e2e.test.ts`
- [ ] **6.1.2.2** Test end-to-end flow (if using Cypress/Playwright)
- [ ] **6.1.2.3** Record UI interactions
- [ ] **6.1.2.4** Verify API calls
- [ ] **6.1.2.5** Check response data

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 6.2 Data Validation

#### 6.2.1 Verify Data Integrity
- [ ] **6.2.1.1** Check all records visible in both frontend and Supabase
- [ ] **6.2.1.2** Verify no data corruption during migration
- [ ] **6.2.1.3** Check timestamps are correct
- [ ] **6.2.1.4** Verify user_id associations correct

**Progress**: ___/4 | **Status**: 🚫 Not Started

### 6.3 Performance Validation

#### 6.3.1 Performance Testing
- [ ] **6.3.1.1** Measure backend response times:
  - [ ] List (10 records): target <50ms
  - [ ] Get single: target <30ms
  - [ ] Create: target <50ms
  - [ ] Update: target <40ms
  - [ ] Delete: target <40ms
- [ ] **6.3.1.2** Measure frontend request times (including network)
- [ ] **6.3.1.3** Check cache hit ratio (if Redis enabled)
- [ ] **6.3.1.4** Compare with baseline metrics
- [ ] **6.3.1.5** Document improvements

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 6.4 Load Testing

#### 6.4.1 Concurrent User Testing
- [ ] **6.4.1.1** Use load testing tool (Artillery, K6, Locust)
- [ ] **6.4.1.2** Simulate 50 concurrent users
- [ ] **6.4.1.3** Simulate 100 concurrent users
- [ ] **6.4.1.4** Monitor:
  - [ ] Response times (p50, p95, p99)
  - [ ] Error rate
  - [ ] Throughput (requests/sec)
  - [ ] Memory usage
  - [ ] CPU usage
- [ ] **6.4.1.5** Document results in performance report

**Progress**: ___/5 | **Status**: 🚫 Not Started

---

## PHASE 7: CLEANUP & OPTIMIZATION

### 7.1 Code Quality

#### 7.1.1 Backend Code Review
- [ ] **7.1.1.1** Run Go linter: `cd backend && golangci-lint run`
- [ ] **7.1.1.2** Fix all linting issues
- [ ] **7.1.1.3** Run Go vet: `go vet ./...`
- [ ] **7.1.1.4** Add comments to exported functions
- [ ] **7.1.1.5** Verify error messages are user-friendly

**Progress**: ___/5 | **Status**: 🚫 Not Started

#### 7.1.2 Frontend Code Review
- [ ] **7.1.2.1** Run ESLint: `cd frontend && pnpm lint`
- [ ] **7.1.2.2** Fix all linting issues
- [ ] **7.1.2.3** Run TypeScript check: `pnpm type-check`
- [ ] **7.1.2.4** Check for unused imports
- [ ] **7.1.2.5** Verify JSDoc comments

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 7.2 Remove Legacy Code

#### 7.2.1 Clean Up
- [ ] **7.2.1.1** Remove old Supabase direct calls from components
- [ ] **7.2.1.2** Remove duplicate code/types
- [ ] **7.2.1.3** Update old API type files if not migrated
- [ ] **7.2.1.4** Check for any remaining Next.js API routes

**Progress**: ___/4 | **Status**: 🚫 Not Started

### 7.3 Documentation

#### 7.3.1 Update Documentation
- [ ] **7.3.1.1** Update API documentation with new endpoints
- [ ] **7.3.1.2** Document request/response examples
- [ ] **7.3.1.3** Update component documentation
- [ ] **7.3.1.4** Create troubleshooting guide
- [ ] **7.3.1.5** Document performance metrics (before/after)

**Progress**: ___/5 | **Status**: 🚫 Not Started

### 7.4 Optimization

#### 7.4.1 Performance Tuning
- [ ] **7.4.1.1** Implement query result caching (if not done)
- [ ] **7.4.1.2** Add database indexes if missing
- [ ] **7.4.1.3** Optimize N+1 queries (if any)
- [ ] **7.4.1.4** Add response compression (gzip)
- [ ] **7.4.1.5** Implement request pagination defaults

**Progress**: ___/5 | **Status**: 🚫 Not Started

---

## PHASE 8: DEPLOYMENT & MONITORING

### 8.1 Pre-Deployment

#### 8.1.1 Final Checks
- [ ] **8.1.1.1** All tests passing
- [ ] **8.1.1.2** Code review completed
- [ ] **8.1.1.3** Performance targets met
- [ ] **8.1.1.4** Documentation updated
- [ ] **8.1.1.5** Staging deployment successful
- [ ] **8.1.1.6** Staging testing completed

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 8.2 Deployment

#### 8.2.1 Production Deployment
- [ ] **8.2.1.1** Merge PR to main branch
- [ ] **8.2.1.2** Deploy backend changes
- [ ] **8.2.1.3** Wait for backend health checks
- [ ] **8.2.1.4** Deploy frontend changes
- [ ] **8.2.1.5** Wait for frontend to be live
- [ ] **8.2.1.6** Run smoke tests on production

**Progress**: ___/6 | **Status**: 🚫 Not Started

### 8.3 Post-Deployment Monitoring

#### 8.3.1 Production Monitoring
- [ ] **8.3.1.1** Monitor error rates (target: <0.1%)
- [ ] **8.3.1.2** Monitor response times (target: <100ms)
- [ ] **8.3.1.3** Monitor database connections
- [ ] **8.3.1.4** Monitor cache hit ratio
- [ ] **8.3.1.5** Monitor log levels for errors
- [ ] **8.3.1.6** Set up alerts for anomalies

**Progress**: ___/6 | **Status**: 🚫 Not Started

#### 8.3.2 User Feedback
- [ ] **8.3.2.1** Collect user feedback
- [ ] **8.3.2.2** Address critical issues quickly
- [ ] **8.3.2.3** Document improvements made
- [ ] **8.3.2.4** Schedule retrospective

**Progress**: ___/4 | **Status**: 🚫 Not Started

---

## QUICK REFERENCE

### Key Commands

```powershell
# Backend
cd backend
go mod download
go run cmd/server/main.go                    # Start server
go test ./...                                 # Run all tests
go test ./... -cover                          # With coverage
go test -bench=. ./scripts/load-testing/     # Benchmarks
golangci-lint run                             # Linting

# Frontend
cd frontend
pnpm install
pnpm dev                                      # Start dev server
pnpm build                                    # Production build
pnpm test                                     # Run tests
pnpm lint                                     # Linting
pnpm type-check                               # TypeScript check
```

### Important URLs

- Backend API: `http://localhost:8080`
- Frontend: `http://localhost:3000`
- API Health: `http://localhost:8080/health`
- API Metrics: `http://localhost:8080/metrics`
- Swagger/OpenAPI: `http://localhost:8080/swagger` (if enabled)

### Important Files

**Backend**:
- `backend/internal/services/duplicate_operator/` - Service implementation
- `backend/internal/api/handlers/` - HTTP handlers
- `backend/cmd/server/main.go` - Service registration
- `backend/internal/api/routes/routes.go` - Route setup

**Frontend**:
- `frontend/src/lib/api/endpoints/duplicate-operator.ts` - API calls
- `frontend/src/hooks/useDuplicateOperator.ts` - React hooks
- `frontend/src/app/(protected)/data-rekam/duplicate-operator/page.tsx` - Main component

### Support Resources

- Analysis: `01-ANALYSIS.md`
- Reference: `/docs/bydate/2025-10-19/component-api-migration/`
- Backend patterns: `02-ENDPOINT-DESIGN.md` (create this)
- Migration guide: Reference docs for similar components

---

## SUMMARY

**Total Tasks**: 78
**Estimated Time**: 15-20 hours
**Team**: 2-3 developers
**Phases**: 8

**Key Milestones**:
1. Phase 1: ✅ Setup
2. Phase 2: ✅ Backend service (most time-intensive)
3. Phase 3: ✅ Backend tests
4. Phase 4: ✅ Frontend API client
5. Phase 5: ✅ Component migration
6. Phase 6: ✅ Integration testing
7. Phase 7: ✅ Cleanup
8. Phase 8: ✅ Deployment

---

## NOTES

- Started: _____________
- Completed: _____________
- Issues encountered: ____________________________________________________
- Improvements made: ____________________________________________________
- Performance improvement: _______________________________________________
- Team feedback: ____________________________________________________
