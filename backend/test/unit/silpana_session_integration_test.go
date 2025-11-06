package unit

import (
"context"
"testing"

"github.com/stretchr/testify/assert"

authservice "selly-backend/internal/services/auth"
silpanaservice "selly-backend/internal/services/silpana"
)

func TestSilpanaSessionManagerIsHealthy(t *testing.T) {
setup := setupSilpanaTest()
defer teardownSilpanaTest(setup)

healthy := setup.silpanaSessionManager.IsHealthy()
assert.True(t, healthy, "session manager should be healthy")
}

func TestSilpanaSessionManagerCreation(t *testing.T) {
setup := setupSilpanaTest()
defer teardownSilpanaTest(setup)

assert.NotNil(t, setup.silpanaSessionManager)
assert.NotNil(t, setup.authSessionManager)
}

type silpanaTestSetup struct {
authSessionManager    *authservice.SessionManager
silpanaSessionManager *silpanaservice.SilpanaSessionManager
silpanaService        silpanaservice.ServiceInterface
}

func setupSilpanaTest() *silpanaTestSetup {
cfg := &authservice.SessionConfig{
TokenLifetime:         3600 * 1e9,
RefreshTokenLifetime:  7 * 24 * 3600 * 1e9,
RefreshThreshold:      0.75,
SessionIdleTimeout:    4 * 3600 * 1e9,
MaxConcurrentSessions: 5,
}

authService := &authservice.Service{}
authSessionMgr := authservice.NewSessionManager(authService, *cfg)
mockService := &mockSilpanaService{}
silpanaSessionMgr := silpanaservice.NewSilpanaSessionManager(authSessionMgr, mockService)

return &silpanaTestSetup{
authSessionManager:    authSessionMgr,
silpanaSessionManager: silpanaSessionMgr,
silpanaService:        mockService,
}
}

func teardownSilpanaTest(setup *silpanaTestSetup) {
if setup.authSessionManager != nil {
setup.authSessionManager.StopAutoRefresh()
}
}

type mockSilpanaService struct{}

func (m *mockSilpanaService) CreateTicket(ctx context.Context, req *silpanaservice.CreateTicketRequest) (*silpanaservice.TicketResponse, error) { return nil, nil }
func (m *mockSilpanaService) LookupTicket(ctx context.Context, req *silpanaservice.TicketLookupRequest) (*silpanaservice.TicketResponse, error) { return nil, nil }
func (m *mockSilpanaService) GetTicketByID(ctx context.Context, ticketID string) (*silpanaservice.TicketResponse, error) { return nil, nil }
func (m *mockSilpanaService) UpdateTicketStatus(ctx context.Context, ticketID string, req *silpanaservice.UpdateStatusRequest) (*silpanaservice.TicketResponse, error) { return nil, nil }
func (m *mockSilpanaService) GetTicketHistory(ctx context.Context, ticketID string) ([]*silpanaservice.TicketHistory, error) { return nil, nil }
func (m *mockSilpanaService) AddHistoryEntry(ctx context.Context, ticketID string, oldStatus, newStatus silpanaservice.TicketStatus, changedBy, notes string) error { return nil }
func (m *mockSilpanaService) GetTicketStats(ctx context.Context) (*silpanaservice.TicketStatsResponse, error) { return nil, nil }
func (m *mockSilpanaService) GetAllTickets(ctx context.Context, page, pageSize int) (*silpanaservice.PaginatedTicketsResponse, error) { return nil, nil }
func (m *mockSilpanaService) GetTicketsByStatus(ctx context.Context, status silpanaservice.TicketStatus, limit, offset int) ([]*silpanaservice.SilpanaTicket, error) { return nil, nil }
func (m *mockSilpanaService) GetTicketsByPriority(ctx context.Context, priority silpanaservice.TicketPriority, limit, offset int) ([]*silpanaservice.SilpanaTicket, error) { return nil, nil }
func (m *mockSilpanaService) BulkApproveTickets(ctx context.Context, ticketIDs []string, changedBy string) (*silpanaservice.BulkOperationResponse, error) { return nil, nil }
func (m *mockSilpanaService) BulkRejectTickets(ctx context.Context, ticketIDs []string, changedBy string, reason string) (*silpanaservice.BulkOperationResponse, error) { return nil, nil }
func (m *mockSilpanaService) BulkDeleteTickets(ctx context.Context, ticketIDs []string, deletedBy string) (*silpanaservice.BulkOperationResponse, error) { return nil, nil }
func (m *mockSilpanaService) GetTicketProgress(ctx context.Context, ticketCode string) (*silpanaservice.TicketProgressResponse, error) { return nil, nil }
func (m *mockSilpanaService) InvalidateProgressCache(ctx context.Context, ticketCode string) error { return nil }
func (m *mockSilpanaService) AddCommunication(ctx context.Context, ticketID string, req *silpanaservice.AddCommunicationRequest) (*silpanaservice.CommunicationResponse, error) { return nil, nil }
func (m *mockSilpanaService) GetCommunications(ctx context.Context, ticketID string, includeInternal bool) ([]*silpanaservice.Communication, error) { return nil, nil }
func (m *mockSilpanaService) GenerateTicketCode(ctx context.Context) (string, error) { return "", nil }
func (m *mockSilpanaService) ValidateTicketAccess(ctx context.Context, code, nik, phone string) (*silpanaservice.SilpanaTicket, error) { return nil, nil }
func (m *mockSilpanaService) HealthCheck(ctx context.Context) error { return nil }
