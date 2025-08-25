package monitoring

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// AlertLevel represents the severity level of an alert
type AlertLevel string

const (
	AlertLevelInfo     AlertLevel = "info"
	AlertLevelWarning  AlertLevel = "warning"
	AlertLevelCritical AlertLevel = "critical"
)

// AlertRule defines conditions for triggering alerts
type AlertRule struct {
	ID          string        `json:"id"`
	Name        string        `json:"name"`
	Description string        `json:"description"`
	Level       AlertLevel    `json:"level"`
	Condition   string        `json:"condition"`
	Threshold   float64       `json:"threshold"`
	Duration    time.Duration `json:"duration"`
	Enabled     bool          `json:"enabled"`
	
	// Notification settings
	NotificationChannels []string `json:"notificationChannels"`
	Cooldown            time.Duration `json:"cooldown"`
	
	// Internal state
	lastTriggered *time.Time `json:"lastTriggered,omitempty"`
	isActive      bool       `json:"isActive"`
}

// AlertEvent represents a triggered alert
type AlertEvent struct {
	ID          string                 `json:"id"`
	RuleID      string                 `json:"ruleId"`
	RuleName    string                 `json:"ruleName"`
	Level       AlertLevel             `json:"level"`
	Message     string                 `json:"message"`
	Timestamp   time.Time              `json:"timestamp"`
	Value       float64                `json:"value"`
	Threshold   float64                `json:"threshold"`
	Context     map[string]interface{} `json:"context"`
	Resolved    bool                   `json:"resolved"`
	ResolvedAt  *time.Time             `json:"resolvedAt,omitempty"`
	
	// Response tracking
	ResponseTime time.Duration `json:"responseTime"`
	Acknowledged bool          `json:"acknowledged"`
	AcknowledgedBy string      `json:"acknowledgedBy,omitempty"`
	AcknowledgedAt *time.Time  `json:"acknowledgedAt,omitempty"`
}

// NotificationChannel defines how alerts are delivered
type NotificationChannel interface {
	Name() string
	Send(ctx context.Context, event *AlertEvent) error
	IsHealthy() bool
}

// AlertManager manages alert rules and notifications
type AlertManager struct {
	rules        map[string]*AlertRule
	events       []AlertEvent
	channels     map[string]NotificationChannel
	mutex        sync.RWMutex
	
	// Configuration
	maxEvents        int
	eventRetention   time.Duration
	responseTarget   time.Duration // Target response time for alerts
	
	// Metrics
	alertsTriggered  int64
	alertsResolved   int64
	avgResponseTime  time.Duration
	
	// Background processing
	ctx    context.Context
	cancel context.CancelFunc
}

// NewAlertManager creates a new alert manager
func NewAlertManager() *AlertManager {
	ctx, cancel := context.WithCancel(context.Background())
	
	am := &AlertManager{
		rules:           make(map[string]*AlertRule),
		events:          make([]AlertEvent, 0),
		channels:        make(map[string]NotificationChannel),
		maxEvents:       1000,
		eventRetention:  24 * time.Hour,
		responseTarget:  5 * time.Second, // <5s response target
		ctx:             ctx,
		cancel:          cancel,
	}
	
	// Start background processing
	go am.processAlerts()
	go am.cleanupEvents()
	
	// Add default alert rules
	am.addDefaultRules()
	
	return am
}

// addDefaultRules adds default alert rules for SELLY AI system
func (am *AlertManager) addDefaultRules() {
	defaultRules := []*AlertRule{
		{
			ID:          "response-time-critical",
			Name:        "High Response Time",
			Description: "Average response time exceeds critical threshold",
			Level:       AlertLevelCritical,
			Condition:   "avg_response_time",
			Threshold:   500.0, // 500ms
			Duration:    2 * time.Minute,
			Enabled:     true,
			NotificationChannels: []string{"console", "webhook"},
			Cooldown:    5 * time.Minute,
		},
		{
			ID:          "error-rate-critical",
			Name:        "High Error Rate",
			Description: "Error rate exceeds critical threshold",
			Level:       AlertLevelCritical,
			Condition:   "error_rate",
			Threshold:   10.0, // 10%
			Duration:    1 * time.Minute,
			Enabled:     true,
			NotificationChannels: []string{"console", "webhook"},
			Cooldown:    5 * time.Minute,
		},
		{
			ID:          "memory-usage-warning",
			Name:        "High Memory Usage",
			Description: "Memory usage exceeds warning threshold",
			Level:       AlertLevelWarning,
			Condition:   "memory_usage",
			Threshold:   80.0, // 80%
			Duration:    5 * time.Minute,
			Enabled:     true,
			NotificationChannels: []string{"console"},
			Cooldown:    10 * time.Minute,
		},
		{
			ID:          "ai-provider-failure",
			Name:        "AI Provider Failure",
			Description: "AI provider is experiencing failures",
			Level:       AlertLevelCritical,
			Condition:   "ai_provider_error_rate",
			Threshold:   50.0, // 50% error rate
			Duration:    30 * time.Second,
			Enabled:     true,
			NotificationChannels: []string{"console", "webhook"},
			Cooldown:    2 * time.Minute,
		},
		{
			ID:          "database-connection-warning",
			Name:        "Database Connection Issues",
			Description: "Database connection pool usage is high",
			Level:       AlertLevelWarning,
			Condition:   "db_connection_usage",
			Threshold:   80.0, // 80% of pool
			Duration:    3 * time.Minute,
			Enabled:     true,
			NotificationChannels: []string{"console"},
			Cooldown:    5 * time.Minute,
		},
		{
			ID:          "selly-training-accuracy",
			Name:        "SELLY Training Accuracy Drop",
			Description: "SELLY training accuracy has dropped below threshold",
			Level:       AlertLevelWarning,
			Condition:   "selly_training_accuracy",
			Threshold:   90.0, // 90%
			Duration:    10 * time.Minute,
			Enabled:     true,
			NotificationChannels: []string{"console"},
			Cooldown:    30 * time.Minute,
		},
	}
	
	for _, rule := range defaultRules {
		am.AddRule(rule)
	}
}

// AddRule adds a new alert rule
func (am *AlertManager) AddRule(rule *AlertRule) {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	
	am.rules[rule.ID] = rule
	logrus.WithField("ruleId", rule.ID).Info("Alert rule added")
}

// RemoveRule removes an alert rule
func (am *AlertManager) RemoveRule(ruleID string) {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	
	delete(am.rules, ruleID)
	logrus.WithField("ruleId", ruleID).Info("Alert rule removed")
}

// AddChannel adds a notification channel
func (am *AlertManager) AddChannel(channel NotificationChannel) {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	
	am.channels[channel.Name()] = channel
	logrus.WithField("channel", channel.Name()).Info("Notification channel added")
}

// EvaluateMetrics evaluates current metrics against alert rules
func (am *AlertManager) EvaluateMetrics(metrics map[string]float64) {
	am.mutex.RLock()
	rules := make([]*AlertRule, 0, len(am.rules))
	for _, rule := range am.rules {
		if rule.Enabled {
			rules = append(rules, rule)
		}
	}
	am.mutex.RUnlock()
	
	for _, rule := range rules {
		am.evaluateRule(rule, metrics)
	}
}

// evaluateRule evaluates a single rule against metrics
func (am *AlertManager) evaluateRule(rule *AlertRule, metrics map[string]float64) {
	value, exists := metrics[rule.Condition]
	if !exists {
		return
	}
	
	now := time.Now()
	shouldTrigger := false
	
	// Check threshold condition
	switch rule.Level {
	case AlertLevelCritical, AlertLevelWarning:
		shouldTrigger = value > rule.Threshold
	case AlertLevelInfo:
		shouldTrigger = value != rule.Threshold
	}
	
	// Check cooldown period
	if rule.lastTriggered != nil && now.Sub(*rule.lastTriggered) < rule.Cooldown {
		return
	}
	
	if shouldTrigger && !rule.isActive {
		// Trigger alert
		event := &AlertEvent{
			ID:        fmt.Sprintf("%s-%d", rule.ID, now.Unix()),
			RuleID:    rule.ID,
			RuleName:  rule.Name,
			Level:     rule.Level,
			Message:   fmt.Sprintf("%s: %.2f (threshold: %.2f)", rule.Description, value, rule.Threshold),
			Timestamp: now,
			Value:     value,
			Threshold: rule.Threshold,
			Context: map[string]interface{}{
				"condition": rule.Condition,
				"duration":  rule.Duration.String(),
			},
			Resolved: false,
		}
		
		am.triggerAlert(rule, event)
		
	} else if !shouldTrigger && rule.isActive {
		// Resolve alert
		am.resolveAlert(rule, value)
	}
}

// triggerAlert triggers a new alert
func (am *AlertManager) triggerAlert(rule *AlertRule, event *AlertEvent) {
	start := time.Now()
	
	am.mutex.Lock()
	rule.isActive = true
	rule.lastTriggered = &event.Timestamp
	am.events = append(am.events, *event)
	am.alertsTriggered++
	am.mutex.Unlock()
	
	// Send notifications with response time tracking
	go func() {
		ctx, cancel := context.WithTimeout(context.Background(), am.responseTarget)
		defer cancel()
		
		for _, channelName := range rule.NotificationChannels {
			if channel, exists := am.channels[channelName]; exists && channel.IsHealthy() {
				if err := channel.Send(ctx, event); err != nil {
					logrus.WithError(err).WithFields(logrus.Fields{
						"channel": channelName,
						"alertId": event.ID,
					}).Error("Failed to send alert notification")
				}
			}
		}
		
		// Record response time
		responseTime := time.Since(start)
		event.ResponseTime = responseTime
		
		// Update average response time
		am.mutex.Lock()
		if am.avgResponseTime == 0 {
			am.avgResponseTime = responseTime
		} else {
			am.avgResponseTime = (am.avgResponseTime + responseTime) / 2
		}
		am.mutex.Unlock()
		
		logrus.WithFields(logrus.Fields{
			"alertId":      event.ID,
			"ruleId":       rule.ID,
			"level":        event.Level,
			"responseTime": responseTime,
			"target":       am.responseTarget,
		}).Info("Alert triggered and notifications sent")
	}()
}

// resolveAlert resolves an active alert
func (am *AlertManager) resolveAlert(rule *AlertRule, currentValue float64) {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	
	rule.isActive = false
	
	// Find and resolve the latest event for this rule
	for i := len(am.events) - 1; i >= 0; i-- {
		if am.events[i].RuleID == rule.ID && !am.events[i].Resolved {
			now := time.Now()
			am.events[i].Resolved = true
			am.events[i].ResolvedAt = &now
			am.alertsResolved++
			
			logrus.WithFields(logrus.Fields{
				"alertId":      am.events[i].ID,
				"ruleId":       rule.ID,
				"currentValue": currentValue,
				"threshold":    rule.Threshold,
			}).Info("Alert resolved")
			
			break
		}
	}
}

// GetActiveAlerts returns all active (unresolved) alerts
func (am *AlertManager) GetActiveAlerts() []AlertEvent {
	am.mutex.RLock()
	defer am.mutex.RUnlock()
	
	var activeAlerts []AlertEvent
	for _, event := range am.events {
		if !event.Resolved {
			activeAlerts = append(activeAlerts, event)
		}
	}
	
	return activeAlerts
}

// GetAlertHistory returns alert history
func (am *AlertManager) GetAlertHistory(limit int) []AlertEvent {
	am.mutex.RLock()
	defer am.mutex.RUnlock()
	
	if limit <= 0 || limit > len(am.events) {
		limit = len(am.events)
	}
	
	// Return most recent events
	start := len(am.events) - limit
	if start < 0 {
		start = 0
	}
	
	history := make([]AlertEvent, limit)
	copy(history, am.events[start:])
	
	return history
}

// GetMetrics returns alerting metrics
func (am *AlertManager) GetMetrics() map[string]interface{} {
	am.mutex.RLock()
	defer am.mutex.RUnlock()
	
	activeCount := 0
	for _, event := range am.events {
		if !event.Resolved {
			activeCount++
		}
	}
	
	return map[string]interface{}{
		"alertsTriggered":   am.alertsTriggered,
		"alertsResolved":    am.alertsResolved,
		"activeAlerts":      activeCount,
		"totalRules":        len(am.rules),
		"avgResponseTime":   am.avgResponseTime.Milliseconds(),
		"responseTarget":    am.responseTarget.Milliseconds(),
		"totalChannels":     len(am.channels),
	}
}

// processAlerts runs the main alert processing loop
func (am *AlertManager) processAlerts() {
	ticker := time.NewTicker(10 * time.Second) // Check every 10 seconds
	defer ticker.Stop()
	
	for {
		select {
		case <-am.ctx.Done():
			return
		case <-ticker.C:
			// This would typically get metrics from the monitoring system
			// For now, we'll let external systems call EvaluateMetrics
		}
	}
}

// cleanupEvents periodically cleans up old events
func (am *AlertManager) cleanupEvents() {
	ticker := time.NewTicker(1 * time.Hour)
	defer ticker.Stop()
	
	for {
		select {
		case <-am.ctx.Done():
			return
		case <-ticker.C:
			am.cleanup()
		}
	}
}

// cleanup removes old events
func (am *AlertManager) cleanup() {
	am.mutex.Lock()
	defer am.mutex.Unlock()
	
	cutoff := time.Now().Add(-am.eventRetention)
	
	// Filter out old events
	filteredEvents := make([]AlertEvent, 0)
	for _, event := range am.events {
		if event.Timestamp.After(cutoff) {
			filteredEvents = append(filteredEvents, event)
		}
	}
	
	am.events = filteredEvents
	
	// Limit total events
	if len(am.events) > am.maxEvents {
		start := len(am.events) - am.maxEvents
		am.events = am.events[start:]
	}
}

// Stop stops the alert manager
func (am *AlertManager) Stop() {
	am.cancel()
}

// ConsoleNotificationChannel sends alerts to console/logs
type ConsoleNotificationChannel struct {
	name string
}

// NewConsoleNotificationChannel creates a console notification channel
func NewConsoleNotificationChannel() *ConsoleNotificationChannel {
	return &ConsoleNotificationChannel{
		name: "console",
	}
}

// Name returns the channel name
func (cnc *ConsoleNotificationChannel) Name() string {
	return cnc.name
}

// Send sends an alert to console
func (cnc *ConsoleNotificationChannel) Send(ctx context.Context, event *AlertEvent) error {
	logLevel := logrus.InfoLevel
	switch event.Level {
	case AlertLevelWarning:
		logLevel = logrus.WarnLevel
	case AlertLevelCritical:
		logLevel = logrus.ErrorLevel
	}
	
	logrus.WithFields(logrus.Fields{
		"alertId":   event.ID,
		"ruleId":    event.RuleID,
		"level":     event.Level,
		"value":     event.Value,
		"threshold": event.Threshold,
	}).Log(logLevel, fmt.Sprintf("🚨 ALERT: %s", event.Message))
	
	return nil
}

// IsHealthy returns true if the channel is healthy
func (cnc *ConsoleNotificationChannel) IsHealthy() bool {
	return true
}

// WebhookNotificationChannel sends alerts via HTTP webhook
type WebhookNotificationChannel struct {
	name    string
	url     string
	client  *http.Client
	healthy bool
}

// NewWebhookNotificationChannel creates a webhook notification channel
func NewWebhookNotificationChannel(name, url string) *WebhookNotificationChannel {
	return &WebhookNotificationChannel{
		name: name,
		url:  url,
		client: &http.Client{
			Timeout: 5 * time.Second,
		},
		healthy: true,
	}
}

// Name returns the channel name
func (wnc *WebhookNotificationChannel) Name() string {
	return wnc.name
}

// Send sends an alert via webhook
func (wnc *WebhookNotificationChannel) Send(ctx context.Context, event *AlertEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		wnc.healthy = false
		return fmt.Errorf("failed to marshal alert event: %w", err)
	}
	
	req, err := http.NewRequestWithContext(ctx, "POST", wnc.url, nil)
	if err != nil {
		wnc.healthy = false
		return fmt.Errorf("failed to create webhook request: %w", err)
	}
	
	req.Header.Set("Content-Type", "application/json")
	
	resp, err := wnc.client.Do(req)
	if err != nil {
		wnc.healthy = false
		return fmt.Errorf("failed to send webhook: %w", err)
	}
	defer resp.Body.Close()
	
	if resp.StatusCode >= 400 {
		wnc.healthy = false
		return fmt.Errorf("webhook returned error status: %d", resp.StatusCode)
	}
	
	wnc.healthy = true
	return nil
}

// IsHealthy returns true if the channel is healthy
func (wnc *WebhookNotificationChannel) IsHealthy() bool {
	return wnc.healthy
}
