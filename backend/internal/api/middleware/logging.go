package middleware

import (
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/monitoring"
)

// LoggingMiddleware provides structured request logging
func LoggingMiddleware(monitoring *monitoring.Service) gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Generate request ID if not present
		requestID := param.Request.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		// Record metrics if monitoring service is available
		if monitoring != nil {
			monitoring.RecordRequest(param.Latency)
			if param.StatusCode >= 400 {
				monitoring.RecordError()
			}
		}

		// Log with structured fields
		logrus.WithFields(logrus.Fields{
			"request_id":    requestID,
			"method":        param.Method,
			"path":          param.Path,
			"status":        param.StatusCode,
			"latency":       param.Latency.Milliseconds(),
			"client_ip":     param.ClientIP,
			"user_agent":    param.Request.UserAgent(),
			"response_size": param.BodySize,
		}).Info("🌐 HTTP Request")

		return ""
	})
}

// RequestIDMiddleware adds a unique request ID to each request
func RequestIDMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		requestID := c.GetHeader("X-Request-ID")
		if requestID == "" {
			requestID = uuid.New().String()
		}

		c.Header("X-Request-ID", requestID)
		c.Set("request_id", requestID)
		c.Next()
	}
}

// ResponseTimeMiddleware adds response time header
func ResponseTimeMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		start := time.Now()
		c.Next()
		duration := time.Since(start)
		c.Header("X-Response-Time", duration.String())
	}
}

// SecurityHeadersMiddleware adds security headers
func SecurityHeadersMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		c.Header("Content-Security-Policy", "default-src 'self'")
		c.Next()
	}
}

// CompressionMiddleware adds gzip compression
func CompressionMiddleware() gin.HandlerFunc {
	// This would typically use gin-contrib/gzip
	// For now, return a placeholder
	return func(c *gin.Context) {
		c.Next()
	}
}
