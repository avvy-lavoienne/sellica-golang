package routes

import (
	"github.com/gin-gonic/gin"

	"selly-backend/internal/api/handlers"
)

// setupSupabaseAnalyzerRoutes configures Supabase analyzer endpoints
func setupSupabaseAnalyzerRoutes(router *gin.Engine, handler *handlers.SupabaseAnalyzerHandler) {
	// API group for Supabase analyzer endpoints
	api := router.Group("/api/v1/supabase")
	{
		// Full project analysis
		api.GET("/analyze", handler.AnalyzeProject)               // GET /api/v1/supabase/analyze - Full analysis (tables + buckets + columns)
		api.GET("/overview", handler.GetProjectOverview)         // GET /api/v1/supabase/overview - Quick overview

		// Table analysis
		api.GET("/tables/:name", handler.GetTableStats)          // GET /api/v1/supabase/tables/:name - Statistics for specific table

		// Bucket analysis
		api.GET("/buckets", handler.ListBuckets)                 // GET /api/v1/supabase/buckets - List all buckets

		// Query parameters for /analyze:
		// ?tables=true - Include table analysis (default: true)
		// ?buckets=true - Include bucket analysis (default: true)
		// ?columns=true - Include column details (default: true)
	}
}
