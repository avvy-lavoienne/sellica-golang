# 02 - DUPLICATE OPERATOR ENDPOINT DESIGN

**Document**: Duplicate Operator API - Endpoint Specifications & Design
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Backend Engineers, API Architects
**Type**: API Specification

---

## Executive Summary

This document specifies all REST API endpoints for the Duplicate Operator module. Includes request/response formats, query parameters, error handling, and implementation details following the Go backend architecture.

---

## Base URL & Versioning

```
Base URL: http://localhost:8080
API Version: v1
Full Prefix: /api/v1/duplicate-operator
```

---

## Authentication & Authorization

### Authentication
- **Method**: Bearer Token (JWT)
- **Header**: `Authorization: Bearer {token}`
- **Source**: Supabase JWT from session
- **Validation**: Done in backend middleware

### Authorization
| Operation | Required Role | Action |
|-----------|---------------|--------|
| **GET (list)** | Any authenticated | View own/all records |
| **GET (single)** | Any authenticated | View own/specific record |
| **POST (create)** | operator, admin, superuser | Create new record |
| **PUT (update)** | admin, superuser | Modify record |
| **DELETE** | admin, superuser | Remove record |

---

## Endpoint Specifications

### 1. LIST DUPLICATE OPERATORS

**Endpoint**: `GET /api/v1/duplicate-operator`

**Purpose**: Fetch paginated list of duplicate operator records with optional filtering and searching

#### Request

**Query Parameters**:
```
page                    (optional) integer, default: 1
                       Minimum: 1
                       Description: Page number for pagination

page_size              (optional) integer, default: 10, max: 100
                       Minimum: 1, Maximum: 100
                       Description: Records per page

search                 (optional) string, max length: 255
                       Description: Search across nik_duplicate, nama_duplicate,
                                   nik_operator, nama_operator

status                 (optional) enum: "all", "completed", "pending"
                       Default: "all"
                       Description: Filter by is_ready_to_record status

sort_by                (optional) enum: "created_at", "tanggal_perekaman"
                       Default: "created_at"
                       Description: Sort field

sort_order             (optional) enum: "asc", "desc"
                       Default: "desc"
                       Description: Sort direction

date_from              (optional) string (ISO 8601 date: YYYY-MM-DD)
                       Description: Filter by created_at >= date

date_to                (optional) string (ISO 8601 date: YYYY-MM-DD)
                       Description: Filter by created_at <= date
```

**Example Request**:
```bash
GET /api/v1/duplicate-operator?page=1&page_size=10&search=123456&status=all&sort_by=created_at&sort_order=desc

# With authentication
curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/v1/duplicate-operator?page=1&page_size=5
```

#### Response

**Success (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "message": "Records retrieved successfully",
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440001",
      "nik_duplicate": "3273051234567890",
      "nama_duplicate": "John Duplicate",
      "nik_operator": "3273051111111111",
      "nama_operator": "Operator Name",
      "nik_pengaju": "3273051234567890",
      "nama_pengaju": "Submitter Name",
      "tanggal_perekaman": "2025-10-15",
      "tanggal_pengajuan": "2025-10-19",
      "estimasi_tanggal_perekaman": "2025-10-22",
      "is_ready_to_record": false,
      "created_at": "2025-10-19T10:30:00Z",
      "updated_at": "2025-10-19T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "page_size": 10,
    "total": 42,
    "total_pages": 5,
    "has_next": true,
    "has_previous": false
  },
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (400 Bad Request)**:
```json
{
  "status": "error",
  "code": 400,
  "message": "Invalid query parameters",
  "error_details": [
    {
      "field": "page",
      "message": "must be greater than 0"
    },
    {
      "field": "page_size",
      "message": "must be between 1 and 100"
    }
  ],
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (401 Unauthorized)**:
```json
{
  "status": "error",
  "code": 401,
  "message": "Authentication required",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

#### Implementation Notes

```go
// Handler structure
type ListQueryParams struct {
    Page      int    `query:"page" validate:"gte=1"`
    PageSize  int    `query:"page_size" validate:"gte=1,lte=100"`
    Search    string `query:"search"`
    Status    string `query:"status" validate:"omitempty,oneof=all completed pending"`
    SortBy    string `query:"sort_by" validate:"omitempty,oneof=created_at tanggal_perekaman"`
    SortOrder string `query:"sort_order" validate:"omitempty,oneof=asc desc"`
    DateFrom  string `query:"date_from"`
    DateTo    string `query:"date_to"`
}

// Service call
records, total, err := h.service.ListRecords(
    c.Request.Context(),
    filters,
    params.Page,
    params.PageSize,
)
```

---

### 2. GET SINGLE DUPLICATE OPERATOR

**Endpoint**: `GET /api/v1/duplicate-operator/:id`

**Purpose**: Fetch a single duplicate operator record by ID

#### Request

**Path Parameters**:
```
id (required) UUID
   Format: 550e8400-e29b-41d4-a716-446655440000
```

**Example Request**:
```bash
GET /api/v1/duplicate-operator/550e8400-e29b-41d4-a716-446655440000

curl -H "Authorization: Bearer eyJ..." \
  http://localhost:8080/api/v1/duplicate-operator/550e8400-e29b-41d4-a716-446655440000
```

#### Response

**Success (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "message": "Record retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "nik_duplicate": "3273051234567890",
    "nama_duplicate": "John Duplicate",
    "nik_operator": "3273051111111111",
    "nama_operator": "Operator Name",
    "nik_pengaju": "3273051234567890",
    "nama_pengaju": "Submitter Name",
    "tanggal_perekaman": "2025-10-15",
    "tanggal_pengajuan": "2025-10-19",
    "estimasi_tanggal_perekaman": "2025-10-22",
    "is_ready_to_record": false,
    "created_at": "2025-10-19T10:30:00Z",
    "updated_at": "2025-10-19T10:30:00Z"
  },
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (404 Not Found)**:
```json
{
  "status": "error",
  "code": 404,
  "message": "Record not found",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (400 Bad Request - Invalid ID)**:
```json
{
  "status": "error",
  "code": 400,
  "message": "Invalid ID format",
  "error_details": {
    "field": "id",
    "message": "must be a valid UUID"
  },
  "timestamp": "2025-10-19T19:49:00Z"
}
```

---

### 3. CREATE DUPLICATE OPERATOR

**Endpoint**: `POST /api/v1/duplicate-operator`

**Purpose**: Create a new duplicate operator record

#### Request

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body**:
```json
{
  "nik_duplicate": "3273051234567890",
  "nama_duplicate": "John Duplicate",
  "nik_operator": "3273051111111111",
  "nama_operator": "Operator Name",
  "tanggal_perekaman": "2025-10-15",
  "tanggal_pengajuan": "2025-10-19",
  "estimasi_tanggal_perekaman": "2025-10-22",
  "is_ready_to_record": false
}
```

**Field Specifications**:
```
nik_duplicate               (required) string
                           Length: exactly 16 characters
                           Format: numeric only (0-9)
                           Description: NIK of duplicate subject

nama_duplicate             (required) string
                           Length: 1-255 characters
                           Description: Name of duplicate subject

nik_operator               (required) string
                           Length: exactly 16 characters
                           Format: numeric only (0-9)
                           Description: Operator NIK

nama_operator              (required) string
                           Length: 1-255 characters
                           Description: Operator name

tanggal_perekaman          (required) string (ISO date: YYYY-MM-DD)
                           Description: Recording date

tanggal_pengajuan          (required) string (ISO date: YYYY-MM-DD)
                           Default: current date
                           Description: Submission date

estimasi_tanggal_perekaman (optional) string (ISO date: YYYY-MM-DD)
                           Description: Estimated recording date

is_ready_to_record         (optional) boolean
                           Default: false
                           Description: Ready to record flag
```

**Example Request**:
```bash
curl -X POST http://localhost:8080/api/v1/duplicate-operator \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "nik_duplicate": "3273051234567890",
    "nama_duplicate": "John Duplicate",
    "nik_operator": "3273051111111111",
    "nama_operator": "Operator Name",
    "tanggal_perekaman": "2025-10-15"
  }'
```

#### Response

**Success (201 Created)**:
```json
{
  "status": "success",
  "code": 201,
  "message": "Record created successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "nik_duplicate": "3273051234567890",
    "nama_duplicate": "John Duplicate",
    "nik_operator": "3273051111111111",
    "nama_operator": "Operator Name",
    "nik_pengaju": "3273051234567890",
    "nama_pengaju": "Submitter Name",
    "tanggal_perekaman": "2025-10-15",
    "tanggal_pengajuan": "2025-10-19",
    "estimasi_tanggal_perekaman": "2025-10-22",
    "is_ready_to_record": false,
    "created_at": "2025-10-19T10:30:00Z",
    "updated_at": "2025-10-19T10:30:00Z"
  },
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (400 Bad Request - Validation)**:
```json
{
  "status": "error",
  "code": 400,
  "message": "Validation failed",
  "error_details": [
    {
      "field": "nik_duplicate",
      "message": "must be exactly 16 numeric characters"
    },
    {
      "field": "nama_duplicate",
      "message": "is required and cannot be empty"
    },
    {
      "field": "tanggal_perekaman",
      "message": "must be valid YYYY-MM-DD date format"
    }
  ],
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (403 Forbidden)**:
```json
{
  "status": "error",
  "code": 403,
  "message": "Insufficient permissions to create record",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

---

### 4. UPDATE DUPLICATE OPERATOR

**Endpoint**: `PUT /api/v1/duplicate-operator/:id`

**Purpose**: Update an existing duplicate operator record

#### Request

**Path Parameters**:
```
id (required) UUID
```

**Headers**:
```
Content-Type: application/json
Authorization: Bearer {token}
```

**Body** (all fields optional for partial updates):
```json
{
  "nik_duplicate": "3273051234567890",
  "nama_duplicate": "Jane Duplicate",
  "nik_operator": "3273051111111112",
  "nama_operator": "Updated Operator",
  "tanggal_perekaman": "2025-10-20",
  "tanggal_pengajuan": "2025-10-19",
  "estimasi_tanggal_perekaman": "2025-10-23",
  "is_ready_to_record": true
}
```

**Example Request**:
```bash
curl -X PUT http://localhost:8080/api/v1/duplicate-operator/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJ..." \
  -H "Content-Type: application/json" \
  -d '{
    "nama_duplicate": "Jane Duplicate",
    "is_ready_to_record": true
  }'
```

#### Response

**Success (200 OK)**:
```json
{
  "status": "success",
  "code": 200,
  "message": "Record updated successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "550e8400-e29b-41d4-a716-446655440001",
    "nik_duplicate": "3273051234567890",
    "nama_duplicate": "Jane Duplicate",
    "nik_operator": "3273051111111111",
    "nama_operator": "Operator Name",
    "nik_pengaju": "3273051234567890",
    "nama_pengaju": "Submitter Name",
    "tanggal_perekaman": "2025-10-15",
    "tanggal_pengajuan": "2025-10-19",
    "estimasi_tanggal_perekaman": "2025-10-22",
    "is_ready_to_record": true,
    "created_at": "2025-10-19T10:30:00Z",
    "updated_at": "2025-10-19T14:45:00Z"
  },
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (404 Not Found)**:
```json
{
  "status": "error",
  "code": 404,
  "message": "Record not found",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (403 Forbidden)**:
```json
{
  "status": "error",
  "code": 403,
  "message": "Only admin users can update records",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (409 Conflict)**:
```json
{
  "status": "error",
  "code": 409,
  "message": "Record was modified by another user. Please refresh and try again",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

---

### 5. DELETE DUPLICATE OPERATOR

**Endpoint**: `DELETE /api/v1/duplicate-operator/:id`

**Purpose**: Delete a duplicate operator record

#### Request

**Path Parameters**:
```
id (required) UUID
```

**Headers**:
```
Authorization: Bearer {token}
```

**Example Request**:
```bash
curl -X DELETE http://localhost:8080/api/v1/duplicate-operator/550e8400-e29b-41d4-a716-446655440000 \
  -H "Authorization: Bearer eyJ..."
```

#### Response

**Success (204 No Content)**:
- Empty response body
- Status code: 204

**Error (404 Not Found)**:
```json
{
  "status": "error",
  "code": 404,
  "message": "Record not found",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

**Error (403 Forbidden)**:
```json
{
  "status": "error",
  "code": 403,
  "message": "Only admin users can delete records",
  "timestamp": "2025-10-19T19:49:00Z"
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
  "status": "error",
  "code": 400,
  "message": "User-friendly error message (Indonesian)",
  "error_details": [
    {
      "field": "field_name",
      "message": "Field-specific error message"
    }
  ],
  "timestamp": "2025-10-19T19:49:00Z"
}
```

### HTTP Status Codes

| Code | Meaning | When Used |
|------|---------|-----------|
| 200 | OK | Successful GET, PUT |
| 201 | Created | Successful POST |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation errors, invalid parameters |
| 401 | Unauthorized | Missing/invalid authentication token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Data conflict (optimistic lock violation) |
| 500 | Internal Server Error | Server-side error |
| 503 | Service Unavailable | Database/service unavailable |

---

## Pagination Details

### Pagination Parameters

```json
{
  "page": 1,
  "page_size": 10,
  "total": 42,
  "total_pages": 5,
  "has_next": true,
  "has_previous": false
}
```

**Calculation**:
- `total_pages = ceil(total / page_size)`
- `has_next = page < total_pages`
- `has_previous = page > 1`

**Limits**:
- Minimum page_size: 1
- Maximum page_size: 100
- Default page_size: 10

---

## Search & Filtering

### Search Fields

Search string is matched against:
- `nik_duplicate` - exact or partial match
- `nama_duplicate` - case-insensitive contains
- `nik_operator` - exact or partial match
- `nama_operator` - case-insensitive contains

### Filter Options

**Status Filter**:
- `all` - show all records (default)
- `completed` - where is_ready_to_record = true
- `pending` - where is_ready_to_record = false

**Date Filtering**:
- `date_from` - created_at >= value
- `date_to` - created_at <= value

### Combined Example

```bash
GET /api/v1/duplicate-operator?search=3273&status=completed&date_from=2025-10-01&date_to=2025-10-31&page=1
```

---

## Response Headers

All responses include:

```
Content-Type: application/json
X-Request-ID: {unique-request-id}
X-Response-Time: {milliseconds}
```

---

## Caching Strategy

### Cache Headers

```
Cache-Control: public, max-age=300          # 5 minutes for lists
Cache-Control: public, max-age=60           # 1 minute for single records
Cache-Control: no-cache, must-revalidate    # No cache for write operations
```

### Cache Invalidation

Perform full cache clear on:
- POST (create)
- PUT (update)
- DELETE

---

## Rate Limiting (Future)

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1697812800
```

---

## Implementation Checklist

- [ ] Implement all 5 endpoints
- [ ] Add request validation
- [ ] Add response formatting
- [ ] Add error handling
- [ ] Add pagination support
- [ ] Add search/filtering
- [ ] Add caching
- [ ] Add rate limiting
- [ ] Add API documentation
- [ ] Add integration tests
