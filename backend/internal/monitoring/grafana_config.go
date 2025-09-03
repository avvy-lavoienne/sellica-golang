package monitoring

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"

	"github.com/sirupsen/logrus"
)

// GrafanaDashboard represents a Grafana dashboard configuration
type GrafanaDashboard struct {
	ID              int                    `json:"id,omitempty"`
	UID             string                 `json:"uid,omitempty"`
	Title           string                 `json:"title"`
	Tags            []string               `json:"tags"`
	Timezone        string                 `json:"timezone"`
	Refresh         string                 `json:"refresh"`
	SchemaVersion   int                    `json:"schemaVersion"`
	Version         int                    `json:"version"`
	Panels          []GrafanaPanel         `json:"panels"`
	Time            GrafanaTimeRange       `json:"time"`
	Templating      GrafanaTemplating      `json:"templating"`
	Annotations     GrafanaAnnotations     `json:"annotations"`
	Links           []GrafanaLink          `json:"links"`
	GraphTooltip    int                    `json:"graphTooltip"`
	Style           string                 `json:"style"`
	WeekStart       string                 `json:"weekStart"`
}

// GrafanaPanel represents a Grafana dashboard panel
type GrafanaPanel struct {
	ID              int                    `json:"id"`
	Title           string                 `json:"title"`
	Type            string                 `json:"type"`
	GridPos         GrafanaGridPos         `json:"gridPos"`
	Targets         []GrafanaTarget        `json:"targets"`
	FieldConfig     GrafanaFieldConfig     `json:"fieldConfig"`
	Options         interface{}            `json:"options"`
	PluginVersion   string                 `json:"pluginVersion,omitempty"`
	Datasource      GrafanaDatasource      `json:"datasource"`
	TimeFrom        string                 `json:"timeFrom,omitempty"`
	TimeShift       string                 `json:"timeShift,omitempty"`
	Transparent     bool                   `json:"transparent"`
	MaxDataPoints   int                    `json:"maxDataPoints,omitempty"`
	Interval        string                 `json:"interval,omitempty"`
}

// GrafanaTarget represents a query target for a panel
type GrafanaTarget struct {
	Expr           string `json:"expr"`
	RefID          string `json:"refId"`
	LegendFormat   string `json:"legendFormat"`
	Interval       string `json:"interval,omitempty"`
	IntervalFactor int    `json:"intervalFactor,omitempty"`
	Format         string `json:"format,omitempty"`
	Instant        bool   `json:"instant,omitempty"`
}

// GrafanaGridPos represents panel grid position
type GrafanaGridPos struct {
	H int `json:"h"`
	W int `json:"w"`
	X int `json:"x"`
	Y int `json:"y"`
}

// GrafanaFieldConfig represents field configuration
type GrafanaFieldConfig struct {
	Defaults  GrafanaFieldDefaults    `json:"defaults"`
	Overrides []GrafanaFieldOverride  `json:"overrides"`
}

// GrafanaFieldDefaults represents default field settings
type GrafanaFieldDefaults struct {
	Color      GrafanaColor      `json:"color"`
	Mappings   []interface{}     `json:"mappings"`
	Thresholds GrafanaThresholds `json:"thresholds"`
	Custom     interface{}       `json:"custom"`
	Unit       string            `json:"unit,omitempty"`
	Min        interface{}       `json:"min,omitempty"`
	Max        interface{}       `json:"max,omitempty"`
}

// GrafanaColor represents color configuration
type GrafanaColor struct {
	Mode string `json:"mode"`
}

// GrafanaThresholds represents threshold configuration
type GrafanaThresholds struct {
	Mode  string               `json:"mode"`
	Steps []GrafanaThresholdStep `json:"steps"`
}

// GrafanaThresholdStep represents a threshold step
type GrafanaThresholdStep struct {
	Color string      `json:"color"`
	Value interface{} `json:"value"`
}

// GrafanaFieldOverride represents field override configuration
type GrafanaFieldOverride struct {
	Matcher    GrafanaMatcher    `json:"matcher"`
	Properties []GrafanaProperty `json:"properties"`
}

// GrafanaMatcher represents field matcher
type GrafanaMatcher struct {
	ID      string `json:"id"`
	Options string `json:"options"`
}

// GrafanaProperty represents field property
type GrafanaProperty struct {
	ID    string      `json:"id"`
	Value interface{} `json:"value"`
}

// GrafanaDatasource represents datasource configuration
type GrafanaDatasource struct {
	Type string `json:"type"`
	UID  string `json:"uid"`
}

// GrafanaTimeRange represents time range configuration
type GrafanaTimeRange struct {
	From string `json:"from"`
	To   string `json:"to"`
}

// GrafanaTemplating represents templating configuration
type GrafanaTemplating struct {
	List []GrafanaTemplate `json:"list"`
}

// GrafanaTemplate represents a template variable
type GrafanaTemplate struct {
	Name        string        `json:"name"`
	Type        string        `json:"type"`
	Label       string        `json:"label"`
	Description string        `json:"description"`
	Query       string        `json:"query"`
	Refresh     int           `json:"refresh"`
	Options     []interface{} `json:"options"`
	Current     interface{}   `json:"current"`
	Hide        int           `json:"hide"`
	IncludeAll  bool          `json:"includeAll"`
	Multi       bool          `json:"multi"`
	AllValue    string        `json:"allValue,omitempty"`
}

// GrafanaAnnotations represents annotations configuration
type GrafanaAnnotations struct {
	List []GrafanaAnnotation `json:"list"`
}

// GrafanaAnnotation represents an annotation
type GrafanaAnnotation struct {
	BuiltIn    int    `json:"builtIn"`
	Datasource string `json:"datasource"`
	Enable     bool   `json:"enable"`
	Hide       bool   `json:"hide"`
	IconColor  string `json:"iconColor"`
	Name       string `json:"name"`
	Type       string `json:"type"`
}

// GrafanaLink represents a dashboard link
type GrafanaLink struct {
	Icon        string   `json:"icon"`
	Tags        []string `json:"tags"`
	TargetBlank bool     `json:"targetBlank"`
	Title       string   `json:"title"`
	Tooltip     string   `json:"tooltip"`
	Type        string   `json:"type"`
	URL         string   `json:"url"`
}

// GrafanaConfig manages Grafana dashboard configuration
type GrafanaConfig struct {
	dashboards map[string]*GrafanaDashboard
	logger     *logrus.Logger
	outputDir  string
}

// NewGrafanaConfig creates a new Grafana configuration manager
func NewGrafanaConfig(logger *logrus.Logger, outputDir string) *GrafanaConfig {
	return &GrafanaConfig{
		dashboards: make(map[string]*GrafanaDashboard),
		logger:     logger,
		outputDir:  outputDir,
	}
}

// CreateSellyBackendDashboard creates the main Selly Backend monitoring dashboard
func (gc *GrafanaConfig) CreateSellyBackendDashboard() *GrafanaDashboard {
	dashboard := &GrafanaDashboard{
		UID:           "selly-backend-main",
		Title:         "Selly Backend - Phase 3 Monitoring",
		Tags:          []string{"selly", "backend", "monitoring", "phase3"},
		Timezone:      "browser",
		Refresh:       "30s",
		SchemaVersion: 30,
		Version:       1,
		Time: GrafanaTimeRange{
			From: "now-1h",
			To:   "now",
		},
		GraphTooltip: 0,
		Style:        "dark",
		WeekStart:    "",
	}

	panels := []GrafanaPanel{
		gc.createServiceHealthPanel(),
		gc.createRequestRatePanel(),
		gc.createResponseTimePanel(),
		gc.createErrorRatePanel(),
		gc.createResourceUsagePanel(),
		gc.createServiceDependenciesPanel(),
		gc.createRAGPerformancePanel(),
		gc.createCorrelationTracingPanel(),
	}

	dashboard.Panels = panels
	dashboard.Templating = gc.createTemplating()
	dashboard.Annotations = gc.createAnnotations()
	dashboard.Links = gc.createLinks()

	gc.dashboards["main"] = dashboard
	return dashboard
}

// createServiceHealthPanel creates the service health status panel
func (gc *GrafanaConfig) createServiceHealthPanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    1,
		Title: "Service Health Status",
		Type:  "stat",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 0,
			Y: 0,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `selly_service_health{service="$service"}`,
				RefID:        "A",
				LegendFormat: "{{service}}",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
		FieldConfig: GrafanaFieldConfig{
			Defaults: GrafanaFieldDefaults{
				Color: GrafanaColor{Mode: "thresholds"},
				Thresholds: GrafanaThresholds{
					Mode: "absolute",
					Steps: []GrafanaThresholdStep{
						{Color: "red", Value: 0},
						{Color: "yellow", Value: 0.5},
						{Color: "green", Value: 1},
					},
				},
				Mappings: []interface{}{
					map[string]interface{}{
						"options": map[string]interface{}{
							"-1": map[string]interface{}{"text": "Unknown"},
							"0":  map[string]interface{}{"text": "Unhealthy"},
							"0.5": map[string]interface{}{"text": "Degraded"},
							"1":  map[string]interface{}{"text": "Healthy"},
						},
						"type": "value",
					},
				},
			},
		},
	}
}

// createRequestRatePanel creates the request rate panel
func (gc *GrafanaConfig) createRequestRatePanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    2,
		Title: "Request Rate (req/sec)",
		Type:  "timeseries",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 12,
			Y: 0,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `rate(selly_requests_total{service="$service"}[5m])`,
				RefID:        "A",
				LegendFormat: "{{service}} - {{operation}}",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
		FieldConfig: GrafanaFieldConfig{
			Defaults: GrafanaFieldDefaults{
				Color: GrafanaColor{Mode: "palette-classic"},
				Unit:  "reqps",
			},
		},
	}
}

// createResponseTimePanel creates the response time panel
func (gc *GrafanaConfig) createResponseTimePanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    3,
		Title: "Response Time",
		Type:  "timeseries",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 0,
			Y: 8,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `histogram_quantile(0.95, rate(selly_request_duration_seconds_bucket{service="$service"}[5m]))`,
				RefID:        "A",
				LegendFormat: "95th percentile",
			},
			{
				Expr:         `histogram_quantile(0.50, rate(selly_request_duration_seconds_bucket{service="$service"}[5m]))`,
				RefID:        "B",
				LegendFormat: "50th percentile",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
		FieldConfig: GrafanaFieldConfig{
			Defaults: GrafanaFieldDefaults{
				Color: GrafanaColor{Mode: "palette-classic"},
				Unit:  "s",
			},
		},
	}
}

// createErrorRatePanel creates the error rate panel
func (gc *GrafanaConfig) createErrorRatePanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    4,
		Title: "Error Rate",
		Type:  "timeseries",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 12,
			Y: 8,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `rate(selly_errors_total{service="$service"}[5m])`,
				RefID:        "A",
				LegendFormat: "{{service}} - {{error_type}}",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
		FieldConfig: GrafanaFieldConfig{
			Defaults: GrafanaFieldDefaults{
				Color: GrafanaColor{Mode: "palette-classic"},
				Unit:  "errps",
			},
		},
	}
}

// createResourceUsagePanel creates the resource usage panel
func (gc *GrafanaConfig) createResourceUsagePanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    5,
		Title: "Resource Usage",
		Type:  "timeseries",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 0,
			Y: 16,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `selly_memory_usage_mb{service="$service"}`,
				RefID:        "A",
				LegendFormat: "Memory (MB)",
			},
			{
				Expr:         `selly_cpu_usage_percent{service="$service"}`,
				RefID:        "B",
				LegendFormat: "CPU (%)",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
		FieldConfig: GrafanaFieldConfig{
			Defaults: GrafanaFieldDefaults{
				Color: GrafanaColor{Mode: "palette-classic"},
			},
		},
	}
}

// createServiceDependenciesPanel creates the service dependencies panel
func (gc *GrafanaConfig) createServiceDependenciesPanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    6,
		Title: "Service Dependencies",
		Type:  "nodeGraph",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 12,
			Y: 16,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `selly_dependency_health{service="$service"}`,
				RefID:        "A",
				LegendFormat: "{{dependency}}",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
	}
}

// createRAGPerformancePanel creates the RAG performance panel
func (gc *GrafanaConfig) createRAGPerformancePanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    7,
		Title: "RAG System Performance",
		Type:  "timeseries",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 0,
			Y: 24,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `rate(selly_rag_queries_total[5m])`,
				RefID:        "A",
				LegendFormat: "RAG Queries/sec",
			},
			{
				Expr:         `histogram_quantile(0.95, rate(selly_rag_query_duration_seconds_bucket[5m]))`,
				RefID:        "B",
				LegendFormat: "95th Percentile Latency",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
		FieldConfig: GrafanaFieldConfig{
			Defaults: GrafanaFieldDefaults{
				Color: GrafanaColor{Mode: "palette-classic"},
			},
		},
	}
}

// createCorrelationTracingPanel creates the correlation tracing panel
func (gc *GrafanaConfig) createCorrelationTracingPanel() GrafanaPanel {
	return GrafanaPanel{
		ID:    8,
		Title: "Request Correlation Traces",
		Type:  "table",
		GridPos: GrafanaGridPos{
			H: 8,
			W: 12,
			X: 12,
			Y: 24,
		},
		Targets: []GrafanaTarget{
			{
				Expr:         `selly_correlation_traces{service="$service"}`,
				RefID:        "A",
				LegendFormat: "{{correlation_id}}",
				Format:       "table",
			},
		},
		Datasource: GrafanaDatasource{
			Type: "prometheus",
			UID:  "prometheus",
		},
	}
}

// createTemplating creates dashboard template variables
func (gc *GrafanaConfig) createTemplating() GrafanaTemplating {
	return GrafanaTemplating{
		List: []GrafanaTemplate{
			{
				Name:        "service",
				Type:        "query",
				Label:       "Service",
				Description: "Select service to monitor",
				Query:       `label_values(selly_service_health, service)`,
				Refresh:     1,
				IncludeAll:  true,
				Multi:       true,
				AllValue:    ".*",
				Current: map[string]interface{}{
					"selected": true,
					"text":     "All",
					"value":    "$__all",
				},
			},
		},
	}
}

// createAnnotations creates dashboard annotations
func (gc *GrafanaConfig) createAnnotations() GrafanaAnnotations {
	return GrafanaAnnotations{
		List: []GrafanaAnnotation{
			{
				BuiltIn:    1,
				Datasource: "-- Grafana --",
				Enable:     true,
				Hide:       true,
				IconColor:  "rgba(0, 211, 255, 1)",
				Name:       "Annotations & Alerts",
				Type:       "dashboard",
			},
		},
	}
}

// createLinks creates dashboard links
func (gc *GrafanaConfig) createLinks() []GrafanaLink {
	return []GrafanaLink{
		{
			Icon:        "external link",
			Tags:        []string{},
			TargetBlank: true,
			Title:       "Prometheus",
			Tooltip:     "Open Prometheus UI",
			Type:        "link",
			URL:         "http://localhost:9090",
		},
		{
			Icon:        "external link",
			Tags:        []string{},
			TargetBlank: true,
			Title:       "Service Documentation",
			Tooltip:     "Open service documentation",
			Type:        "link",
			URL:         "/docs",
		},
	}
}

// SaveDashboard saves a dashboard to a JSON file
func (gc *GrafanaConfig) SaveDashboard(name string, dashboard *GrafanaDashboard) error {
	if err := os.MkdirAll(gc.outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}
	
	data, err := json.MarshalIndent(dashboard, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal dashboard: %w", err)
	}
	
	filename := filepath.Join(gc.outputDir, fmt.Sprintf("%s.json", name))
	if err := ioutil.WriteFile(filename, data, 0644); err != nil {
		return fmt.Errorf("failed to write dashboard file: %w", err)
	}
	
	gc.logger.WithFields(logrus.Fields{
		"dashboard": name,
		"file":      filename,
	}).Info("Saved Grafana dashboard")
	
	return nil
}

// SaveAllDashboards saves all configured dashboards
func (gc *GrafanaConfig) SaveAllDashboards() error {
	for name, dashboard := range gc.dashboards {
		if err := gc.SaveDashboard(name, dashboard); err != nil {
			return err
		}
	}
	return nil
}

// LoadDashboard loads a dashboard from a JSON file
func (gc *GrafanaConfig) LoadDashboard(filename string) (*GrafanaDashboard, error) {
	data, err := ioutil.ReadFile(filename)
	if err != nil {
		return nil, fmt.Errorf("failed to read dashboard file: %w", err)
	}
	
	var dashboard GrafanaDashboard
	if err := json.Unmarshal(data, &dashboard); err != nil {
		return nil, fmt.Errorf("failed to unmarshal dashboard: %w", err)
	}
	
	return &dashboard, nil
}

// GetDashboard returns a dashboard by name
func (gc *GrafanaConfig) GetDashboard(name string) (*GrafanaDashboard, bool) {
	dashboard, exists := gc.dashboards[name]
	return dashboard, exists
}

// ListDashboards returns all dashboard names
func (gc *GrafanaConfig) ListDashboards() []string {
	var names []string
	for name := range gc.dashboards {
		names = append(names, name)
	}
	return names
}
