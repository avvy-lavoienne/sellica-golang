package silpana

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

// GetTicketProgressHandler handles GET requests for ticket progress
// Endpoint: GET /api/v1/silpana/tickets/:code/progress
// Access: Public (guest mode compatible)
func (s *Service) GetTicketProgressHandler(c *gin.Context) {
	ticketCode := c.Param("code")
	if ticketCode == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"success": false,
			"error":   "Kode tiket tidak valid",
		})
		return
	}

	// Get progress data
	progress, err := s.GetTicketProgress(c.Request.Context(), ticketCode)
	if err != nil {
		logrus.WithError(err).WithField("ticket_code", ticketCode).Error("Failed to get ticket progress")
		
		// Determine appropriate status code
		statusCode := http.StatusInternalServerError
		errorMessage := "Gagal mengambil data progress tiket"
		
		if err.Error() == "tiket tidak ditemukan" {
			statusCode = http.StatusNotFound
			errorMessage = "Tiket tidak ditemukan"
		} else if err.Error() == "progress tracking belum tersedia untuk tiket ini" {
			statusCode = http.StatusNotFound
			errorMessage = "Progress tracking belum tersedia untuk tiket ini"
		}
		
		c.JSON(statusCode, gin.H{
			"success": false,
			"error":   errorMessage,
		})
		return
	}

	// Record metrics
	if s.monitoringService != nil {
		s.monitoringService.IncrementCounter("silpana_progress_retrieved", map[string]string{
			"category": progress.Category,
		})
	}

	// Return success response
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    progress,
	})
}
