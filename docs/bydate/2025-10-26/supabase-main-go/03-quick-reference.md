# Supabase-Go Quick Reference Guide

**Document**: Quick Reference for Supabase-Go Features
**Project Date**: 2025-10-26
**Created**: 2025-10-26
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📊 Medium
**Language**: English
**Audience**: All Development Team
**Type**: Quick Reference

## Executive Summary

Cheat sheet for common supabase-go operations with side-by-side comparisons of current vs enhanced implementations.

## Quick Comparison: Before & After

| Operation | Current (Basic) | Enhanced | Benefit |
|-----------|----------------|----------|---------|
| Simple query | 5 lines | 3 lines | Cleaner code |
| Filtered query | 10+ lines | 5 lines | 50% less code |
| Pagination | Manual calc | Built-in | Zero errors |
| Insert + return | 2 requests | 1 request | 50% faster |
| Token refresh | Manual | Auto | Zero downtime |
| File upload | Not available | Built-in | New feature |

## Database Operations

### SELECT Queries

```go
// BEFORE: Basic select
data, _, err := client.From("silpana").
    Select("*", "", false).
    Execute()

// AFTER: Enhanced select with options
opts := database.QueryOptions{
    Select: "id,ticket_code,status",
    Filters: map[string]interface{}{
        "status": "open",
    },
    Limit: 10,
}
data, count, err := dbService.QueryWithOptions("silpana", opts)
```

### Filtering

```go
// BEFORE: Manual chaining
query := client.From("silpana").Select("*", "", false)
if status != "" {
    query = query.Eq("status", status)
}
if priority != "" {
    query = query.Eq("priority", priority)
}
data, _, err := query.Execute()

// AFTER: Structured filters
opts := database.QueryOptions{
    Select: "*",
    Filters: map[string]interface{}{
        "status":   status,
        "priority": priority,
    },
}
data, _, err := dbService.QueryWithOptions("silpana", opts)
```

### Complex Filters

```go
// Available operators in ComplexFilter
ComplexFilter{
    Field:    "priority",
    Operator: "in",        // in, eq, neq, gt, gte, lt, lte, like, ilike, is
    Value:    []string{"high", "urgent"},
}

// Search example
opts := database.QueryOptions{
    ComplexFilters: []database.ComplexFilter{
        {
            Field:    "subject",
            Operator: "ilike",  // Case-insensitive LIKE
            Value:    "dokumen",
        },
    },
}
```

### Pagination

```go
// BEFORE: Manual range calculation
page := 2
limit := 10
offset := (page - 1) * limit
end := offset + limit - 1
data, _, err := client.From("silpana").
    Select("*", "", false).
    Range(offset, end, "").
    Execute()

// AFTER: Simple pagination
opts := database.QueryOptions{
    Select: "*",
    Limit:  10,
    Offset: 10,  // Page 2
}
data, count, err := dbService.QueryWithOptions("silpana", opts)
// count contains total records for pagination UI
```

### Ordering

```go
// BEFORE: Basic order
data, _, err := client.From("silpana").
    Select("*", "", false).
    Order("created_at", &postgrest.OrderOpts{Ascending: false}).
    Execute()

// AFTER: In options
opts := database.QueryOptions{
    Select:    "*",
    OrderBy:   "created_at",
    Ascending: false,
}
data, _, err := dbService.QueryWithOptions("silpana", opts)
```

### INSERT Operations

```go
// BEFORE: Insert without return
data, _, err := client.From("silpana").
    Insert(ticket, false, "", "", "").
    Execute()
// Need another query to get generated ID

// AFTER: Insert with return
data, err := dbService.InsertWithReturn("silpana", ticket)
// data contains inserted record with ID and timestamps
```

### UPDATE Operations

```go
// BEFORE: Update without return
_, _, err := client.From("silpana").
    Update(updateData, "", "").
    Eq("id", ticketID).
    Execute()

// AFTER: Update with return
opts := database.QueryOptions{
    Filters: map[string]interface{}{"id": ticketID},
}
data, err := dbService.UpdateWithReturn("silpana", updateData, opts)
// data contains updated record
```

### DELETE Operations

```go
// BEFORE: Delete without return
_, _, err := client.From("silpana").
    Delete("", "").
    Eq("id", ticketID).
    Execute()

// AFTER: Delete with return
opts := database.QueryOptions{
    Filters: map[string]interface{}{"id": ticketID},
}
data, err := dbService.DeleteWithReturn("silpana", opts)
// data contains deleted record for audit log
```

### RPC (Stored Procedures)

```go
// Call database function
result, err := dbService.RPC("generate_ticket_report", map[string]interface{}{
    "start_date": "2025-10-01",
    "end_date":   "2025-10-26",
})

// For complex operations, create database function:
-- SQL Migration
CREATE FUNCTION generate_ticket_report(start_date date, end_date date)
RETURNS json AS $$
BEGIN
    RETURN (
        SELECT json_build_object(
            'total_tickets', COUNT(*),
            'open_tickets', COUNT(*) FILTER (WHERE status = 'open'),
            'closed_tickets', COUNT(*) FILTER (WHERE status = 'closed')
        )
        FROM silpana
        WHERE created_at BETWEEN start_date AND end_date
    );
END;
$$ LANGUAGE plpgsql;
```

## Authentication Operations

### Sign In

```go
// BEFORE: Not available (using custom JWT)
token, err := generateJWT(user)

// AFTER: Built-in with auto-refresh
session, err := authService.SignInWithEmail("user@example.com", "password")
// Auto-refresh enabled automatically
```

### Token Management

```go
// BEFORE: Manual refresh
if isTokenExpired(token) {
    token = generateNewToken(user)
}

// AFTER: Automatic refresh
authService.EnableAutoRefresh(userID, session)
// Refreshes at 75% of expiry time automatically
```

### Sign Out

```go
// BEFORE: Just delete token
delete(sessions, userID)

// AFTER: Proper cleanup
err := authService.SignOut(userID)
// Stops auto-refresh, clears session, notifies Supabase
```

## Storage Operations

### Upload File

```go
// NEW: File upload for SILPANA attachments
file, _ := os.Open("document.pdf")
defer file.Close()

result, err := storageService.UploadTicketAttachment(
    ticketID,
    "document.pdf",
    file,
)

// result.Path = "ticket-123/document.pdf"
// result.FullPath = full storage path
```

### Get Download URL

```go
// Private files: signed URL (expires)
url, err := storageService.GetAttachmentURL(
    "ticket-123/document.pdf",
    3600, // 1 hour expiry
)

// Public files: permanent URL
url := storageService.GetPublicURL("ticket-123/document.pdf")
```

### List Files

```go
// List all attachments for a ticket
files, err := storageService.ListTicketAttachments(ticketID)

for _, file := range files {
    fmt.Printf("File: %s, Size: %d, Updated: %s\n",
        file.Name,
        file.Size,
        file.UpdatedAt,
    )
}
```

### Delete File

```go
// Delete attachment
err := storageService.DeleteAttachment("ticket-123/document.pdf")
```

## Common Patterns

### Pattern 1: List with Pagination

```go
func ListTickets(page, limit int) ([]Ticket, int64, error) {
    opts := database.QueryOptions{
        Select:    "id,ticket_code,status,priority,created_at",
        OrderBy:   "created_at",
        Ascending: false,
        Limit:     limit,
        Offset:    (page - 1) * limit,
        Count:     "exact",
    }
    
    data, count, err := dbService.QueryWithOptions("silpana", opts)
    if err != nil {
        return nil, 0, err
    }
    
    var tickets []Ticket
    json.Unmarshal(data, &tickets)
    
    return tickets, count, nil
}
```

### Pattern 2: Search with Filters

```go
func SearchTickets(searchTerm string, filters TicketFilters) ([]Ticket, error) {
    opts := database.QueryOptions{
        Select: "*",
        Filters: map[string]interface{}{
            "status":   filters.Status,
            "priority": filters.Priority,
        },
        ComplexFilters: []database.ComplexFilter{
            {
                Field:    "subject",
                Operator: "ilike",
                Value:    searchTerm,
            },
        },
        OrderBy:   "created_at",
        Ascending: false,
        Limit:     50,
    }
    
    data, _, err := dbService.QueryWithOptions("silpana", opts)
    if err != nil {
        return nil, err
    }
    
    var tickets []Ticket
    json.Unmarshal(data, &tickets)
    
    return tickets, nil
}
```

### Pattern 3: Create with File Upload

```go
func CreateTicketWithAttachment(ticket *Ticket, file io.Reader, filename string) error {
    // 1. Create ticket
    err := dbService.InsertWithReturn("silpana", ticket)
    if err != nil {
        return fmt.Errorf("gagal membuat tiket: %w", err)
    }
    
    // 2. Upload attachment
    if file != nil {
        result, err := storageService.UploadTicketAttachment(
            ticket.ID,
            filename,
            file,
        )
        if err != nil {
            // Rollback ticket creation or log error
            logrus.WithError(err).Error("Failed to upload attachment")
            return fmt.Errorf("gagal mengunggah lampiran: %w", err)
        }
        
        // 3. Update ticket with attachment path
        updateData := map[string]interface{}{
            "attachment_path": result.Path,
        }
        opts := database.QueryOptions{
            Filters: map[string]interface{}{"id": ticket.ID},
        }
        _, err = dbService.UpdateWithReturn("silpana", updateData, opts)
        if err != nil {
            return fmt.Errorf("gagal memperbarui tiket: %w", err)
        }
    }
    
    return nil
}
```

### Pattern 4: Authenticated Request

```go
func GetUserTickets(userID string) ([]Ticket, error) {
    // 1. Validate session
    session, err := authService.GetSession(userID)
    if err != nil {
        return nil, fmt.Errorf("sesi tidak valid: %w", err)
    }
    
    // 2. Query tickets
    opts := database.QueryOptions{
        Select: "*",
        Filters: map[string]interface{}{
            "requester_id": userID,
        },
        OrderBy:   "created_at",
        Ascending: false,
    }
    
    data, _, err := dbService.QueryWithOptions("silpana", opts)
    if err != nil {
        return nil, err
    }
    
    var tickets []Ticket
    json.Unmarshal(data, &tickets)
    
    return tickets, nil
}
```

## Error Handling Patterns

### Database Errors

```go
data, count, err := dbService.QueryWithOptions("silpana", opts)
if err != nil {
    // Log technical error
    logrus.WithError(err).Error("Database query failed")
    
    // Return Indonesian user message
    return nil, fmt.Errorf("gagal memuat data tiket: %w", err)
}
```

### Authentication Errors

```go
session, err := authService.SignInWithEmail(email, password)
if err != nil {
    if errors.Is(err, auth_enhanced.ErrInvalidCredentials) {
        return nil, fmt.Errorf("email atau password salah")
    }
    
    logrus.WithError(err).Error("Sign in failed")
    return nil, fmt.Errorf("gagal masuk: %w", err)
}
```

### Storage Errors

```go
result, err := storageService.UploadTicketAttachment(ticketID, filename, file)
if err != nil {
    logrus.WithError(err).Error("File upload failed")
    
    // Check specific error types
    if strings.Contains(err.Error(), "file too large") {
        return fmt.Errorf("ukuran file terlalu besar (maksimal 10MB)")
    }
    
    return fmt.Errorf("gagal mengunggah file: %w", err)
}
```

## Performance Tips

### 1. Use Select to Limit Fields

```go
// ❌ BAD: Fetch all columns
opts := database.QueryOptions{
    Select: "*",
}

// ✅ GOOD: Fetch only needed columns
opts := database.QueryOptions{
    Select: "id,ticket_code,status,created_at",  // 75% less data
}
```

### 2. Use Pagination for Large Datasets

```go
// ❌ BAD: Load all records
opts := database.QueryOptions{
    Select: "*",
}

// ✅ GOOD: Paginate
opts := database.QueryOptions{
    Select: "id,ticket_code,status",
    Limit:  20,
    Offset: 0,
}
```

### 3. Use RPC for Complex Operations

```go
// ❌ BAD: Multiple queries in Go
tickets, _ := getTickets()
stats := calculateStats(tickets)  // Processing in Go

// ✅ GOOD: Single RPC call
stats, _ := dbService.RPC("calculate_ticket_stats", nil)  // Processing in database
```

### 4. Use Connection Pool

```go
// ❌ BAD: Create new client each time
client, _ := supabase.NewClient(url, key, nil)
client.From("table").Select("*", "", false).Execute()

// ✅ GOOD: Use pooled client
client := dbService.GetPooledClient()
defer dbService.ReturnPooledClient(client)
client.From("table").Select("*", "", false).Execute()
```

## Migration Checklist

### For Each Service

- [ ] Review current Supabase usage
- [ ] Identify enhancement opportunities
- [ ] Write enhanced wrapper methods
- [ ] Update service to use new methods
- [ ] Write unit tests
- [ ] Update integration tests
- [ ] Benchmark performance
- [ ] Update documentation

### Testing Checklist

- [ ] Unit tests for all new methods
- [ ] Integration tests for workflows
- [ ] Performance benchmarks
- [ ] Error handling tests
- [ ] Edge case tests (empty results, large datasets)

## Quick Links

- [Main Analysis Document](./01-analysis-and-integration-plan.md)
- [Implementation Examples](./02-implementation-examples.md)
- [Supabase-Go Package](https://pkg.go.dev/github.com/supabase-community/supabase-go)
- [PostgREST Docs](https://postgrest.org/)

---

**Last Updated**: 2025-10-26
**Status**: Ready for use
**Print**: Reference this guide while coding
