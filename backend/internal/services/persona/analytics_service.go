package persona

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// AnalyticsService provides comprehensive analytics for persona performance
type AnalyticsService struct {
	metricsCollector  *MetricsCollector
	reportGenerator   *ReportGenerator
	alertManager      *AlertManager
	dataAggregator    *DataAggregator
	enabled           bool
	reportingInterval time.Duration
}

// MetricsCollector collects various performance metrics
type MetricsCollector struct {
	metrics         map[string]*MetricSeries
	realTimeMetrics map[string]*RealTimeMetric
	enabled         bool
	mu              sync.RWMutex
}

// ReportGenerator generates comprehensive reports
type ReportGenerator struct {
	templates        map[string]*ReportTemplate
	scheduledReports map[string]*ScheduledReport
	enabled          bool
	mu               sync.RWMutex
}

// AlertManager manages alerts and notifications
type AlertManager struct {
	rules        []AlertRule
	activeAlerts map[string]*Alert
	alertHistory []*Alert
	enabled      bool
	mu           sync.RWMutex
}

// DataAggregator aggregates data from multiple sources
type DataAggregator struct {
	aggregationRules []AggregationRule
	aggregatedData   map[string]*AggregatedData
	enabled          bool
}

// MetricSeries represents a time series of metrics
type MetricSeries struct {
	Name        string                 `json:"name"`
	Type        string                 `json:"type"` // counter, gauge, histogram
	Unit        string                 `json:"unit"`
	DataPoints  []DataPoint            `json:"data_points"`
	Labels      map[string]string      `json:"labels"`
	Metadata    map[string]interface{} `json:"metadata"`
	LastUpdated time.Time              `json:"last_updated"`
}

// DataPoint represents a single metric data point
type DataPoint struct {
	Timestamp time.Time              `json:"timestamp"`
	Value     float64                `json:"value"`
	Labels    map[string]string      `json:"labels"`
	Metadata  map[string]interface{} `json:"metadata"`
}

// RealTimeMetric represents real-time metrics
type RealTimeMetric struct {
	Name            string                 `json:"name"`
	CurrentValue    float64                `json:"current_value"`
	PreviousValue   float64                `json:"previous_value"`
	ChangeRate      float64                `json:"change_rate"`
	Trend           string                 `json:"trend"` // increasing, decreasing, stable
	LastUpdated     time.Time              `json:"last_updated"`
	UpdateFrequency time.Duration          `json:"update_frequency"`
	Metadata        map[string]interface{} `json:"metadata"`
}

// ReportTemplate defines report structure
type ReportTemplate struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Sections    []ReportSection        `json:"sections"`
	Format      string                 `json:"format"` // json, html, pdf
	Metadata    map[string]interface{} `json:"metadata"`
}

// ReportSection represents a section in a report
type ReportSection struct {
	Title    string                 `json:"title"`
	Type     string                 `json:"type"` // metrics, chart, table, text
	Content  interface{}            `json:"content"`
	Filters  map[string]interface{} `json:"filters"`
	Metadata map[string]interface{} `json:"metadata"`
}

// ScheduledReport represents a scheduled report
type ScheduledReport struct {
	ID         string    `json:"id"`
	TemplateID string    `json:"template_id"`
	Schedule   string    `json:"schedule"` // cron expression
	Recipients []string  `json:"recipients"`
	Enabled    bool      `json:"enabled"`
	LastRun    time.Time `json:"last_run"`
	NextRun    time.Time `json:"next_run"`
	RunCount   int       `json:"run_count"`
}

// AlertRule defines alert conditions
type AlertRule struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Description string                 `json:"description"`
	Metric      string                 `json:"metric"`
	Condition   string                 `json:"condition"` // gt, lt, eq, ne
	Threshold   float64                `json:"threshold"`
	Duration    time.Duration          `json:"duration"`
	Severity    string                 `json:"severity"` // low, medium, high, critical
	Enabled     bool                   `json:"enabled"`
	Actions     []AlertAction          `json:"actions"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// Alert represents an active alert
type Alert struct {
	ID        string                 `json:"id"`
	RuleID    string                 `json:"rule_id"`
	RuleName  string                 `json:"rule_name"`
	Severity  string                 `json:"severity"`
	Status    string                 `json:"status"` // active, resolved, suppressed
	Message   string                 `json:"message"`
	StartTime time.Time              `json:"start_time"`
	EndTime   *time.Time             `json:"end_time,omitempty"`
	Duration  time.Duration          `json:"duration"`
	Value     float64                `json:"value"`
	Threshold float64                `json:"threshold"`
	Metadata  map[string]interface{} `json:"metadata"`
}

// AlertAction defines actions to take when alert triggers
type AlertAction struct {
	Type     string                 `json:"type"` // email, webhook, log
	Target   string                 `json:"target"`
	Template string                 `json:"template"`
	Enabled  bool                   `json:"enabled"`
	Metadata map[string]interface{} `json:"metadata"`
}

// AggregationRule defines how to aggregate data
type AggregationRule struct {
	ID            string                 `json:"id"`
	Name          string                 `json:"name"`
	SourceMetrics []string               `json:"source_metrics"`
	Function      string                 `json:"function"` // sum, avg, min, max, count
	GroupBy       []string               `json:"group_by"`
	TimeWindow    time.Duration          `json:"time_window"`
	Enabled       bool                   `json:"enabled"`
	Metadata      map[string]interface{} `json:"metadata"`
}

// AggregatedData represents aggregated metric data
type AggregatedData struct {
	RuleID      string                 `json:"rule_id"`
	Value       float64                `json:"value"`
	Count       int64                  `json:"count"`
	TimeWindow  time.Duration          `json:"time_window"`
	LastUpdated time.Time              `json:"last_updated"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// AnalyticsReport represents a generated analytics report
type AnalyticsReport struct {
	ID          string                 `json:"id"`
	Title       string                 `json:"title"`
	Description string                 `json:"description"`
	GeneratedAt time.Time              `json:"generated_at"`
	TimeRange   TimeRange              `json:"time_range"`
	Sections    []ReportSection        `json:"sections"`
	Summary     map[string]interface{} `json:"summary"`
	Metadata    map[string]interface{} `json:"metadata"`
}

// TimeRange represents a time range for reports
type TimeRange struct {
	Start time.Time `json:"start"`
	End   time.Time `json:"end"`
}

// NewAnalyticsService creates a new analytics service
func NewAnalyticsService() *AnalyticsService {
	return &AnalyticsService{
		metricsCollector: &MetricsCollector{
			metrics:         make(map[string]*MetricSeries),
			realTimeMetrics: make(map[string]*RealTimeMetric),
			enabled:         true,
		},
		reportGenerator: &ReportGenerator{
			templates:        make(map[string]*ReportTemplate),
			scheduledReports: make(map[string]*ScheduledReport),
			enabled:          true,
		},
		alertManager: &AlertManager{
			rules:        createDefaultAlertRules(),
			activeAlerts: make(map[string]*Alert),
			alertHistory: []*Alert{},
			enabled:      true,
		},
		dataAggregator: &DataAggregator{
			aggregationRules: createDefaultAggregationRules(),
			aggregatedData:   make(map[string]*AggregatedData),
			enabled:          true,
		},
		enabled:           true,
		reportingInterval: 5 * time.Minute,
	}
}

// RecordMetric records a metric value
func (as *AnalyticsService) RecordMetric(ctx context.Context, name string, value float64, labels map[string]string) error {
	if !as.enabled || !as.metricsCollector.enabled {
		return nil
	}

	as.metricsCollector.mu.Lock()
	defer as.metricsCollector.mu.Unlock()

	series, exists := as.metricsCollector.metrics[name]
	if !exists {
		series = &MetricSeries{
			Name:       name,
			Type:       "gauge",
			Unit:       "count",
			DataPoints: []DataPoint{},
			Labels:     make(map[string]string),
			Metadata:   make(map[string]interface{}),
		}
		as.metricsCollector.metrics[name] = series
	}

	dataPoint := DataPoint{
		Timestamp: time.Now(),
		Value:     value,
		Labels:    labels,
		Metadata:  make(map[string]interface{}),
	}

	series.DataPoints = append(series.DataPoints, dataPoint)
	series.LastUpdated = time.Now()

	// Keep only last 1000 data points to prevent memory issues
	if len(series.DataPoints) > 1000 {
		series.DataPoints = series.DataPoints[len(series.DataPoints)-1000:]
	}

	// Update real-time metrics
	as.updateRealTimeMetric(name, value)

	// Check alert rules
	go as.checkAlertRules(name, value)

	logrus.WithFields(logrus.Fields{
		"metric": name,
		"value":  value,
		"labels": labels,
	}).Debug("Metric recorded")

	return nil
}

// updateRealTimeMetric updates real-time metric data
func (as *AnalyticsService) updateRealTimeMetric(name string, value float64) {
	realTimeMetric, exists := as.metricsCollector.realTimeMetrics[name]
	if !exists {
		realTimeMetric = &RealTimeMetric{
			Name:            name,
			CurrentValue:    value,
			PreviousValue:   0,
			ChangeRate:      0,
			Trend:           "stable",
			LastUpdated:     time.Now(),
			UpdateFrequency: 1 * time.Minute,
			Metadata:        make(map[string]interface{}),
		}
		as.metricsCollector.realTimeMetrics[name] = realTimeMetric
	} else {
		realTimeMetric.PreviousValue = realTimeMetric.CurrentValue
		realTimeMetric.CurrentValue = value

		if realTimeMetric.PreviousValue != 0 {
			realTimeMetric.ChangeRate = (value - realTimeMetric.PreviousValue) / realTimeMetric.PreviousValue * 100
		}

		// Determine trend
		if realTimeMetric.ChangeRate > 5 {
			realTimeMetric.Trend = "increasing"
		} else if realTimeMetric.ChangeRate < -5 {
			realTimeMetric.Trend = "decreasing"
		} else {
			realTimeMetric.Trend = "stable"
		}

		realTimeMetric.LastUpdated = time.Now()
	}
}

// checkAlertRules checks if any alert rules are triggered
func (as *AnalyticsService) checkAlertRules(metricName string, value float64) {
	if !as.alertManager.enabled {
		return
	}

	as.alertManager.mu.Lock()
	defer as.alertManager.mu.Unlock()

	for _, rule := range as.alertManager.rules {
		if !rule.Enabled || rule.Metric != metricName {
			continue
		}

		triggered := false
		switch rule.Condition {
		case "gt":
			triggered = value > rule.Threshold
		case "lt":
			triggered = value < rule.Threshold
		case "eq":
			triggered = value == rule.Threshold
		case "ne":
			triggered = value != rule.Threshold
		}

		if triggered {
			alertID := fmt.Sprintf("%s_%d", rule.ID, time.Now().Unix())
			alert := &Alert{
				ID:        alertID,
				RuleID:    rule.ID,
				RuleName:  rule.Name,
				Severity:  rule.Severity,
				Status:    "active",
				Message:   fmt.Sprintf("Alert: %s - Value %.2f %s threshold %.2f", rule.Name, value, rule.Condition, rule.Threshold),
				StartTime: time.Now(),
				Value:     value,
				Threshold: rule.Threshold,
				Metadata:  make(map[string]interface{}),
			}

			as.alertManager.activeAlerts[alertID] = alert
			as.alertManager.alertHistory = append(as.alertManager.alertHistory, alert)

			// Execute alert actions
			go as.executeAlertActions(rule, alert)

			logrus.WithFields(logrus.Fields{
				"alert_id":  alertID,
				"rule_name": rule.Name,
				"severity":  rule.Severity,
				"value":     value,
				"threshold": rule.Threshold,
			}).Warn("Alert triggered")
		}
	}
}

// executeAlertActions executes actions for triggered alerts
func (as *AnalyticsService) executeAlertActions(rule AlertRule, alert *Alert) {
	for _, action := range rule.Actions {
		if !action.Enabled {
			continue
		}

		switch action.Type {
		case "log":
			logrus.WithFields(logrus.Fields{
				"alert_id":  alert.ID,
				"rule_name": alert.RuleName,
				"severity":  alert.Severity,
				"message":   alert.Message,
			}).Error("Alert action: log")
		case "webhook":
			// In a real implementation, this would send HTTP request to webhook
			logrus.WithFields(logrus.Fields{
				"alert_id": alert.ID,
				"webhook":  action.Target,
			}).Info("Alert action: webhook (simulated)")
		case "email":
			// In a real implementation, this would send email
			logrus.WithFields(logrus.Fields{
				"alert_id":  alert.ID,
				"recipient": action.Target,
			}).Info("Alert action: email (simulated)")
		}
	}
}

// GenerateReport generates an analytics report
func (as *AnalyticsService) GenerateReport(ctx context.Context, templateID string, timeRange TimeRange) (*AnalyticsReport, error) {
	if !as.enabled || !as.reportGenerator.enabled {
		return nil, fmt.Errorf("report generation is disabled")
	}

	as.reportGenerator.mu.RLock()
	template, exists := as.reportGenerator.templates[templateID]
	as.reportGenerator.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("report template not found: %s", templateID)
	}

	report := &AnalyticsReport{
		ID:          fmt.Sprintf("report_%d", time.Now().Unix()),
		Title:       template.Name,
		Description: template.Description,
		GeneratedAt: time.Now(),
		TimeRange:   timeRange,
		Sections:    []ReportSection{},
		Summary:     make(map[string]interface{}),
		Metadata:    make(map[string]interface{}),
	}

	// Generate report sections
	for _, section := range template.Sections {
		reportSection := as.generateReportSection(section, timeRange)
		report.Sections = append(report.Sections, reportSection)
	}

	// Generate summary
	report.Summary = as.generateReportSummary(timeRange)

	logrus.WithFields(logrus.Fields{
		"report_id":   report.ID,
		"template_id": templateID,
		"time_range":  fmt.Sprintf("%s to %s", timeRange.Start, timeRange.End),
	}).Info("Analytics report generated")

	return report, nil
}

// generateReportSection generates a single report section
func (as *AnalyticsService) generateReportSection(section ReportSection, timeRange TimeRange) ReportSection {
	switch section.Type {
	case "metrics":
		return as.generateMetricsSection(section, timeRange)
	case "alerts":
		return as.generateAlertsSection(section, timeRange)
	case "performance":
		return as.generatePerformanceSection(section, timeRange)
	default:
		return section
	}
}

// generateMetricsSection generates metrics section
func (as *AnalyticsService) generateMetricsSection(section ReportSection, timeRange TimeRange) ReportSection {
	as.metricsCollector.mu.RLock()
	defer as.metricsCollector.mu.RUnlock()

	metricsData := make(map[string]interface{})

	for name, series := range as.metricsCollector.metrics {
		// Filter data points by time range
		filteredPoints := []DataPoint{}
		for _, point := range series.DataPoints {
			if point.Timestamp.After(timeRange.Start) && point.Timestamp.Before(timeRange.End) {
				filteredPoints = append(filteredPoints, point)
			}
		}

		if len(filteredPoints) > 0 {
			// Calculate statistics
			var sum, min, max float64
			min = filteredPoints[0].Value
			max = filteredPoints[0].Value

			for _, point := range filteredPoints {
				sum += point.Value
				if point.Value < min {
					min = point.Value
				}
				if point.Value > max {
					max = point.Value
				}
			}

			avg := sum / float64(len(filteredPoints))

			metricsData[name] = map[string]interface{}{
				"count":   len(filteredPoints),
				"sum":     sum,
				"average": avg,
				"min":     min,
				"max":     max,
				"latest":  filteredPoints[len(filteredPoints)-1].Value,
			}
		}
	}

	section.Content = metricsData
	return section
}

// generateAlertsSection generates alerts section
func (as *AnalyticsService) generateAlertsSection(section ReportSection, timeRange TimeRange) ReportSection {
	as.alertManager.mu.RLock()
	defer as.alertManager.mu.RUnlock()

	alertsData := make(map[string]interface{})

	// Filter alerts by time range
	filteredAlerts := []*Alert{}
	for _, alert := range as.alertManager.alertHistory {
		if alert.StartTime.After(timeRange.Start) && alert.StartTime.Before(timeRange.End) {
			filteredAlerts = append(filteredAlerts, alert)
		}
	}

	// Group by severity
	severityCount := make(map[string]int)
	for _, alert := range filteredAlerts {
		severityCount[alert.Severity]++
	}

	alertsData["total_alerts"] = len(filteredAlerts)
	alertsData["by_severity"] = severityCount
	alertsData["active_alerts"] = len(as.alertManager.activeAlerts)

	section.Content = alertsData
	return section
}

// generatePerformanceSection generates performance section
func (as *AnalyticsService) generatePerformanceSection(section ReportSection, _ TimeRange) ReportSection {
	as.metricsCollector.mu.RLock()
	defer as.metricsCollector.mu.RUnlock()

	performanceData := make(map[string]interface{})

	// Get real-time metrics
	realTimeData := make(map[string]interface{})
	for name, metric := range as.metricsCollector.realTimeMetrics {
		realTimeData[name] = map[string]interface{}{
			"current_value": metric.CurrentValue,
			"change_rate":   metric.ChangeRate,
			"trend":         metric.Trend,
			"last_updated":  metric.LastUpdated,
		}
	}

	performanceData["real_time_metrics"] = realTimeData
	performanceData["system_health"] = as.calculateSystemHealth()

	section.Content = performanceData
	return section
}

// generateReportSummary generates report summary
func (as *AnalyticsService) generateReportSummary(timeRange TimeRange) map[string]interface{} {
	summary := make(map[string]interface{})

	as.metricsCollector.mu.RLock()
	totalMetrics := len(as.metricsCollector.metrics)
	totalRealTimeMetrics := len(as.metricsCollector.realTimeMetrics)
	as.metricsCollector.mu.RUnlock()

	as.alertManager.mu.RLock()
	totalActiveAlerts := len(as.alertManager.activeAlerts)
	totalAlertHistory := len(as.alertManager.alertHistory)
	as.alertManager.mu.RUnlock()

	summary["metrics_tracked"] = totalMetrics
	summary["real_time_metrics"] = totalRealTimeMetrics
	summary["active_alerts"] = totalActiveAlerts
	summary["total_alerts_history"] = totalAlertHistory
	summary["system_health"] = as.calculateSystemHealth()
	summary["report_period"] = fmt.Sprintf("%s to %s", timeRange.Start.Format("2006-01-02 15:04:05"), timeRange.End.Format("2006-01-02 15:04:05"))

	return summary
}

// calculateSystemHealth calculates overall system health score
func (as *AnalyticsService) calculateSystemHealth() float64 {
	health := 100.0

	as.alertManager.mu.RLock()
	activeAlerts := len(as.alertManager.activeAlerts)
	as.alertManager.mu.RUnlock()

	// Reduce health based on active alerts
	if activeAlerts > 0 {
		health -= float64(activeAlerts) * 10
		if health < 0 {
			health = 0
		}
	}

	return health
}

// GetMetrics returns current metrics
func (as *AnalyticsService) GetMetrics() map[string]*MetricSeries {
	as.metricsCollector.mu.RLock()
	defer as.metricsCollector.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	metrics := make(map[string]*MetricSeries)
	for name, series := range as.metricsCollector.metrics {
		metrics[name] = series
	}

	return metrics
}

// GetRealTimeMetrics returns current real-time metrics
func (as *AnalyticsService) GetRealTimeMetrics() map[string]*RealTimeMetric {
	as.metricsCollector.mu.RLock()
	defer as.metricsCollector.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	metrics := make(map[string]*RealTimeMetric)
	for name, metric := range as.metricsCollector.realTimeMetrics {
		metrics[name] = metric
	}

	return metrics
}

// GetActiveAlerts returns current active alerts
func (as *AnalyticsService) GetActiveAlerts() map[string]*Alert {
	as.alertManager.mu.RLock()
	defer as.alertManager.mu.RUnlock()

	// Return a copy to prevent concurrent access issues
	alerts := make(map[string]*Alert)
	for id, alert := range as.alertManager.activeAlerts {
		alerts[id] = alert
	}

	return alerts
}

// Helper functions

func createDefaultAlertRules() []AlertRule {
	return []AlertRule{
		{
			ID:          "high_response_time",
			Name:        "High Response Time",
			Description: "Alert when response time exceeds threshold",
			Metric:      "response_time_ms",
			Condition:   "gt",
			Threshold:   1000,
			Duration:    5 * time.Minute,
			Severity:    "high",
			Enabled:     true,
			Actions: []AlertAction{
				{
					Type:    "log",
					Target:  "",
					Enabled: true,
				},
			},
		},
		{
			ID:          "low_success_rate",
			Name:        "Low Success Rate",
			Description: "Alert when success rate drops below threshold",
			Metric:      "success_rate",
			Condition:   "lt",
			Threshold:   0.95,
			Duration:    5 * time.Minute,
			Severity:    "critical",
			Enabled:     true,
			Actions: []AlertAction{
				{
					Type:    "log",
					Target:  "",
					Enabled: true,
				},
			},
		},
	}
}

func createDefaultAggregationRules() []AggregationRule {
	return []AggregationRule{
		{
			ID:            "avg_response_time",
			Name:          "Average Response Time",
			SourceMetrics: []string{"response_time_ms"},
			Function:      "avg",
			TimeWindow:    5 * time.Minute,
			Enabled:       true,
		},
		{
			ID:            "total_requests",
			Name:          "Total Requests",
			SourceMetrics: []string{"request_count"},
			Function:      "sum",
			TimeWindow:    1 * time.Hour,
			Enabled:       true,
		},
	}
}
