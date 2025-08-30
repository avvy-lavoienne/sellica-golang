package eventbus

import (
	"context"
	"fmt"
	"sync"
	"sync/atomic"
	"time"

	"github.com/sirupsen/logrus"
)

// RealTimePropagator provides real-time data propagation across services
// with intelligent routing, fault tolerance, and priority-based processing
type RealTimePropagator struct {
	// Configuration
	config *PropagatorConfig

	// Core components
	eventBus         *Service
	propagationRules *PropagationRulesEngine
	circuitBreaker   *CircuitBreaker
	priorityQueues   map[Priority]*PriorityQueue

	// Worker pool management
	workers       []*PropagationWorker
	workerWg      sync.WaitGroup
	// activeWorkers int32 // atomic counter for active worker count - removed unused field

	// State management
	isRunning int32 // atomic boolean
	stopChan  chan struct{}

	// Metrics and monitoring
	metrics      *PropagationMetrics
	lastActivity time.Time
}

// PropagatorConfig holds configuration for the real-time propagator
type PropagatorConfig struct {
	// Worker pool settings
	WorkerCount       int           `yaml:"worker_count"`
	MaxQueueSize      int           `yaml:"max_queue_size"`
	WorkerTimeout     time.Duration `yaml:"worker_timeout"`

	// Circuit breaker settings
	CircuitBreakerEnabled bool          `yaml:"circuit_breaker_enabled"`
	FailureThreshold      int           `yaml:"failure_threshold"`
	RecoveryTimeout       time.Duration `yaml:"recovery_timeout"`
	SuccessThreshold      int           `yaml:"success_threshold"`

	// Priority queue settings
	HighPriorityQueueSize   int `yaml:"high_priority_queue_size"`
	NormalPriorityQueueSize int `yaml:"normal_priority_queue_size"`
	LowPriorityQueueSize    int `yaml:"low_priority_queue_size"`

	// Processing settings
	ProcessingTimeout time.Duration `yaml:"processing_timeout"`
	RetryAttempts     int           `yaml:"retry_attempts"`
	BackoffMultiplier float64       `yaml:"backoff_multiplier"`

	// Monitoring
	EnableMetrics     bool          `yaml:"enable_metrics"`
	MetricsInterval   time.Duration `yaml:"metrics_interval"`
}

// PropagationRulesEngine handles intelligent routing of events to target services
type PropagationRulesEngine struct {
	rules       map[EventType][]PropagationRule
	rulesMutex  sync.RWMutex
	targets     map[string]*ServiceTarget
	targetsMutex sync.RWMutex
}

// PropagationRule defines how events should be routed to target services
type PropagationRule struct {
	ID          string                 `json:"id"`
	EventType   EventType             `json:"event_type"`
	Conditions  []PropagationCondition `json:"conditions"`
	Targets     []string               `json:"targets"`
	Priority    Priority               `json:"priority"`
	Enabled     bool                   `json:"enabled"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
}

// PropagationCondition defines conditions for event routing
type PropagationCondition struct {
	Field    string      `json:"field"`
	Operator string      `json:"operator"`
	Value    interface{} `json:"value"`
	Weight   float64     `json:"weight"`
}

// ServiceTarget represents a target service for event propagation
type ServiceTarget struct {
	Name         string        `json:"name"`
	Endpoint     string        `json:"endpoint"`
	HealthCheck  string        `json:"health_check"`
	Timeout      time.Duration `json:"timeout"`
	MaxRetries   int           `json:"max_retries"`
	Enabled      bool          `json:"enabled"`
	LastHealthCheck time.Time  `json:"last_health_check"`
	IsHealthy    bool          `json:"is_healthy"`
}

// CircuitBreaker provides fault tolerance for service-to-service communication
type CircuitBreaker struct {
	name            string
	state           CircuitBreakerState
	failureCount    int
	successCount    int
	lastFailureTime time.Time
	config          *CircuitBreakerConfig
	mu              sync.RWMutex
}

// CircuitBreakerState represents the current state of the circuit breaker
type CircuitBreakerState int

const (
	CircuitClosed CircuitBreakerState = iota
	CircuitOpen
	CircuitHalfOpen
)

// CircuitBreakerConfig holds circuit breaker configuration
type CircuitBreakerConfig struct {
	FailureThreshold int           `yaml:"failure_threshold"`
	RecoveryTimeout  time.Duration `yaml:"recovery_timeout"`
	SuccessThreshold int           `yaml:"success_threshold"`
}

// PriorityQueue provides priority-based event queuing
type PriorityQueue struct {
	queue    chan *PropagationTask
	priority Priority
	size     int
	mu       sync.RWMutex
}

// PropagationTask represents a task for event propagation
type PropagationTask struct {
	ID            string                 `json:"id"`
	Event         *Event                 `json:"event"`
	Targets       []string               `json:"targets"`
	Priority      Priority               `json:"priority"`
	RetryCount    int                    `json:"retry_count"`
	MaxRetries    int                    `json:"max_retries"`
	CreatedAt     time.Time              `json:"created_at"`
	Deadline      time.Time              `json:"deadline"`
	Status        PropagationTaskStatus  `json:"status"`
	Error         error                  `json:"error,omitempty"`
	Metadata      map[string]interface{} `json:"metadata,omitempty"`
}

// PropagationTaskStatus represents the status of a propagation task
type PropagationTaskStatus int

const (
	TaskPending PropagationTaskStatus = iota
	TaskProcessing
	TaskCompleted
	TaskFailed
	TaskRetrying
	TaskCancelled
)

// PropagationWorker handles the actual propagation of events to target services
type PropagationWorker struct {
	ID             int
	propagator     *RealTimePropagator
	queue          *PriorityQueue
	stopChan       chan struct{}
	isActive       int32 // atomic boolean
	processedTasks int64 // atomic counter
}

// PropagationMetrics tracks propagation performance and health
type PropagationMetrics struct {
	TasksQueued         int64         `json:"tasks_queued"`
	TasksProcessed      int64         `json:"tasks_processed"`
	TasksFailed         int64         `json:"tasks_failed"`
	TasksRetried        int64         `json:"tasks_retried"`
	AverageProcessingTime time.Duration `json:"avg_processing_time"`
	ActiveWorkers       int32         `json:"active_workers"`
	QueueDepth          int64         `json:"queue_depth"`
	CircuitBreakerState string        `json:"circuit_breaker_state"`
	mu                  sync.RWMutex
}

// NewRealTimePropagator creates a new real-time propagator instance
func NewRealTimePropagator(eventBus *Service, config *PropagatorConfig) (*RealTimePropagator, error) {
	if config == nil {
		config = DefaultPropagatorConfig()
	}

	// Initialize priority queues
	priorityQueues := make(map[Priority]*PriorityQueue)
	priorityQueues[PriorityHigh] = NewPriorityQueue(config.HighPriorityQueueSize, PriorityHigh)
	priorityQueues[PriorityNormal] = NewPriorityQueue(config.NormalPriorityQueueSize, PriorityNormal)
	priorityQueues[PriorityLow] = NewPriorityQueue(config.LowPriorityQueueSize, PriorityLow)

	// Initialize propagation rules engine
	rulesEngine := &PropagationRulesEngine{
		rules:   make(map[EventType][]PropagationRule),
		targets: make(map[string]*ServiceTarget),
	}

	// Initialize circuit breaker
	var circuitBreaker *CircuitBreaker
	if config.CircuitBreakerEnabled {
		circuitBreaker = NewCircuitBreaker("propagation-circuit-breaker", &CircuitBreakerConfig{
			FailureThreshold: config.FailureThreshold,
			RecoveryTimeout:  config.RecoveryTimeout,
			SuccessThreshold: config.SuccessThreshold,
		})
	}

	propagator := &RealTimePropagator{
		config:          config,
		eventBus:        eventBus,
		propagationRules: rulesEngine,
		circuitBreaker:  circuitBreaker,
		priorityQueues:  priorityQueues,
		workers:         make([]*PropagationWorker, config.WorkerCount),
		stopChan:        make(chan struct{}),
		metrics:         &PropagationMetrics{},
		lastActivity:    time.Now(),
	}

	// Initialize default propagation rules
	err := propagator.initializeDefaultRules()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize default rules: %w", err)
	}

	// Initialize default service targets
	err = propagator.initializeDefaultTargets()
	if err != nil {
		return nil, fmt.Errorf("failed to initialize default targets: %w", err)
	}

	logrus.Info("✅ Real-time propagator initialized")
	return propagator, nil
}

// Start initializes and starts the real-time propagator
func (rtp *RealTimePropagator) Start(ctx context.Context) error {
	if atomic.LoadInt32(&rtp.isRunning) == 1 {
		return fmt.Errorf("real-time propagator is already running")
	}

	logrus.WithFields(logrus.Fields{
		"worker_count": rtp.config.WorkerCount,
		"circuit_breaker_enabled": rtp.config.CircuitBreakerEnabled,
	}).Info("🚀 Starting real-time propagator")

	// Mark as running
	atomic.StoreInt32(&rtp.isRunning, 1)

	// Start worker pool
	err := rtp.startWorkerPool()
	if err != nil {
		atomic.StoreInt32(&rtp.isRunning, 0)
		return fmt.Errorf("failed to start worker pool: %w", err)
	}

	// Subscribe to relevant events
	err = rtp.setupEventSubscriptions()
	if err != nil {
		rtp.Stop()
		return fmt.Errorf("failed to setup event subscriptions: %w", err)
	}

	// Start metrics collection if enabled
	if rtp.config.EnableMetrics {
		go rtp.collectMetrics()
	}

	logrus.Info("✅ Real-time propagator started successfully")
	return nil
}

// Stop gracefully shuts down the real-time propagator
func (rtp *RealTimePropagator) Stop() error {
	if atomic.LoadInt32(&rtp.isRunning) == 0 {
		return fmt.Errorf("real-time propagator is not running")
	}

	logrus.Info("🛑 Stopping real-time propagator...")

	// Mark as not running
	atomic.StoreInt32(&rtp.isRunning, 0)

	// Signal workers to stop by closing their individual stop channels
	for _, worker := range rtp.workers {
		if worker != nil && worker.stopChan != nil {
			close(worker.stopChan)
		}
	}

	// Signal main stop channel
	close(rtp.stopChan)

	// Wait for workers to finish
	rtp.workerWg.Wait()

	// Close all priority queues
	for _, queue := range rtp.priorityQueues {
		queue.Close()
	}

	logrus.Info("✅ Real-time propagator stopped successfully")
	return nil
}

// IsRunning returns whether the propagator is running
func (rtp *RealTimePropagator) IsRunning() bool {
	return atomic.LoadInt32(&rtp.isRunning) == 1
}

// PropagateEvent propagates an event to target services based on routing rules
func (rtp *RealTimePropagator) PropagateEvent(ctx context.Context, event *Event) error {
	if !rtp.IsRunning() {
		return fmt.Errorf("real-time propagator is not running")
	}

	if event == nil {
		return fmt.Errorf("event cannot be nil")
	}

	rtp.lastActivity = time.Now()

	// Determine target services using propagation rules
	targets, priority, err := rtp.propagationRules.DetermineTargets(event)
	if err != nil {
		return fmt.Errorf("failed to determine targets: %w", err)
	}

	if len(targets) == 0 {
		logrus.WithField("event_type", event.Type).Debug("No propagation targets found")
		return nil
	}

	// Create propagation task
	task := &PropagationTask{
		ID:         generatePropagationTaskID(),
		Event:      event,
		Targets:    targets,
		Priority:   priority,
		MaxRetries: rtp.config.RetryAttempts,
		CreatedAt:  time.Now(),
		Deadline:   time.Now().Add(rtp.config.ProcessingTimeout),
		Status:     TaskPending,
		Metadata:   make(map[string]interface{}),
	}

	// Queue task based on priority
	queue, exists := rtp.priorityQueues[priority]
	if !exists {
		return fmt.Errorf("no queue available for priority: %v", priority)
	}

	err = queue.Enqueue(task)
	if err != nil {
		atomic.AddInt64(&rtp.metrics.TasksFailed, 1)
		return fmt.Errorf("failed to queue propagation task: %w", err)
	}

	atomic.AddInt64(&rtp.metrics.TasksQueued, 1)
	rtp.lastActivity = time.Now()

	logrus.WithFields(logrus.Fields{
		"task_id":  task.ID,
		"event_id": event.ID,
		"targets":  len(targets),
		"priority": priority,
	}).Info("📤 Propagation task queued")

	return nil
}

// AddPropagationRule adds a new propagation rule
func (rtp *RealTimePropagator) AddPropagationRule(rule PropagationRule) error {
	rtp.propagationRules.AddRule(rule)
	logrus.WithFields(logrus.Fields{
		"rule_id":    rule.ID,
		"event_type": rule.EventType,
		"targets":    len(rule.Targets),
	}).Info("📋 Propagation rule added")
	return nil
}

// AddServiceTarget adds a new service target
func (rtp *RealTimePropagator) AddServiceTarget(target *ServiceTarget) error {
	rtp.propagationRules.AddTarget(target)
	logrus.WithFields(logrus.Fields{
		"target_name": target.Name,
		"endpoint":    target.Endpoint,
	}).Info("🎯 Service target added")
	return nil
}

// GetMetrics returns current propagation metrics
func (rtp *RealTimePropagator) GetMetrics() PropagationMetrics {
	rtp.metrics.mu.RLock()
	defer rtp.metrics.mu.RUnlock()

	// Calculate queue depth
	var totalQueueDepth int64
	for _, queue := range rtp.priorityQueues {
		totalQueueDepth += int64(queue.Len())
	}

	return PropagationMetrics{
		TasksQueued:          atomic.LoadInt64(&rtp.metrics.TasksQueued),
		TasksProcessed:       atomic.LoadInt64(&rtp.metrics.TasksProcessed),
		TasksFailed:          atomic.LoadInt64(&rtp.metrics.TasksFailed),
		TasksRetried:         atomic.LoadInt64(&rtp.metrics.TasksRetried),
		AverageProcessingTime: rtp.metrics.AverageProcessingTime,
		ActiveWorkers:        atomic.LoadInt32(&rtp.metrics.ActiveWorkers),
		QueueDepth:           totalQueueDepth,
		CircuitBreakerState:  rtp.getCircuitBreakerState(),
	}
}

// initializeDefaultRules sets up default propagation rules
func (rtp *RealTimePropagator) initializeDefaultRules() error {
	defaultRules := []PropagationRule{
		// User data propagation
		{
			ID:        "user_data_propagation",
			EventType: EventTypeDataUpdated,
			Conditions: []PropagationCondition{
				{Field: "data_type", Operator: "equals", Value: "user_profile", Weight: 1.0},
			},
			Targets:  []string{"cache_service", "analytics_service", "notification_service"},
			Priority: PriorityHigh,
			Enabled:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Document processing propagation
		{
			ID:        "document_processing_propagation",
			EventType: EventTypeDataCreated,
			Conditions: []PropagationCondition{
				{Field: "data_type", Operator: "contains", Value: "document", Weight: 1.0},
			},
			Targets:  []string{"document_processor", "search_index", "compliance_service"},
			Priority: PriorityHigh,
			Enabled:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Chat message propagation
		{
			ID:        "chat_message_propagation",
			EventType: EventTypeChatMessage,
			Conditions: []PropagationCondition{
				{Field: "message_type", Operator: "equals", Value: "user_message", Weight: 1.0},
			},
			Targets:  []string{"ai_service", "moderation_service", "analytics_service"},
			Priority: PriorityNormal,
			Enabled:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},

		// Cache invalidation propagation
		{
			ID:        "cache_invalidation_propagation",
			EventType: EventTypeCacheInvalidate,
			Conditions: []PropagationCondition{
				{Field: "pattern", Operator: "exists", Value: nil, Weight: 1.0},
			},
			Targets:  []string{"cache_service", "cdn_service"},
			Priority: PriorityCritical,
			Enabled:  true,
			CreatedAt: time.Now(),
			UpdatedAt: time.Now(),
		},
	}

	for _, rule := range defaultRules {
		rtp.propagationRules.AddRule(rule)
	}

	logrus.WithField("rules_count", len(defaultRules)).Info("📋 Default propagation rules initialized")
	return nil
}

// initializeDefaultTargets sets up default service targets
func (rtp *RealTimePropagator) initializeDefaultTargets() error {
	defaultTargets := []*ServiceTarget{
		{
			Name:        "cache_service",
			Endpoint:    "http://localhost:8081/cache",
			HealthCheck: "http://localhost:8081/health",
			Timeout:     5 * time.Second,
			MaxRetries:  3,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "analytics_service",
			Endpoint:    "http://localhost:8082/analytics",
			HealthCheck: "http://localhost:8082/health",
			Timeout:     10 * time.Second,
			MaxRetries:  2,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "document_processor",
			Endpoint:    "http://localhost:8083/process",
			HealthCheck: "http://localhost:8083/health",
			Timeout:     30 * time.Second,
			MaxRetries:  3,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "search_index",
			Endpoint:    "http://localhost:8084/index",
			HealthCheck: "http://localhost:8084/health",
			Timeout:     15 * time.Second,
			MaxRetries:  2,
			Enabled:     true,
			IsHealthy:   true,
		},
		{
			Name:        "ai_service",
			Endpoint:    "http://localhost:8085/ai",
			HealthCheck: "http://localhost:8085/health",
			Timeout:     60 * time.Second,
			MaxRetries:  1,
			Enabled:     true,
			IsHealthy:   true,
		},
	}

	for _, target := range defaultTargets {
		rtp.propagationRules.AddTarget(target)
	}

	logrus.WithField("targets_count", len(defaultTargets)).Info("🎯 Default service targets initialized")
	return nil
}

// startWorkerPool initializes and starts the worker pool
func (rtp *RealTimePropagator) startWorkerPool() error {
	atomic.StoreInt32(&rtp.metrics.ActiveWorkers, 0)

	// Distribute workers across priority queues
	workersPerQueue := rtp.config.WorkerCount / 3
	if workersPerQueue < 1 {
		workersPerQueue = 1
	}

	workerIndex := 0

	// Create workers for high priority queue
	for i := 0; i < workersPerQueue && workerIndex < rtp.config.WorkerCount; i++ {
		worker := &PropagationWorker{
			ID:         workerIndex,
			propagator: rtp,
			queue:      rtp.priorityQueues[PriorityHigh],
			stopChan:   make(chan struct{}),
		}

		rtp.workers[workerIndex] = worker
		rtp.workerWg.Add(1)

		go worker.Start()
		atomic.AddInt32(&rtp.metrics.ActiveWorkers, 1)
		workerIndex++
	}

	// Create workers for normal priority queue
	for i := 0; i < workersPerQueue && workerIndex < rtp.config.WorkerCount; i++ {
		worker := &PropagationWorker{
			ID:         workerIndex,
			propagator: rtp,
			queue:      rtp.priorityQueues[PriorityNormal],
			stopChan:   make(chan struct{}),
		}

		rtp.workers[workerIndex] = worker
		rtp.workerWg.Add(1)

		go worker.Start()
		atomic.AddInt32(&rtp.metrics.ActiveWorkers, 1)
		workerIndex++
	}

	// Create remaining workers for low priority queue
	for workerIndex < rtp.config.WorkerCount {
		worker := &PropagationWorker{
			ID:         workerIndex,
			propagator: rtp,
			queue:      rtp.priorityQueues[PriorityLow],
			stopChan:   make(chan struct{}),
		}

		rtp.workers[workerIndex] = worker
		rtp.workerWg.Add(1)

		go worker.Start()
		atomic.AddInt32(&rtp.metrics.ActiveWorkers, 1)
		workerIndex++
	}

	logrus.WithField("worker_count", rtp.config.WorkerCount).Info("👷 Propagation worker pool started")
	return nil
}

// setupEventSubscriptions subscribes to relevant events for propagation
func (rtp *RealTimePropagator) setupEventSubscriptions() error {
	// Subscribe to data events that need propagation
	dataEvents := []EventType{
		EventTypeDataCreated,
		EventTypeDataUpdated,
		EventTypeDataDeleted,
		EventTypeCacheInvalidate,
		EventTypeChatMessage,
		EventTypeAIRequest,
	}

	for _, eventType := range dataEvents {
		_, err := rtp.eventBus.Subscribe([]EventType{eventType}, rtp.handlePropagationEvent)
		if err != nil {
			return fmt.Errorf("failed to subscribe to %s: %w", eventType, err)
		}
	}

	logrus.WithField("event_types", len(dataEvents)).Info("📥 Event subscriptions established")
	return nil
}

// handlePropagationEvent handles incoming events for propagation
func (rtp *RealTimePropagator) handlePropagationEvent(ctx context.Context, event *Event) error {
	return rtp.PropagateEvent(ctx, event)
}

// collectMetrics periodically collects and logs metrics
func (rtp *RealTimePropagator) collectMetrics() {
	ticker := time.NewTicker(rtp.config.MetricsInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			metrics := rtp.GetMetrics()

			if rtp.config.EnableMetrics {
				logrus.WithFields(logrus.Fields{
					"tasks_queued":     metrics.TasksQueued,
					"tasks_processed":  metrics.TasksProcessed,
					"tasks_failed":     metrics.TasksFailed,
					"active_workers":   metrics.ActiveWorkers,
					"queue_depth":      metrics.QueueDepth,
					"circuit_breaker":  metrics.CircuitBreakerState,
				}).Info("📊 Propagation metrics")
			}

		case <-rtp.stopChan:
			return
		}
	}
}

// getCircuitBreakerState returns the current circuit breaker state as string
func (rtp *RealTimePropagator) getCircuitBreakerState() string {
	if rtp.circuitBreaker == nil {
		return "disabled"
	}

	switch state := rtp.circuitBreaker.GetState(); state {
	case CircuitClosed:
		return "closed"
	case CircuitOpen:
		return "open"
	case CircuitHalfOpen:
		return "half-open"
	default:
		return "unknown"
	}
}

// DefaultPropagatorConfig returns default configuration for the propagator
func DefaultPropagatorConfig() *PropagatorConfig {
	return &PropagatorConfig{
		WorkerCount:            10,
		MaxQueueSize:           1000,
		WorkerTimeout:          30 * time.Second,

		CircuitBreakerEnabled:  true,
		FailureThreshold:       5,
		RecoveryTimeout:        60 * time.Second,
		SuccessThreshold:       3,

		HighPriorityQueueSize:   200,
		NormalPriorityQueueSize: 500,
		LowPriorityQueueSize:    300,

		ProcessingTimeout:      30 * time.Second,
		RetryAttempts:          3,
		BackoffMultiplier:      2.0,

		EnableMetrics:          true,
		MetricsInterval:        30 * time.Second,
	}
}

// NewPriorityQueue creates a new priority queue with specified size and priority
func NewPriorityQueue(size int, priority Priority) *PriorityQueue {
	return &PriorityQueue{
		queue:    make(chan *PropagationTask, size),
		priority: priority,
		size:     size,
	}
}

// Enqueue adds a task to the priority queue
func (pq *PriorityQueue) Enqueue(task *PropagationTask) error {
	pq.mu.Lock()
	defer pq.mu.Unlock()

	select {
	case pq.queue <- task:
		return nil
	default:
		return fmt.Errorf("priority queue is full (priority: %v)", pq.priority)
	}
}

// Len returns the current length of the queue
func (pq *PriorityQueue) Len() int {
	pq.mu.RLock()
	defer pq.mu.RUnlock()
	return len(pq.queue)
}

// Close closes the priority queue
func (pq *PriorityQueue) Close() {
	pq.mu.Lock()
	defer pq.mu.Unlock()
	close(pq.queue)
}

// NewCircuitBreaker creates a new circuit breaker instance
func NewCircuitBreaker(name string, config *CircuitBreakerConfig) *CircuitBreaker {
	return &CircuitBreaker{
		name:   name,
		state:  CircuitClosed,
		config: config,
	}
}

// GetState returns the current state of the circuit breaker
func (cb *CircuitBreaker) GetState() CircuitBreakerState {
	cb.mu.RLock()
	defer cb.mu.RUnlock()
	return cb.state
}

// DetermineTargets determines the target services for an event based on routing rules
func (pre *PropagationRulesEngine) DetermineTargets(event *Event) ([]string, Priority, error) {
	pre.rulesMutex.RLock()
	defer pre.rulesMutex.RUnlock()

	rules, exists := pre.rules[event.Type]
	if !exists || len(rules) == 0 {
		return nil, PriorityNormal, fmt.Errorf("no rules found for event type: %s", event.Type)
	}

	var bestRule *PropagationRule
	var bestScore float64
	var bestPriority Priority

	for _, rule := range rules {
		if !rule.Enabled {
			continue
		}

		score := pre.evaluateRule(&rule, event)
		if score > bestScore {
			bestScore = score
			bestRule = &rule
			bestPriority = rule.Priority
		}
	}

	if bestRule == nil {
		return nil, PriorityNormal, fmt.Errorf("no suitable rule found for event")
	}

	// Filter enabled targets
	var enabledTargets []string
	for _, targetName := range bestRule.Targets {
		if target, exists := pre.targets[targetName]; exists && target.Enabled && target.IsHealthy {
			enabledTargets = append(enabledTargets, targetName)
		}
	}

	if len(enabledTargets) == 0 {
		return nil, PriorityNormal, fmt.Errorf("no enabled and healthy targets found")
	}

	return enabledTargets, bestPriority, nil
}

// evaluateRule evaluates a propagation rule against an event
func (pre *PropagationRulesEngine) evaluateRule(rule *PropagationRule, event *Event) float64 {
	score := 0.0
	totalWeight := 0.0

	for _, condition := range rule.Conditions {
		totalWeight += condition.Weight

		if pre.evaluateCondition(&condition, event) {
			score += condition.Weight
		}
	}

	if totalWeight > 0 {
		return score / totalWeight
	}

	return 0.0
}

// evaluateCondition evaluates a single propagation condition
func (pre *PropagationRulesEngine) evaluateCondition(condition *PropagationCondition, event *Event) bool {
	// Extract field value from event
	var fieldValue interface{}

	switch condition.Field {
	case "event_type":
		fieldValue = event.Type
	case "priority":
		fieldValue = event.Priority
	case "source":
		fieldValue = event.Source
	default:
		// Try to get from payload
		if event.Payload != nil {
			if payloadMap, ok := event.Payload.(map[string]interface{}); ok {
				fieldValue = payloadMap[condition.Field]
			}
		}
		// Try to get from metadata
		if event.Metadata != nil {
			fieldValue = event.Metadata[condition.Field]
		}
	}

	// Evaluate based on operator
	switch condition.Operator {
	case "equals":
		return fieldValue == condition.Value
	case "contains":
		if str, ok := fieldValue.(string); ok {
			if valStr, ok := condition.Value.(string); ok {
				return len(str) > 0 && len(valStr) > 0 && containsString(str, valStr)
			}
		}
	case "exists":
		return fieldValue != nil
	case "greater_than":
		if num, ok := fieldValue.(float64); ok {
			if valNum, ok := condition.Value.(float64); ok {
				return num > valNum
			}
		}
	}

	return false
}

// AddRule adds a new propagation rule
func (pre *PropagationRulesEngine) AddRule(rule PropagationRule) {
	pre.rulesMutex.Lock()
	defer pre.rulesMutex.Unlock()

	rule.CreatedAt = time.Now()
	rule.UpdatedAt = time.Now()

	pre.rules[rule.EventType] = append(pre.rules[rule.EventType], rule)
}

// AddTarget adds a new service target
func (pre *PropagationRulesEngine) AddTarget(target *ServiceTarget) {
	pre.targetsMutex.Lock()
	defer pre.targetsMutex.Unlock()

	target.LastHealthCheck = time.Now()
	pre.targets[target.Name] = target
}

// Start starts the propagation worker
func (pw *PropagationWorker) Start() {
	defer pw.propagator.workerWg.Done()

	logrus.WithField("worker_id", pw.ID).Debug("👷 Propagation worker started")

	atomic.StoreInt32(&pw.isActive, 1)
	defer atomic.StoreInt32(&pw.isActive, 0)

	for {
		select {
		case task, ok := <-pw.queue.queue:
			if !ok {
				logrus.WithField("worker_id", pw.ID).Debug("👷 Propagation worker stopping - queue closed")
				return
			}

			pw.processTask(task)

		case <-pw.stopChan:
			logrus.WithField("worker_id", pw.ID).Debug("👷 Propagation worker stopping - signal received")
			return
		}
	}
}

// processTask processes a single propagation task
func (pw *PropagationWorker) processTask(task *PropagationTask) {
	start := time.Now()
	task.Status = TaskProcessing

	logrus.WithFields(logrus.Fields{
		"worker_id": pw.ID,
		"task_id":   task.ID,
		"targets":   len(task.Targets),
	}).Debug("🔨 Processing propagation task")

	// Check circuit breaker
	if pw.propagator.circuitBreaker != nil && pw.propagator.circuitBreaker.GetState() == CircuitOpen {
		task.Status = TaskFailed
		task.Error = fmt.Errorf("circuit breaker is open")
		atomic.AddInt64(&pw.propagator.metrics.TasksFailed, 1)
		logrus.WithField("task_id", task.ID).Warn("❌ Task failed - circuit breaker open")
		return
	}

	// Process task with retry logic
	err := pw.executeWithRetry(task)
	if err != nil {
		task.Status = TaskFailed
		task.Error = err
		atomic.AddInt64(&pw.propagator.metrics.TasksFailed, 1)

		// Record circuit breaker failure
		if pw.propagator.circuitBreaker != nil {
			pw.propagator.circuitBreaker.RecordFailure()
		}

		logrus.WithError(err).WithField("task_id", task.ID).Error("❌ Propagation task failed")
	} else {
		task.Status = TaskCompleted
		atomic.AddInt64(&pw.propagator.metrics.TasksProcessed, 1)

		// Record circuit breaker success
		if pw.propagator.circuitBreaker != nil {
			pw.propagator.circuitBreaker.RecordSuccess()
		}

		logrus.WithField("task_id", task.ID).Info("✅ Propagation task completed")
	}

	// Update processing time
	duration := time.Since(start)
	pw.updateAverageProcessingTime(duration)
	atomic.AddInt64(&pw.processedTasks, 1)
}

// executeWithRetry executes a task with retry logic
func (pw *PropagationWorker) executeWithRetry(task *PropagationTask) error {
	var lastError error

	for attempt := 0; attempt <= task.MaxRetries; attempt++ {
		if attempt > 0 {
			// Exponential backoff
			backoff := time.Duration(float64(time.Second) * pw.propagator.config.BackoffMultiplier * float64(attempt))
			time.Sleep(backoff)
			atomic.AddInt64(&pw.propagator.metrics.TasksRetried, 1)
			task.RetryCount = attempt
		}

		err := pw.propagateToTargets(task)
		if err == nil {
			return nil
		}

		lastError = err
		logrus.WithError(err).WithFields(logrus.Fields{
			"task_id": task.ID,
			"attempt": attempt + 1,
		}).Warn("Propagation attempt failed")
	}

	return fmt.Errorf("all retry attempts failed: %w", lastError)
}

// propagateToTargets propagates the event to all target services
func (pw *PropagationWorker) propagateToTargets(task *PropagationTask) error {
	var lastError error
	successCount := 0

	for _, targetName := range task.Targets {
		err := pw.propagateToTarget(task, targetName)
		if err != nil {
			lastError = err
			logrus.WithError(err).WithFields(logrus.Fields{
				"task_id": task.ID,
				"target":  targetName,
			}).Error("Failed to propagate to target")
		} else {
			successCount++
		}
	}

	// Return error if no targets succeeded
	if successCount == 0 && len(task.Targets) > 0 {
		return lastError
	}

	return nil
}

// propagateToTarget propagates the event to a specific target service
func (pw *PropagationWorker) propagateToTarget(task *PropagationTask, targetName string) error {
	target, exists := pw.propagator.propagationRules.targets[targetName]
	if !exists {
		return fmt.Errorf("target not found: %s", targetName)
	}

	if !target.Enabled || !target.IsHealthy {
		return fmt.Errorf("target not available: %s", targetName)
	}

	// Create context with timeout
	ctx, cancel := context.WithTimeout(context.Background(), target.Timeout)
	defer cancel()

	// Simulate HTTP request to target service
	// In production, this would make actual HTTP calls
	err := pw.simulateServiceCall(ctx, target, task)
	if err != nil {
		return fmt.Errorf("service call failed: %w", err)
	}

	return nil
}

// simulateServiceCall simulates calling a target service
func (pw *PropagationWorker) simulateServiceCall(ctx context.Context, target *ServiceTarget, task *PropagationTask) error {
	// Use parameters for logging (to avoid unused parameter warnings)
	_ = target // target is used for service identification in production
	_ = task   // task contains event data for processing

	// Simulate network delay
	select {
	case <-time.After(50 * time.Millisecond):
		// Simulate occasional failures for testing
		if time.Now().UnixNano()%100 < 5 { // 5% failure rate
			return fmt.Errorf("simulated service failure")
		}
		return nil
	case <-ctx.Done():
		return ctx.Err()
	}
}

// updateAverageProcessingTime updates the average processing time
func (pw *PropagationWorker) updateAverageProcessingTime(duration time.Duration) {
	pw.propagator.metrics.mu.Lock()
	defer pw.propagator.metrics.mu.Unlock()

	if pw.propagator.metrics.AverageProcessingTime == 0 {
		pw.propagator.metrics.AverageProcessingTime = duration
	} else {
		// Exponential moving average
		pw.propagator.metrics.AverageProcessingTime = time.Duration(
			0.9*float64(pw.propagator.metrics.AverageProcessingTime) + 0.1*float64(duration),
		)
	}
}

// RecordFailure records a failure in the circuit breaker
func (cb *CircuitBreaker) RecordFailure() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	cb.failureCount++
	cb.lastFailureTime = time.Now()

	if cb.failureCount >= cb.config.FailureThreshold {
		cb.state = CircuitOpen
		logrus.WithField("circuit_breaker", cb.name).Warn("🔌 Circuit breaker opened")
	}
}

// RecordSuccess records a success in the circuit breaker
func (cb *CircuitBreaker) RecordSuccess() {
	cb.mu.Lock()
	defer cb.mu.Unlock()

	switch cb.state {
	case CircuitHalfOpen:
		cb.successCount++
		if cb.successCount >= cb.config.SuccessThreshold {
			cb.state = CircuitClosed
			cb.failureCount = 0
			cb.successCount = 0
			logrus.WithField("circuit_breaker", cb.name).Info("🔌 Circuit breaker closed")
		}
	case CircuitClosed:
		cb.failureCount = 0
	}
}


// generatePropagationTaskID generates a unique task ID
func generatePropagationTaskID() string {
	return "prop_" + time.Now().Format("20060102150405") + "_" + randomString(8)
}