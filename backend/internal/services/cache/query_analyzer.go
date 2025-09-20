package cache

import (
	"strings"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// QueryComplexityAnalyzer analyzes query complexity for intelligent caching
type QueryComplexityAnalyzer struct {
	patterns      map[string]int
	recentQueries []string
	mu            sync.RWMutex
}

// QueryEvent represents a query event for analysis
type QueryEvent struct {
	Query     string
	UserID    string
	Timestamp time.Time
	Duration  time.Duration
}

// NewQueryComplexityAnalyzer creates a new query complexity analyzer
func NewQueryComplexityAnalyzer() *QueryComplexityAnalyzer {
	return &QueryComplexityAnalyzer{
		patterns:      make(map[string]int),
		recentQueries: make([]string, 0),
	}
}

// AnalyzeComplexity analyzes the complexity of a query
func (qca *QueryComplexityAnalyzer) AnalyzeComplexity(query string) QueryComplexity {
	query = strings.TrimSpace(strings.ToLower(query))

	// Simple heuristics for complexity analysis
	wordCount := len(strings.Fields(query))

	// Check for complex query indicators
	complexityIndicators := []string{
		"analyze", "calculate", "compute", "aggregate", "summarize",
		"complex", "advanced", "detailed", "comprehensive",
		"multi-step", "iterative", "recursive",
	}

	simpleIndicators := []string{
		"get", "find", "lookup", "search", "show",
		"simple", "basic", "quick", "fast",
	}

	// Count complexity indicators
	complexityScore := 0
	for _, indicator := range complexityIndicators {
		if strings.Contains(query, indicator) {
			complexityScore += 2
		}
	}

	// Count simple indicators
	simpleScore := 0
	for _, indicator := range simpleIndicators {
		if strings.Contains(query, indicator) {
			simpleScore++
		}
	}

	// Indonesian government service complexity patterns
	govServices := map[string]QueryComplexity{
		"akta kelahiran":     Complex,
		"akta kematian":      Complex,
		"akta perkawinan":    Complex,
		"ktp":               Medium,
		"kia":               Medium,
		"kk":                Medium,
		"perpindahan":       Complex,
		"aku sah":          Medium,
	}

	for service, complexity := range govServices {
		if strings.Contains(query, service) {
			if complexity == Complex {
				return VeryComplex
			}
			return complexity
		}
	}

	// Length-based complexity
	if wordCount > 20 {
		complexityScore += 3
	} else if wordCount > 10 {
		complexityScore += 2
	} else if wordCount > 5 {
		complexityScore++
	}

	// Determine final complexity
	if complexityScore >= 5 {
		return VeryComplex
	} else if complexityScore >= 3 {
		return Complex
	} else if complexityScore >= 1 || wordCount > 3 {
		return Medium
	}

	return Simple
}

// RecordQuery records a query for pattern analysis
func (qca *QueryComplexityAnalyzer) RecordQuery(query string, userID string) {
	qca.mu.Lock()
	defer qca.mu.Unlock()

	// Normalize query for pattern matching
	normalized := qca.normalizeQuery(query)

	qca.patterns[normalized]++
	qca.recentQueries = append(qca.recentQueries, normalized)

	// Keep only recent 1000 queries
	if len(qca.recentQueries) > 1000 {
		qca.recentQueries = qca.recentQueries[len(qca.recentQueries)-1000:]
	}
}

// GetPatternFrequency returns the frequency of a query pattern
func (qca *QueryComplexityAnalyzer) GetPatternFrequency(query string) int {
	qca.mu.RLock()
	defer qca.mu.RUnlock()

	normalized := qca.normalizeQuery(query)
	return qca.patterns[normalized]
}

// GetTopPatterns returns the most frequent query patterns
func (qca *QueryComplexityAnalyzer) GetTopPatterns(limit int) []QueryPattern {
	qca.mu.RLock()
	defer qca.mu.RUnlock()

	patterns := make([]QueryPattern, 0, len(qca.patterns))
	for query, frequency := range qca.patterns {
		patterns = append(patterns, QueryPattern{
			Query:     query,
			Frequency: frequency,
			Complexity: qca.AnalyzeComplexity(query),
		})
	}

	// Sort by frequency (descending)
	for i := 0; i < len(patterns)-1; i++ {
		for j := i + 1; j < len(patterns); j++ {
			if patterns[i].Frequency < patterns[j].Frequency {
				patterns[i], patterns[j] = patterns[j], patterns[i]
			}
		}
	}

	if limit > 0 && len(patterns) > limit {
		patterns = patterns[:limit]
	}

	return patterns
}

// GetComplexityDistribution returns the distribution of query complexities
func (qca *QueryComplexityAnalyzer) GetComplexityDistribution() map[QueryComplexity]int {
	qca.mu.RLock()
	defer qca.mu.RUnlock()

	distribution := make(map[QueryComplexity]int)

	// Analyze recent queries for complexity distribution
	for _, query := range qca.recentQueries {
		complexity := qca.AnalyzeComplexity(query)
		distribution[complexity]++
	}

	return distribution
}

// normalizeQuery normalizes a query for consistent pattern matching
func (qca *QueryComplexityAnalyzer) normalizeQuery(query string) string {
	// Convert to lowercase and trim whitespace
	normalized := strings.TrimSpace(strings.ToLower(query))

	// Remove common Indonesian stop words for better pattern matching
	stopWords := []string{
		"yang", "dan", "atau", "untuk", "dari", "ke", "di", "pada",
		"adalah", "dengan", "dalam", "oleh", "pada", "untuk", "dari",
		"adalah", "adalah", "adalah", "adalah", "adalah", "adalah",
	}

	words := strings.Fields(normalized)
	filteredWords := make([]string, 0, len(words))

	for _, word := range words {
		isStopWord := false
		for _, stopWord := range stopWords {
			if word == stopWord {
				isStopWord = true
				break
			}
		}
		if !isStopWord {
			filteredWords = append(filteredWords, word)
		}
	}

	return strings.Join(filteredWords, " ")
}

// GetStats returns statistics about query analysis
func (qca *QueryComplexityAnalyzer) GetStats() map[string]interface{} {
	qca.mu.RLock()
	defer qca.mu.RUnlock()

	totalQueries := len(qca.recentQueries)
	uniquePatterns := len(qca.patterns)

	complexityDist := qca.GetComplexityDistribution()

	return map[string]interface{}{
		"total_queries_analyzed": totalQueries,
		"unique_patterns":        uniquePatterns,
		"complexity_distribution": map[string]int{
			"simple":      complexityDist[Simple],
			"medium":      complexityDist[Medium],
			"complex":     complexityDist[Complex],
			"very_complex": complexityDist[VeryComplex],
		},
		"top_patterns": qca.GetTopPatterns(10),
	}
}

// QueryPattern represents a query pattern with its statistics
type QueryPattern struct {
	Query      string          `json:"query"`
	Frequency  int             `json:"frequency"`
	Complexity QueryComplexity `json:"complexity"`
}

// Cleanup removes old patterns to free memory
func (qca *QueryComplexityAnalyzer) Cleanup() {
	qca.mu.Lock()
	defer qca.mu.Unlock()

	// Remove patterns with very low frequency
	for query, frequency := range qca.patterns {
		if frequency < 2 {
			delete(qca.patterns, query)
		}
	}

	// Clear very old recent queries (keep last 500)
	if len(qca.recentQueries) > 500 {
		qca.recentQueries = qca.recentQueries[len(qca.recentQueries)-500:]
	}

	logrus.WithFields(logrus.Fields{
		"remaining_patterns": len(qca.patterns),
		"recent_queries":     len(qca.recentQueries),
	}).Debug("🧹 Query analyzer cleanup completed")
}