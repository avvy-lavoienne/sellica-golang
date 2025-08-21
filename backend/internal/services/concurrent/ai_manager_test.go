package concurrent

import (
	"context"
	"errors"
	"testing"
	"time"

	"selly-backend/internal/services/monitoring"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockAIService implements AIServiceInterface for testing
type MockAIService struct {
	mock.Mock
}

func (m *MockAIService) ProcessQuery(ctx context.Context, req *AIRequest) (*AIResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*AIResponse), args.Error(1)
}

func (m *MockAIService) ProcessSessionQuery(ctx context.Context, req *SessionAIRequest) (*AIResponse, error) {
	args := m.Called(ctx, req)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*AIResponse), args.Error(1)
}

// TestConcurrentAIManager_NewConcurrentAIManager tests manager creation
func TestConcurrentAIManager_NewConcurrentAIManager(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		MaxConcurrentRequests: 10,
		RequestTimeout:        30 * time.Second,
		QueueSize:             20,
	}

	cam, err := NewConcurrentAIManager(config, mockAI, monitoring)
	assert.NoError(t, err)
	assert.NotNil(t, cam)
	assert.False(t, cam.isRunning)
}

// TestConcurrentAIManager_StartStop tests manager lifecycle
func TestConcurrentAIManager_StartStop(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, mockAI, monitoring)
	require.NoError(t, err)

	// Test start
	err = cam.Start()
	assert.NoError(t, err)
	assert.True(t, cam.isRunning)

	// Test double start (should fail)
	err = cam.Start()
	assert.Error(t, err)

	// Test stop
	err = cam.Stop()
	assert.NoError(t, err)
	assert.False(t, cam.isRunning)

	// Test double stop (should fail)
	err = cam.Stop()
	assert.Error(t, err)
}

// TestConcurrentAIManager_ProcessRequest tests single request processing
func TestConcurrentAIManager_ProcessRequest(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		MaxConcurrentRequests: 5,
		RequestTimeout:        5 * time.Second,
		QueueSize:             10,
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   2,
			QueueSize: 5,
		},
	}

	cam, err := NewConcurrentAIManager(config, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Setup mock response
	expectedResponse := &AIResponse{
		Content:    "Test response",
		Type:       "text",
		Confidence: 0.9,
		Model:      "test-model",
	}

	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(expectedResponse, nil)

	// Test request processing
	req := &AIRequest{
		Query:   "Test query",
		UserID:  "test-user",
		Context: map[string]interface{}{"test": "context"},
	}

	ctx := context.Background()
	response, err := cam.ProcessRequest(ctx, req)

	assert.NoError(t, err)
	assert.NotNil(t, response)
	assert.Equal(t, "Test response", response.Content)
	assert.Equal(t, "text", response.Type)

	mockAI.AssertExpectations(t)
}

// TestConcurrentAIManager_ProcessRequestError tests error handling
func TestConcurrentAIManager_ProcessRequestError(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Setup mock error
	expectedError := errors.New("AI processing failed")
	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(nil, expectedError)

	req := &AIRequest{
		Query:  "Test query",
		UserID: "test-user",
	}

	ctx := context.Background()
	response, err := cam.ProcessRequest(ctx, req)

	assert.Error(t, err)
	assert.Nil(t, response)

	mockAI.AssertExpectations(t)
}

// TestConcurrentAIManager_ProcessRequestTimeout tests request timeout
func TestConcurrentAIManager_ProcessRequestTimeout(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		RequestTimeout: 100 * time.Millisecond,
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   1,
			QueueSize: 1,
		},
	}

	cam, err := NewConcurrentAIManager(config, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Setup mock with delay
	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(
		func(ctx context.Context, req *AIRequest) *AIResponse {
			time.Sleep(200 * time.Millisecond)
			return &AIResponse{Content: "Delayed response"}
		},
		func(ctx context.Context, req *AIRequest) error {
			time.Sleep(200 * time.Millisecond)
			return nil
		},
	)

	req := &AIRequest{
		Query:  "Test query",
		UserID: "test-user",
	}

	ctx := context.Background()
	response, err := cam.ProcessRequest(ctx, req)

	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "timeout")
}

// TestConcurrentAIManager_ProcessConcurrentRequests tests batch processing
func TestConcurrentAIManager_ProcessConcurrentRequests(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		MaxConcurrentRequests: 10,
		RequestTimeout:        5 * time.Second,
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   3,
			QueueSize: 10,
		},
	}

	cam, err := NewConcurrentAIManager(config, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Setup mock responses
	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(
		&AIResponse{
			Content:    "Response",
			Type:       "text",
			Confidence: 0.8,
		}, nil)

	// Create multiple requests
	requests := []*AIRequest{
		{Query: "Query 1", UserID: "user1"},
		{Query: "Query 2", UserID: "user2"},
		{Query: "Query 3", UserID: "user3"},
	}

	ctx := context.Background()
	responses, err := cam.ProcessConcurrentRequests(ctx, requests)

	assert.NoError(t, err)
	assert.Len(t, responses, 3)

	for _, response := range responses {
		assert.NotNil(t, response)
		assert.Equal(t, "Response", response.Content)
	}

	mockAI.AssertExpectations(t)
}

// TestConcurrentAIManager_RateLimiting tests rate limiting
func TestConcurrentAIManager_RateLimiting(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		RateLimiterConfig: RateLimiterConfig{
			Name:              "test-limiter",
			RequestsPerSecond: 1, // Very low rate
			BurstCapacity:     1,
		},
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   1,
			QueueSize: 5,
		},
	}

	cam, err := NewConcurrentAIManager(config, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(
		&AIResponse{Content: "Response"}, nil)

	req := &AIRequest{
		Query:  "Test query",
		UserID: "test-user",
	}

	ctx := context.Background()

	// First request should succeed
	response, err := cam.ProcessRequest(ctx, req)
	assert.NoError(t, err)
	assert.NotNil(t, response)

	// Second request should be rate limited
	response, err = cam.ProcessRequest(ctx, req)
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "rate limit")
}

// TestConcurrentAIManager_CircuitBreaker tests circuit breaker functionality
func TestConcurrentAIManager_CircuitBreaker(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	config := &ConcurrentAIConfig{
		CircuitBreakerConfig: CircuitBreakerConfig{
			Name:         "test-breaker",
			MaxFailures:  2,
			ResetTimeout: 100 * time.Millisecond,
		},
		RateLimiterConfig: RateLimiterConfig{
			RequestsPerSecond: 100, // High rate to avoid rate limiting
			BurstCapacity:     10,
		},
		WorkerPoolConfig: WorkerPoolConfig{
			Workers:   2,
			QueueSize: 5,
		},
	}

	cam, err := NewConcurrentAIManager(config, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Setup mock to fail
	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(
		nil, errors.New("AI service error"))

	req := &AIRequest{
		Query:  "Test query",
		UserID: "test-user",
	}

	ctx := context.Background()

	// Fail enough times to open circuit breaker
	for i := 0; i < 3; i++ {
		response, err := cam.ProcessRequest(ctx, req)
		assert.Error(t, err)
		assert.Nil(t, response)
	}

	// Next request should be rejected by circuit breaker
	response, err := cam.ProcessRequest(ctx, req)
	assert.Error(t, err)
	assert.Nil(t, response)
	assert.Contains(t, err.Error(), "circuit breaker")
}

// TestConcurrentAIManager_Metrics tests metrics collection
func TestConcurrentAIManager_Metrics(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, mockAI, monitoring)
	require.NoError(t, err)

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	mockAI.On("ProcessQuery", mock.Anything, mock.Anything).Return(
		&AIResponse{Content: "Response"}, nil)

	req := &AIRequest{
		Query:  "Test query",
		UserID: "test-user",
	}

	ctx := context.Background()

	// Process some requests
	for i := 0; i < 3; i++ {
		cam.ProcessRequest(ctx, req)
	}

	// Check metrics
	metrics := cam.GetMetrics()
	assert.Greater(t, metrics.TotalRequests, int64(0))
	assert.Greater(t, metrics.CompletedRequests, int64(0))
}

// TestConcurrentAIManager_Status tests status reporting
func TestConcurrentAIManager_Status(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, mockAI, monitoring)
	require.NoError(t, err)

	status := cam.GetStatus()
	assert.Contains(t, status, "running")
	assert.Contains(t, status, "worker_pool")
	assert.Contains(t, status, "rate_limiter")
	assert.Contains(t, status, "circuit_breaker")
}

// TestConcurrentAIManager_HealthCheck tests health checking
func TestConcurrentAIManager_HealthCheck(t *testing.T) {
	mockAI := &MockAIService{}
	monitoring := monitoring.NewService()

	cam, err := NewConcurrentAIManager(nil, mockAI, monitoring)
	require.NoError(t, err)

	// Should be unhealthy when not running
	assert.False(t, cam.IsHealthy())

	err = cam.Start()
	require.NoError(t, err)
	defer cam.Stop()

	// Should be healthy when running
	assert.True(t, cam.IsHealthy())
}
