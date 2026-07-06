package routes

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

// setupSupabaseAnalyzerRoutes configures Supabase analyzer endpoints
// All endpoints are deprecated - return HTTP 410 Gone
func setupSupabaseAnalyzerRoutes(router *gin.Engine) {
	deprecated := func(c *gin.Context) {
		c.JSON(http.StatusGone, gin.H{
			"error":   "Endpoint deprecated",
			"message": "Supabase analyzer endpoints are not in scope",
		})
	}

	router.GET("/api/v1/supabase/analyze", deprecated)
	router.GET("/api/v1/supabase/overview", deprecated)
	router.GET("/api/v1/supabase/tables/:name", deprecated)
	router.GET("/api/v1/supabase/buckets", deprecated)
}
