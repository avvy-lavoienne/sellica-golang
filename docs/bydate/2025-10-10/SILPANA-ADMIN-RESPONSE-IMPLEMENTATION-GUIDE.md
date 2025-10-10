# SILPANA Admin-User Communication Implementation Guide

**Document**: Quick Start Guide for Admin Response System
**Project Date**: 2025-10-10
**Created**: 2025-10-10
**Version**: 1.0
**Status**: 🚧 Implementation Guide
**Priority**: 🧠 Critical
**Language**: English
**Audience**: Development Team
**Type**: Implementation Guide

## Executive Summary

This guide provides step-by-step instructions to implement the missing admin-user response functionality in the SILPANA ticketing system. The infrastructure (database, WebSocket, types) is already in place - we just need to wire up the UI and API handlers.

## What's Already Working

✅ Database schema with `ticket_communication` table
✅ WebSocket real-time infrastructure
✅ User can view admin messages on ticket lookup
✅ TypeScript types defined (`TicketCommunication`, `CommunicationMessage`)
✅ Admin can update ticket status

## What Needs Implementation

❌ Admin UI to compose and send messages
❌ Backend API handler for POST/GET communications
❌ API route registration
❌ WebSocket broadcast for new messages

## Implementation Steps

### Step 1: Backend API Handler (4 hours)

**File:** `backend/internal/services/silpana/handler.go`

Add two new methods to the Handler:

```go
// AddCommunication handles POST /api/v1/silpana/tickets/:id/communications
func (h *Handler) AddCommunication(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	var req struct {
		Message     string   `json:"message" binding:"required"`
		SenderType  string   `json:"sender_type" binding:"required,oneof=admin submitter"`
		SenderName  string   `json:"sender_name" binding:"required"`
		Attachments []string `json:"attachments"`
		IsInternal  bool     `json:"is_internal"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		logrus.Errorf("Invalid add communication request: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{
			"error":   "Invalid request format",
			"details": err.Error(),
		})
		return
	}

	// Insert into database using Supabase client
	communication := map[string]interface{}{
		"ticket_id":   ticketID,
		"message":     req.Message,
		"sender_type": req.SenderType,
		"sender_name": req.SenderName,
		"attachments": req.Attachments,
		"is_internal": req.IsInternal,
	}

	data, err := h.service.GetDatabaseAdapter().Insert(
		c.Request.Context(),
		"ticket_communication",
		communication,
	)

	if err != nil {
		logrus.Errorf("Failed to add communication to ticket %s: %v", ticketID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to add communication",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Added communication to ticket %s in %v", ticketID, duration)

	// Broadcast via WebSocket
	if h.broadcaster != nil {
		h.broadcaster.BroadcastNewComment(c.Request.Context(), ticketID, data)
	}

	c.JSON(http.StatusCreated, gin.H{
		"communication": data,
		"message":       "Communication added successfully",
	})
}

// GetCommunications handles GET /api/v1/silpana/tickets/:id/communications
func (h *Handler) GetCommunications(c *gin.Context) {
	start := time.Now()

	ticketID := c.Param("id")
	if ticketID == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Ticket ID is required",
		})
		return
	}

	// Check if user wants to include internal notes (admin only)
	includeInternal := c.Query("include_internal") == "true"

	// Build query
	query := h.service.GetDatabaseAdapter().GetClient().
		From("ticket_communication").
		Select("*").
		Eq("ticket_id", ticketID).
		Order("created_at", &supabase.OrderOpts{Ascending: true})

	// Filter out internal notes for non-admin users
	if !includeInternal {
		query = query.Eq("is_internal", false)
	}

	data, err := query.Execute()
	if err != nil {
		logrus.Errorf("Failed to get communications for ticket %s: %v", ticketID, err)
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve communications",
			"details": err.Error(),
		})
		return
	}

	duration := time.Since(start)
	logrus.Infof("Retrieved communications for ticket %s in %v", ticketID, duration)

	c.JSON(http.StatusOK, gin.H{
		"communications": data,
		"count":          len(data.([]interface{})),
	})
}
```

### Step 2: Register API Routes (30 minutes)

**File:** `backend/internal/api/routes/routes.go`

Add the communication routes to the SILPANA group:

```go
// Find the silpana routes section (around line 150-200)
silpanaGroup := api.Group("/silpana")
{
	// Existing routes...
	silpanaGroup.POST("/tickets", silpanaHandler.CreateTicket)
	silpanaGroup.POST("/tickets/lookup", silpanaHandler.LookupTicket)
	silpanaGroup.GET("/tickets/:id", silpanaHandler.GetTicket)
	silpanaGroup.PUT("/tickets/:id/status", silpanaHandler.UpdateTicketStatus)
	
	// NEW: Communication routes
	silpanaGroup.POST("/tickets/:id/communications", silpanaHandler.AddCommunication)
	silpanaGroup.GET("/tickets/:id/communications", silpanaHandler.GetCommunications)
}
```

### Step 3: WebSocket Broadcaster (1 hour)

**File:** `backend/internal/services/silpana/websocket.go` (create if doesn't exist)

Add a method to broadcast new comments:

```go
package silpana

import (
	"context"
	"time"

	"github.com/sirupsen/logrus"
)

// BroadcastNewComment broadcasts a new communication message to all clients subscribed to the ticket
func (b *WebSocketBroadcaster) BroadcastNewComment(ctx context.Context, ticketID string, communication interface{}) {
	if b.hub == nil {
		logrus.Warn("WebSocket hub not initialized, skipping broadcast")
		return
	}

	message := map[string]interface{}{
		"type":       "NEW_COMMENT",
		"ticket_id":  ticketID,
		"data":       communication,
		"timestamp":  time.Now(),
	}

	roomID := "ticket-" + ticketID
	
	go func() {
		if err := b.hub.BroadcastToRoom(roomID, message); err != nil {
			logrus.Errorf("Failed to broadcast new comment to room %s: %v", roomID, err)
		} else {
			logrus.Infof("Broadcasted new comment to room %s", roomID)
		}
	}()
}
```

### Step 4: Admin Response UI Component (4 hours)

**File:** `frontend/src/components/silpana/admin/AdminResponseForm.tsx` (create new)

```tsx
"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "react-toastify";
import { Send, Loader2, Paperclip } from "lucide-react";

interface AdminResponseFormProps {
  ticketId: string;
  ticketCode: string;
  onResponseSent?: () => void;
}

export default function AdminResponseForm({
  ticketId,
  ticketCode,
  onResponseSent
}: AdminResponseFormProps) {
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim()) {
      toast.error("Pesan tidak boleh kosong");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/silpana/tickets/${ticketId}/communications`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // Add authentication header if needed
            // "Authorization": `Bearer ${getAuthToken()}`
          },
          body: JSON.stringify({
            message: message.trim(),
            sender_type: "admin",
            sender_name: "Admin SILPANA", // TODO: Get from auth context
            is_internal: isInternal,
            attachments: [],
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengirim respon");
      }

      toast.success(
        isInternal
          ? "Catatan internal berhasil ditambahkan"
          : "Respon berhasil dikirim ke pengadu"
      );

      // Reset form
      setMessage("");
      setIsInternal(false);

      // Callback to refresh ticket data
      if (onResponseSent) {
        onResponseSent();
      }
    } catch (error: any) {
      console.error("Error sending response:", error);
      toast.error(error.message || "Gagal mengirim respon");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kirim Respon ke Pengadu</CardTitle>
        <CardDescription>
          Respon Anda akan langsung terlihat oleh pengadu saat mereka memeriksa tiket {ticketCode}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="message">Pesan</Label>
            <Textarea
              id="message"
              placeholder="Tulis respon untuk pengadu..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              disabled={isSubmitting}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {message.length} karakter
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-internal"
              checked={isInternal}
              onCheckedChange={setIsInternal}
              disabled={isSubmitting}
            />
            <Label htmlFor="is-internal" className="cursor-pointer">
              Catatan Internal (hanya visible untuk admin)
            </Label>
          </div>

          {isInternal && (
            <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
              ⚠️ Catatan ini hanya akan terlihat oleh admin, tidak akan dikirim ke pengadu
            </div>
          )}

          <div className="flex justify-between pt-2">
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => {
                // TODO: Implement file attachment
                toast.info("Fitur lampiran file akan segera hadir");
              }}
            >
              <Paperclip className="mr-2 h-4 w-4" />
              Lampirkan File
            </Button>

            <Button
              type="submit"
              disabled={!message.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  {isInternal ? "Simpan Catatan" : "Kirim Respon"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### Step 5: Integrate into Admin Ticket Detail Page (1 hour)

**File:** `frontend/src/app/(protected)/silpana-admin/tickets/[id]/page.tsx`

Add the response form after the ticket details section:

```tsx
import AdminResponseForm from "@/components/silpana/admin/AdminResponseForm";

// Inside the component, after the ticket details cards:
export default function TicketDetailPage({ params }: TicketDetailProps) {
  // ... existing state and logic ...

  const handleResponseSent = () => {
    // Refresh ticket data to show new communication
    fetchTicket();
  };

  return (
    <div className="space-y-6">
      {/* ... existing header and status sections ... */}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* ... existing complaint details ... */}

          {/* NEW: Admin Response Form */}
          {ticket && (
            <AdminResponseForm
              ticketId={ticket.id!}
              ticketCode={ticket.ticket_code!}
              onResponseSent={handleResponseSent}
            />
          )}

          {/* Display Communications */}
          {ticket?.ticket_communications && ticket.ticket_communications.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Riwayat Komunikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.ticket_communications.map((comm) => (
                  <div
                    key={comm.id}
                    className={cn(
                      "rounded-lg p-4 border",
                      comm.sender_type === 'admin'
                        ? "bg-blue-50 border-blue-200 ml-8"
                        : "bg-gray-50 border-gray-200 mr-8",
                      comm.is_internal && "bg-yellow-50 border-yellow-200"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{comm.sender_name}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={comm.sender_type === 'admin' ? 'default' : 'secondary'}>
                          {comm.sender_type === 'admin' ? 'Admin' : 'Pengadu'}
                        </Badge>
                        {comm.is_internal && (
                          <Badge variant="outline" className="bg-yellow-100">
                            Internal
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(comm.created_at), "dd MMM yyyy HH:mm", { locale: id })}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{comm.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar - existing content */}
        <div className="space-y-6">
          {/* ... existing sidebar cards ... */}
        </div>
      </div>
    </div>
  );
}
```

### Step 6: Test the Implementation (2 hours)

#### Manual Testing Checklist

1. **Backend API Testing:**

```powershell
# Test POST communication
curl -X POST http://localhost:8080/api/v1/silpana/tickets/YOUR_TICKET_ID/communications `
  -H "Content-Type: application/json" `
  -d '{
    "message": "Test admin response",
    "sender_type": "admin",
    "sender_name": "Admin Test",
    "is_internal": false
  }'

# Test GET communications
curl http://localhost:8080/api/v1/silpana/tickets/YOUR_TICKET_ID/communications
```

2. **Frontend Testing:**
   - [ ] Admin can compose message
   - [ ] Internal note toggle works
   - [ ] Message appears in communication list after sending
   - [ ] User can see admin response on ticket lookup
   - [ ] Real-time update works (open ticket in two tabs)

3. **WebSocket Testing:**
   - [ ] Open ticket detail in admin dashboard
   - [ ] Open same ticket in user lookup page
   - [ ] Send message from admin
   - [ ] Verify user page updates without refresh

#### Automated Tests

**Backend Test:**

```go
// backend/test/integration/silpana_communication_test.go
func TestCommunicationFlow(t *testing.T) {
    // 1. Create test ticket
    ticket := createTestTicket(t)
    
    // 2. Add admin communication
    comm := addCommunication(t, ticket.ID, CommunicationMessage{
        Message:     "Test admin response",
        SenderType:  "admin",
        SenderName:  "Test Admin",
        IsInternal:  false,
    })
    
    assert.NotEmpty(t, comm.ID)
    assert.Equal(t, ticket.ID, comm.TicketID)
    
    // 3. Retrieve communications
    comms := getCommunications(t, ticket.ID, false)
    assert.Len(t, comms, 1)
    assert.Equal(t, "Test admin response", comms[0].Message)
}
```

**Frontend Test:**

```typescript
// frontend/src/__tests__/components/AdminResponseForm.test.tsx
describe('AdminResponseForm', () => {
  it('should send admin response successfully', async () => {
    const onResponseSent = jest.fn();
    
    render(
      <AdminResponseForm
        ticketId="test-id"
        ticketCode="SPL25092268D6AC9E"
        onResponseSent={onResponseSent}
      />
    );
    
    const textarea = screen.getByPlaceholderText(/Tulis respon/i);
    fireEvent.change(textarea, { target: { value: 'Test response' } });
    
    const submitButton = screen.getByText(/Kirim Respon/i);
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(onResponseSent).toHaveBeenCalled();
    });
  });
});
```

## Deployment Checklist

### Pre-Deployment

- [ ] All backend handlers implemented
- [ ] Routes registered
- [ ] Frontend component created
- [ ] Manual testing completed
- [ ] WebSocket broadcasting tested
- [ ] Database indexes verified

### Deployment Steps

```powershell
# 1. Backend deployment
cd backend
go build -o exe/selly-backend.exe cmd/server/main.go
# Deploy to server

# 2. Frontend deployment
cd ../frontend
pnpm build
# Deploy static build

# 3. Database migration (if needed)
# Run any new migrations

# 4. Verify deployment
curl https://your-api-url/health
```

### Post-Deployment

- [ ] Smoke test on production
- [ ] Monitor error logs
- [ ] Check WebSocket connections
- [ ] Verify real-time updates
- [ ] Test with real ticket

## Estimated Timeline

- **Backend Implementation:** 4 hours
- **Frontend UI:** 4 hours
- **Integration & Testing:** 3 hours
- **Deployment & Verification:** 1 hour
- **Total:** 12 hours (1.5 working days)

## Success Criteria

✅ Admin can compose and send messages to users
✅ Users can see admin responses on ticket lookup
✅ Internal notes are only visible to admins
✅ Real-time updates work via WebSocket
✅ Messages are properly stored in database
✅ All tests pass
✅ No performance degradation

## Next Steps After Implementation

1. **User Reply System** - Allow users to reply to admin messages
2. **File Attachments** - Support uploading files in messages
3. **Email Notifications** - Send email when admin responds
4. **Message Threading** - Better conversation view
5. **Read Receipts** - Track if user has seen admin message

## Support & Documentation

- [Full Architecture Document](./SILPANA-ADMIN-USER-RESPONSE-SYNCHRONIZATION.md)
- [Backend API Documentation](../../../backend/README.md)
- [WebSocket Client Guide](../../../frontend/src/lib/websocket/README.md)
- [SILPANA Architecture Analysis](../../SILPANA-ARCHITECTURE-ANALYSIS.md)

---

**Last Updated**: 2025-10-10
**Implementation Status**: Ready to Start
**Priority**: Critical
