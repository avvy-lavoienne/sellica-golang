package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/monitoring"
	"selly-backend/internal/services/supabase_analyzer"
)

// SupabaseAnalyzerHandler handles Supabase project analysis endpoints
type SupabaseAnalyzerHandler struct {
	analyzer   *supabase_analyzer.Service
	monitoring *monitoring.Service
}

// NewSupabaseAnalyzerHandler creates a new Supabase analyzer handler
func NewSupabaseAnalyzerHandler(analyzer *supabase_analyzer.Service, monitoring *monitoring.Service) *SupabaseAnalyzerHandler {
	return &SupabaseAnalyzerHandler{
		analyzer:   analyzer,
		monitoring: monitoring,
	}
}

// AnalyzeProject analyzes the entire Supabase project
// GET /api/v1/supabase/analyze
func (h *SupabaseAnalyzerHandler) AnalyzeProject(c *gin.Context) {
	ctx := c.Request.Context()

	// Get query parameters
	includeTables := c.DefaultQuery("tables", "true") == "true"
	includeBuckets := c.DefaultQuery("buckets", "true") == "true"
	includeColumns := c.DefaultQuery("columns", "true") == "true"

	filter := supabase_analyzer.AnalysisFilter{
		IncludeTables:   includeTables,
		IncludeBuckets:  includeBuckets,
		IncludeColumns:  includeColumns,
		SchemaName:      "public",
		MaxTableResults: 0, // No limit
	}

	// Perform analysis
	analysis, err := h.analyzer.AnalyzeProject(ctx, filter)
	if err != nil {
		logrus.Errorf("Failed to analyze Supabase project: %v", err)
		h.monitoring.RecordError()

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to analyze Supabase project",
			"details": err.Error(),
		})
		return
	}

	h.monitoring.RecordMetric("supabase_project_analyzed", 1, map[string]string{
		"action": "analyze_project",
	})

	c.JSON(http.StatusOK, analysis)
}

// GetTableStats gets statistics for a specific table
// GET /api/v1/supabase/tables/:name
func (h *SupabaseAnalyzerHandler) GetTableStats(c *gin.Context) {
	ctx := c.Request.Context()
	tableName := c.Param("name")

	if tableName == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Table name is required",
		})
		return
	}

	// Get table statistics
	tableInfo, err := h.analyzer.GetTableStats(ctx, tableName)
	if err != nil {
		logrus.Errorf("Failed to get table stats for %s: %v", tableName, err)
		h.monitoring.RecordError()

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get table statistics",
			"details": err.Error(),
		})
		return
	}

	h.monitoring.RecordMetric("supabase_table_stats_retrieved", 1, map[string]string{
		"table": tableName,
	})

	c.JSON(http.StatusOK, tableInfo)
}

// ListBuckets lists all storage buckets
// GET /api/v1/supabase/buckets
func (h *SupabaseAnalyzerHandler) ListBuckets(c *gin.Context) {
	ctx := c.Request.Context()

	// List buckets
	buckets, err := h.analyzer.ListBuckets(ctx)
	if err != nil {
		logrus.Errorf("Failed to list buckets: %v", err)
		h.monitoring.RecordError()

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to list buckets",
			"details": err.Error(),
		})
		return
	}

	h.monitoring.RecordMetric("supabase_buckets_listed", 1, map[string]string{
		"action": "list_buckets",
	})

	c.JSON(http.StatusOK, gin.H{
		"buckets": buckets,
		"count":   len(buckets),
	})
}

// GetProjectOverview gets a quick overview of the project
// GET /api/v1/supabase/overview
func (h *SupabaseAnalyzerHandler) GetProjectOverview(c *gin.Context) {
	ctx := c.Request.Context()

	// Quick analysis without heavy data
	filter := supabase_analyzer.AnalysisFilter{
		IncludeTables:   true,
		IncludeBuckets:  true,
		IncludeColumns:  false, // Skip detailed columns for overview
		SchemaName:      "public",
		MaxTableResults: 100,
	}

	analysis, err := h.analyzer.AnalyzeProject(ctx, filter)
	if err != nil {
		logrus.Errorf("Failed to get project overview: %v", err)
		h.monitoring.RecordError()

		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to get project overview",
			"details": err.Error(),
		})
		return
	}

	// Return overview summary
	c.JSON(http.StatusOK, gin.H{
		"project_url":    analysis.ProjectURL,
		"timestamp":      analysis.Timestamp,
		"table_count":    analysis.TableCount,
		"bucket_count":   analysis.BucketCount,
		"total_records":  analysis.TotalRecords,
		"total_size_gb":  analysis.TotalSizeGB,
		"tables":         analysis.Tables,
		"buckets":        analysis.Buckets,
	})
}
