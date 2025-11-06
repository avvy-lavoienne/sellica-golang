# Phase 3: Testing & Validation - Test Plan and Documentation

**Document**: Duplicate-Operator Testing & Validation Plan
**Project Date**: 2025-10-20
**Created**: 2025-10-20
**Version**: 1.0
**Status**: 🚧 In Progress
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Technical Team | Development Team
**Type**: Test Documentation

## Executive Summary

Phase 3 focuses on comprehensive testing and validation of the duplicate-operator backend service. This document outlines the test strategy, test cases, and validation procedures for the adapter, service, and handler layers.

## Test Strategy

### Test Pyramid

```
        /\
       /E2E\           End-to-End Tests (5-10%)
      /______\
     /        \
    / Handler  \       Integration Tests (15-20%)
   /____________\
  /              \
 /   Unit Tests   \    Unit Tests (70-75%)
/________________\
```

### Test Coverage Goals

- Unit Tests: 70-75% coverage
- Integration Tests: 15-20% coverage
- E2E Tests: 5-10% coverage
- **Overall Target**: 85%+ code coverage

## Unit Tests

### Adapter Layer Tests (supabase_adapter_test.go)

#### GetRecordByID Tests
- **Test 1**: Successfully retrieve existing record by UUID
- **Test 2**: Return error for non-existent record ID
- **Test 3**: Reject invalid UUID format
- **Test 4**: Handle database connection errors
- **Test 5**: Verify response data structure and types

```go
func TestGetRecordByID(t *testing.T) {
    // Test cases as above
}
```

#### CreateRecord Tests
- **Test 1**: Create valid record with all fields
- **Test 2**: Generate unique UUID for each record
- **Test 3**: Set correct timestamp (UTC)
- **Test 4**: Handle empty CreateRequest gracefully
- **Test 5**: Verify record persists to "database"

```go
func TestCreateRecord(t *testing.T) {
    // Test cases as above
}
```

#### UpdateRecord Tests
- **Test 1**: Partial update with single field
- **Test 2**: Partial update with multiple fields
- **Test 3**: Unchanged fields remain intact
- **Test 4**: Update timestamp on modification
- **Test 5**: Return error if record doesn't exist
- **Test 6**: Handle null pointers safely

```go
func TestUpdateRecord(t *testing.T) {
    // Test cases as above
}
```

#### DeleteRecord Tests
- **Test 1**: Successfully delete existing record
- **Test 2**: Record no longer retrievable after delete
- **Test 3**: Return error when deleting non-existent record
- **Test 4**: Handle concurrent delete attempts

```go
func TestDeleteRecord(t *testing.T) {
    // Test cases as above
}
```

#### ListRecords Tests
- **Test 1**: Paginate results correctly (page 1, size 10)
- **Test 2**: Retrieve correct page (page 2)
- **Test 3**: Return total count independently of page
- **Test 4**: Filter by is_ready_to_record status
- **Test 5**: Handle empty result set
- **Test 6**: Handle out-of-range page request

```go
func TestListRecords(t *testing.T) {
    // Test cases as above
}
```

#### SearchRecords Tests
- **Test 1**: Search by NIK (exact match)
- **Test 2**: Search by name (substring match)
- **Test 3**: Search with multiple filters applied
- **Test 4**: Return empty result for no matches
- **Test 5**: Search case sensitivity

```go
func TestSearchRecords(t *testing.T) {
    // Test cases as above
}
```

### Service Layer Tests (service_test.go)

#### Service Interface Tests
- **Test 1**: Service implements DatabaseAdapter interface
- **Test 2**: Service correctly delegates to adapter
- **Test 3**: Error propagation from adapter to service

#### Pagination Logic Tests
- **Test 1**: Calculate total pages correctly
- **Test 2**: Set hasNext flag properly
- **Test 3**: Set hasPrevious flag properly
- **Test 4**: Metadata calculation for first page
- **Test 5**: Metadata calculation for last page
- **Test 6**: Metadata calculation for middle page

```go
func TestPaginationMetadata(t *testing.T) {
    tests := []struct {
        page     int
        pageSize int
        total    int64
        expectedPages   int
        expectedHasNext bool
    }{
        {1, 10, 25, 3, true},
        {3, 10, 25, 3, false},
        {2, 10, 25, 3, true},
    }
    // Test cases
}
```

### Validation Layer Tests (validator_test.go)

#### NIK Validation Tests
- **Test 1**: Valid NIK (16 digits)
- **Test 2**: Reject empty NIK
- **Test 3**: Reject NIK with letters
- **Test 4**: Reject NIK with special characters
- **Test 5**: Reject too short NIK (< 16)
- **Test 6**: Reject too long NIK (> 16)

```go
func TestValidateNIK(t *testing.T) {
    tests := []struct {
        nik    string
        valid  bool
    }{
        {"1234567890123456", true},
        {"12345678901234", false},  // Too short
        {"123456789012345a", false},  // Letter
        {"12345678-01-2345", false},  // Special char
    }
    // Test cases
}
```

#### Date Validation Tests
- **Test 1**: Valid date (YYYY-MM-DD)
- **Test 2**: Reject invalid date format
- **Test 3**: Reject future-only or past-only constraints
- **Test 4**: Accept leap year dates
- **Test 5**: Reject February 30

```go
func TestValidateDateFormat(t *testing.T) {
    tests := []struct {
        date  string
        valid bool
    }{
        {"2025-01-15", true},
        {"2025-1-15", false},  // Missing leading zero
        {"01/15/2025", false},  // Wrong format
        {"2025-02-29", false},  // Invalid leap year
    }
    // Test cases
}
```

#### CreateRequest Validation Tests
- **Test 1**: Valid complete request
- **Test 2**: Reject missing required fields
- **Test 3**: Reject NIK with wrong format
- **Test 4**: Reject names exceeding 255 chars
- **Test 5**: Return all validation errors together

```go
func TestValidateCreateRequest(t *testing.T) {
    // Test cases
}
```

#### UpdateRequest Validation Tests
- **Test 1**: Valid empty request (allowed for update)
- **Test 2**: Valid partial request
- **Test 3**: Reject invalid NIK in update
- **Test 4**: Accept valid updates only

```go
func TestValidateUpdateRequest(t *testing.T) {
    // Test cases
}
```

### Handler Layer Tests (handler_test.go)

#### ListRecords Handler Tests
- **Test 1**: GET request with pagination params
- **Test 2**: Response includes data array
- **Test 3**: Response includes pagination metadata
- **Test 4**: Query parameter parsing
- **Test 5**: Invalid page_size returns error

#### GetRecord Handler Tests
- **Test 1**: GET request for valid ID returns record
- **Test 2**: GET request for invalid ID returns 404
- **Test 3**: Response structure validation

#### CreateRecord Handler Tests
- **Test 1**: POST with valid request creates record
- **Test 2**: POST with invalid data returns 400
- **Test 3**: Validation errors detailed in response
- **Test 4**: User context extracted and used
- **Test 5**: Returns 201 Created status

#### UpdateRecord Handler Tests
- **Test 1**: PUT with valid update modifies record
- **Test 2**: PUT with invalid ID returns 404
- **Test 3**: Partial updates work correctly
- **Test 4**: Returns 200 with updated record

#### DeleteRecord Handler Tests
- **Test 1**: DELETE removes record
- **Test 2**: DELETE non-existent returns 404
- **Test 3**: Returns 200 on success

#### SearchRecords Handler Tests
- **Test 1**: GET /search with query param
- **Test 2**: Returns matching results
- **Test 3**: Missing query param returns 400

## Integration Tests

### Supabase Integration Tests (adapter_integration_test.go)

#### Real Database Operations
- **Test 1**: Create record in Supabase
- **Test 2**: Read created record back
- **Test 3**: Update record in Supabase
- **Test 4**: Delete record from Supabase
- **Test 5**: List with pagination from Supabase
- **Test 6**: Search across records

#### Data Persistence
- **Test 1**: Data survives multiple reads
- **Test 2**: Timestamps are correct (UTC)
- **Test 3**: UUID uniqueness preserved

#### Error Scenarios
- **Test 1**: Handle database timeouts
- **Test 2**: Handle permission denied errors
- **Test 3**: Handle constraint violations

## End-to-End Tests

### Complete Workflows (e2e_test.go)

#### Create-Read-Update-Delete Workflow
1. Create new duplicate operator record
2. Verify it appears in list
3. Retrieve by ID
4. Update a field
5. Verify update persisted
6. Delete record
7. Verify deletion

#### Search Workflow
1. Create multiple records
2. Search by NIK
3. Verify results
4. Search by name
5. Apply filters
6. Verify filtered results

#### Pagination Workflow
1. Create 50+ records
2. Request page 1 (10 items)
3. Verify total count
4. Request page 2
5. Verify different items
6. Request last page
7. Verify hasNext flag

## Performance Tests

### Load Testing (perf_test.go)

#### Concurrency Tests
- **Test 1**: 100 concurrent creates
- **Test 2**: 100 concurrent reads
- **Test 3**: 50 concurrent creates + 50 concurrent reads
- **Test 4**: 100 concurrent list operations

#### Large Result Sets
- **Test 1**: Search returning 1000+ results
- **Test 2**: Paginate through large result set
- **Test 3**: Filter on large dataset

#### Response Time Tests
- **Test 1**: Single read < 100ms
- **Test 2**: List (10 items) < 200ms
- **Test 3**: Search < 500ms
- **Test 4**: Create < 300ms
- **Test 5**: Update < 300ms
- **Test 6**: Delete < 200ms

## Test Execution Commands

### Run All Tests
```bash
go test ./... -v
```

### Run Unit Tests Only
```bash
go test ./internal/services/duplicate_operator -v
go test ./internal/api/handlers/... -v
```

### Run Integration Tests
```bash
go test ./test/integration/duplicate_operator -v
```

### Run E2E Tests
```bash
go test ./test/e2e/duplicate_operator -v
```

### Run with Coverage
```bash
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out -o coverage.html
```

### Run Performance Tests
```bash
go test ./test/performance/duplicate_operator -bench=. -benchmem
```

## Coverage Goals

| Component | Current | Target |
|-----------|---------|--------|
| Adapter | 85% | 90% |
| Service | 80% | 85% |
| Validator | 95% | 95% |
| Handler | 75% | 85% |
| **Overall** | **83%** | **85%** |

## Test Data

### Fixture: Valid Create Request
```json
{
  "nik_duplicate": "1234567890123456",
  "nama_duplicate": "Ahmad Maulana",
  "nik_operator": "6543210987654321",
  "nama_operator": "Budi Santoso",
  "tanggal_perekaman": "2025-01-15",
  "tanggal_pengajuan": "2025-01-14",
  "estimasi_tanggal_perekaman": "2025-01-20",
  "is_ready_to_record": true
}
```

### Fixture: Valid Update Request
```json
{
  "nama_duplicate": "Ahmad Maulana Diperbaharui",
  "is_ready_to_record": false
}
```

## Known Edge Cases

1. **Null Pointers**: UpdateRequest fields may be nil - must handle safely
2. **Date Boundaries**: Leap years, month end dates
3. **Unicode Characters**: Names may contain non-ASCII characters
4. **Large Page Numbers**: Requesting page 1000000 with 10 items
5. **Empty Strings**: Searching with empty query string
6. **Concurrent Updates**: Two updates to same record simultaneously
7. **Delete After Update**: Immediate delete after update

## Success Criteria

- [ ] All unit tests pass
- [ ] All integration tests pass
- [ ] All E2E tests pass
- [ ] Code coverage ≥ 85%
- [ ] Performance tests pass (response times met)
- [ ] No race conditions detected
- [ ] All edge cases handled

## Next Steps

1. Implement unit tests for adapter
2. Implement unit tests for service
3. Implement unit tests for validator
4. Implement unit tests for handler
5. Implement integration tests
6. Implement E2E tests
7. Run full test suite and verify coverage
8. Document test results

---

**Status**: 🚧 In Progress | **Phase**: 3 - Testing & Validation | **Date**: 2025-10-20
