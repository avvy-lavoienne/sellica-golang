package training

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/sirupsen/logrus"
)

// buildSelectQuery builds a SELECT query based on request parameters
func (s *Service) buildSelectQuery(req *TrainingDataRequest) string {
	query := `
		SELECT 
			id, query, response, user_id, session_id, timestamp,
			classification, metadata, quality, status, created_at, updated_at
		FROM training_data
		WHERE 1=1
	`

	conditions := []string{}
	
	if req.UserID != "" {
		conditions = append(conditions, "user_id = $%d")
	}
	if req.SessionID != "" {
		conditions = append(conditions, "session_id = $%d")
	}
	if req.ServiceType != "" {
		conditions = append(conditions, "classification->>'service_type' = $%d")
	}
	if req.Status != "" {
		conditions = append(conditions, "status = $%d")
	}
	if req.StartDate != nil {
		conditions = append(conditions, "timestamp >= $%d")
	}
	if req.EndDate != nil {
		conditions = append(conditions, "timestamp <= $%d")
	}
	if req.MinQuality > 0 {
		conditions = append(conditions, "quality->>'overall_score' >= $%d")
	}

	// Add conditions to query
	paramIndex := 1
	for _, condition := range conditions {
		query += " AND " + fmt.Sprintf(condition, paramIndex)
		paramIndex++
	}

	// Add ordering
	query += " ORDER BY timestamp DESC"

	// Add pagination
	if req.Limit > 0 {
		query += fmt.Sprintf(" LIMIT $%d", paramIndex)
		paramIndex++
	}
	if req.Offset > 0 {
		query += fmt.Sprintf(" OFFSET $%d", paramIndex)
	}

	return query
}

// buildQueryArgs builds query arguments based on request parameters
func (s *Service) buildQueryArgs(req *TrainingDataRequest) []interface{} {
	var args []interface{}

	if req.UserID != "" {
		args = append(args, req.UserID)
	}
	if req.SessionID != "" {
		args = append(args, req.SessionID)
	}
	if req.ServiceType != "" {
		args = append(args, req.ServiceType)
	}
	if req.Status != "" {
		args = append(args, string(req.Status))
	}
	if req.StartDate != nil {
		args = append(args, *req.StartDate)
	}
	if req.EndDate != nil {
		args = append(args, *req.EndDate)
	}
	if req.MinQuality > 0 {
		args = append(args, req.MinQuality)
	}
	if req.Limit > 0 {
		args = append(args, req.Limit)
	}
	if req.Offset > 0 {
		args = append(args, req.Offset)
	}

	return args
}

// getTotalCount gets the total count of training data matching the request
func (s *Service) getTotalCount(ctx context.Context, req *TrainingDataRequest) (int, error) {
	query := "SELECT COUNT(*) FROM training_data WHERE 1=1"
	
	conditions := []string{}
	args := []interface{}{}
	paramIndex := 1

	if req.UserID != "" {
		conditions = append(conditions, fmt.Sprintf("user_id = $%d", paramIndex))
		args = append(args, req.UserID)
		paramIndex++
	}
	if req.SessionID != "" {
		conditions = append(conditions, fmt.Sprintf("session_id = $%d", paramIndex))
		args = append(args, req.SessionID)
		paramIndex++
	}
	if req.ServiceType != "" {
		conditions = append(conditions, fmt.Sprintf("classification->>'service_type' = $%d", paramIndex))
		args = append(args, req.ServiceType)
		paramIndex++
	}
	if req.Status != "" {
		conditions = append(conditions, fmt.Sprintf("status = $%d", paramIndex))
		args = append(args, string(req.Status))
		paramIndex++
	}
	if req.StartDate != nil {
		conditions = append(conditions, fmt.Sprintf("timestamp >= $%d", paramIndex))
		args = append(args, *req.StartDate)
		paramIndex++
	}
	if req.EndDate != nil {
		conditions = append(conditions, fmt.Sprintf("timestamp <= $%d", paramIndex))
		args = append(args, *req.EndDate)
		paramIndex++
	}
	if req.MinQuality > 0 {
		conditions = append(conditions, fmt.Sprintf("quality->>'overall_score' >= $%d", paramIndex))
		args = append(args, req.MinQuality)
		paramIndex++
	}

	if len(conditions) > 0 {
		query += " AND " + strings.Join(conditions, " AND ")
	}

	var count int
	err := s.db.QueryRow(ctx, query, args...).Scan(&count)
	if err != nil {
		return 0, fmt.Errorf("failed to get total count: %w", err)
	}

	return count, nil
}

// calculateTrainingStats calculates comprehensive training statistics
func (s *Service) calculateTrainingStats(ctx context.Context) (*TrainingStatsResponse, error) {
	// Check if database client is available
	if s.db == nil || !s.db.IsHealthy() {
		return nil, fmt.Errorf("database client not initialized")
	}

	stats := &TrainingStatsResponse{
		TopServiceTypes:     make(map[string]int),
		QualityDistribution: make(map[string]int),
		StatusDistribution:  make(map[TrainingStatus]int),
		RecentTrends:        []TrendData{},
	}

	// Get total entries
	totalQuery := "SELECT COUNT(*) FROM training_data"
	err := s.db.QueryRow(ctx, totalQuery).Scan(&stats.TotalEntries)
	if err != nil {
		logrus.WithError(err).Error("Failed to get total entries")
	}

	// Get entries this week
	weekQuery := "SELECT COUNT(*) FROM training_data WHERE created_at >= NOW() - INTERVAL '7 days'"
	err = s.db.QueryRow(ctx, weekQuery).Scan(&stats.EntriesThisWeek)
	if err != nil {
		logrus.WithError(err).Error("Failed to get entries this week")
	}

	// Get entries this month
	monthQuery := "SELECT COUNT(*) FROM training_data WHERE created_at >= NOW() - INTERVAL '30 days'"
	err = s.db.QueryRow(ctx, monthQuery).Scan(&stats.EntriesThisMonth)
	if err != nil {
		logrus.WithError(err).Error("Failed to get entries this month")
	}

	// Get average quality score
	qualityQuery := "SELECT AVG(CAST(quality->>'overall_score' AS DECIMAL)) FROM training_data WHERE quality->>'overall_score' IS NOT NULL"
	err = s.db.QueryRow(ctx, qualityQuery).Scan(&stats.AverageQualityScore)
	if err != nil {
		logrus.WithError(err).Error("Failed to get average quality score")
		stats.AverageQualityScore = 0.0
	}

	// Get top service types
	serviceTypeQuery := `
		SELECT classification->>'service_type' as service_type, COUNT(*) as count
		FROM training_data 
		WHERE classification->>'service_type' IS NOT NULL
		GROUP BY classification->>'service_type'
		ORDER BY count DESC
		LIMIT 10
	`
	rows, err := s.db.Query(ctx, serviceTypeQuery)
	if err != nil {
		logrus.WithError(err).Error("Failed to get top service types")
	} else {
		defer rows.Close()
		for rows.Next() {
			var serviceType string
			var count int
			if err := rows.Scan(&serviceType, &count); err == nil {
				stats.TopServiceTypes[serviceType] = count
			}
		}
	}

	// Get quality distribution
	qualityDistQuery := `
		SELECT 
			CASE 
				WHEN CAST(quality->>'overall_score' AS DECIMAL) >= 0.8 THEN 'high'
				WHEN CAST(quality->>'overall_score' AS DECIMAL) >= 0.6 THEN 'medium'
				ELSE 'low'
			END as quality_level,
			COUNT(*) as count
		FROM training_data 
		WHERE quality->>'overall_score' IS NOT NULL
		GROUP BY quality_level
	`
	rows, err = s.db.Query(ctx, qualityDistQuery)
	if err != nil {
		logrus.WithError(err).Error("Failed to get quality distribution")
	} else {
		defer rows.Close()
		for rows.Next() {
			var qualityLevel string
			var count int
			if err := rows.Scan(&qualityLevel, &count); err == nil {
				stats.QualityDistribution[qualityLevel] = count
			}
		}
	}

	// Get status distribution
	statusDistQuery := `
		SELECT status, COUNT(*) as count
		FROM training_data 
		GROUP BY status
	`
	rows, err = s.db.Query(ctx, statusDistQuery)
	if err != nil {
		logrus.WithError(err).Error("Failed to get status distribution")
	} else {
		defer rows.Close()
		for rows.Next() {
			var status string
			var count int
			if err := rows.Scan(&status, &count); err == nil {
				stats.StatusDistribution[TrainingStatus(status)] = count
			}
		}
	}

	// Get recent trends (last 7 days)
	trendsQuery := `
		SELECT 
			DATE(created_at) as date,
			COUNT(*) as count,
			AVG(CAST(quality->>'overall_score' AS DECIMAL)) as avg_quality
		FROM training_data 
		WHERE created_at >= NOW() - INTERVAL '7 days'
		AND quality->>'overall_score' IS NOT NULL
		GROUP BY DATE(created_at)
		ORDER BY date DESC
	`
	rows, err = s.db.Query(ctx, trendsQuery)
	if err != nil {
		logrus.WithError(err).Error("Failed to get recent trends")
	} else {
		defer rows.Close()
		for rows.Next() {
			var date time.Time
			var count int
			var avgQuality float64
			if err := rows.Scan(&date, &count, &avgQuality); err == nil {
				stats.RecentTrends = append(stats.RecentTrends, TrendData{
					Date:    date,
					Count:   count,
					Quality: avgQuality,
				})
			}
		}
	}

	return stats, nil
}

// generateTrainingSuggestions generates training suggestions based on data analysis
func (s *Service) generateTrainingSuggestions(ctx context.Context) ([]TrainingSuggestion, error) {
	// Check if database client is available
	if s.db == nil || !s.db.IsHealthy() {
		return nil, fmt.Errorf("database client not initialized")
	}

	var suggestions []TrainingSuggestion

	// Find queries with low quality scores that need improvement
	lowQualityQuery := `
		SELECT id, query, classification->>'service_type' as service_type, quality->>'overall_score' as quality_score
		FROM training_data 
		WHERE CAST(quality->>'overall_score' AS DECIMAL) < 0.6
		AND status = 'pending'
		ORDER BY CAST(quality->>'overall_score' AS DECIMAL) ASC
		LIMIT 20
	`

	rows, err := s.db.Query(ctx, lowQualityQuery)
	if err != nil {
		return nil, fmt.Errorf("failed to query low quality data: %w", err)
	}
	defer rows.Close()

	for rows.Next() {
		var id, query, serviceType string
		var qualityScore float64
		
		if err := rows.Scan(&id, &query, &serviceType, &qualityScore); err != nil {
			logrus.WithError(err).Error("Failed to scan low quality row")
			continue
		}

		priority := s.calculateSuggestionPriority(qualityScore, serviceType)
		reason := fmt.Sprintf("Low quality score (%.2f) - needs response improvement", qualityScore)

		suggestions = append(suggestions, TrainingSuggestion{
			ID:          id,
			Query:       query,
			ServiceType: serviceType,
			Priority:    priority,
			Reason:      reason,
			CreatedAt:   time.Now(),
		})
	}

	return suggestions, nil
}

// calculateSuggestionPriority calculates priority for training suggestions
func (s *Service) calculateSuggestionPriority(qualityScore float64, serviceType string) int {
	priority := 5 // base priority

	// Lower quality scores get higher priority
	if qualityScore < 0.3 {
		priority += 3
	} else if qualityScore < 0.5 {
		priority += 2
	} else if qualityScore < 0.6 {
		priority += 1
	}

	// Important service types get higher priority
	switch serviceType {
	case "ktp_services", "birth_certificate":
		priority += 2
	case "family_card":
		priority += 1
	}

	// Ensure priority is within bounds
	if priority > 10 {
		priority = 10
	} else if priority < 1 {
		priority = 1
	}

	return priority
}
