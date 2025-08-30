// Cache Dependency Graph - Week 3 Implementation
package sync

import (
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// CacheDependencyGraph manages relationships between cache keys
type CacheDependencyGraph struct {
	dependencies map[string]*CacheDependency
	mutex        sync.RWMutex
	
	// Learning system
	accessPatterns map[string]*AccessPattern
	isLearning     bool
}

// AccessPattern tracks how cache keys are accessed together
type AccessPattern struct {
	Key            string            `json:"key"`
	CoAccessedWith map[string]int64  `json:"co_accessed_with"`
	LastAccessed   time.Time         `json:"last_accessed"`
	AccessCount    int64             `json:"access_count"`
}

// NewCacheDependencyGraph creates a new cache dependency graph
func NewCacheDependencyGraph() (*CacheDependencyGraph, error) {
	graph := &CacheDependencyGraph{
		dependencies:   make(map[string]*CacheDependency),
		accessPatterns: make(map[string]*AccessPattern),
		isLearning:     true,
	}

	// Load pre-defined dependency rules
	err := graph.loadPredefinedDependencies()
	if err != nil {
		logrus.WithError(err).Warn("Failed to load predefined dependencies")
	}

	logrus.Info("✅ Cache dependency graph initialized")
	return graph, nil
}

// FindDependentKeys finds all keys that depend on the given keys
func (cdg *CacheDependencyGraph) FindDependentKeys(keys []string, maxDepth int) ([]string, error) {
	cdg.mutex.RLock()
	defer cdg.mutex.RUnlock()

	dependentKeys := make(map[string]bool)
	visited := make(map[string]bool)

	// Find dependencies recursively
	for _, key := range keys {
		cdg.findDependentKeysRecursive(key, dependentKeys, visited, 0, maxDepth)
	}

	// Convert map to slice
	result := make([]string, 0, len(dependentKeys))
	for key := range dependentKeys {
		// Don't include original keys
		if !contains(keys, key) {
			result = append(result, key)
		}
	}

	logrus.WithFields(logrus.Fields{
		"input_keys":     len(keys),
		"dependent_keys": len(result),
		"max_depth":     maxDepth,
	}).Debug("🔍 Found dependent cache keys")

	return result, nil
}

// findDependentKeysRecursive recursively finds dependent keys
func (cdg *CacheDependencyGraph) findDependentKeysRecursive(
	key string,
	dependentKeys map[string]bool,
	visited map[string]bool,
	currentDepth int,
	maxDepth int,
) {
	
	if currentDepth >= maxDepth || visited[key] {
		return
	}

	visited[key] = true

	// Check direct dependencies
	if dep, exists := cdg.dependencies[key]; exists {
		for _, affectedKey := range dep.Affects {
			dependentKeys[affectedKey] = true
			cdg.findDependentKeysRecursive(
				affectedKey, 
				dependentKeys, 
				visited, 
				currentDepth+1, 
				maxDepth,
			)
		}
	}

	// Check pattern-based dependencies
	for _, dep := range cdg.dependencies {
		if matchesPattern(dep.Pattern, key) {
			for _, affectedKey := range dep.Affects {
				dependentKeys[affectedKey] = true
				cdg.findDependentKeysRecursive(
					affectedKey, 
					dependentKeys, 
					visited, 
					currentDepth+1, 
					maxDepth,
				)
			}
		}
	}
}

// AddDependency adds a new cache dependency relationship
func (cdg *CacheDependencyGraph) AddDependency(dependency *CacheDependency) {
	cdg.mutex.Lock()
	defer cdg.mutex.Unlock()

	cdg.dependencies[dependency.Key] = dependency
	
	logrus.WithFields(logrus.Fields{
		"key":         dependency.Key,
		"depends_on":  len(dependency.DependsOn),
		"affects":     len(dependency.Affects),
		"pattern":     dependency.Pattern,
	}).Debug("➕ Added cache dependency")
}

// RecordAccess records cache access patterns for learning
func (cdg *CacheDependencyGraph) RecordAccess(keys []string) {
	if !cdg.isLearning || len(keys) <= 1 {
		return
	}

	cdg.mutex.Lock()
	defer cdg.mutex.Unlock()

	now := time.Now()

	// Update access patterns for co-accessed keys
	for i, key1 := range keys {
		pattern1, exists := cdg.accessPatterns[key1]
		if !exists {
			pattern1 = &AccessPattern{
				Key:            key1,
				CoAccessedWith: make(map[string]int64),
				LastAccessed:   now,
				AccessCount:    0,
			}
			cdg.accessPatterns[key1] = pattern1
		}

		pattern1.LastAccessed = now
		pattern1.AccessCount++

		// Record co-access with other keys
		for j, key2 := range keys {
			if i != j {
				pattern1.CoAccessedWith[key2]++
			}
		}
	}
}

// loadPredefinedDependencies loads standard cache dependency patterns
func (cdg *CacheDependencyGraph) loadPredefinedDependencies() error {
	// User-related dependencies
	cdg.AddDependency(&CacheDependency{
		Key:     "user:*",
		Pattern: "user:*",
		Affects: []string{"users:list", "users:search", "sessions:*"},
		Weight:  0.8,
	})

	// Chat-related dependencies
	cdg.AddDependency(&CacheDependency{
		Key:     "chat:*",
		Pattern: "chat:*",
		Affects: []string{"chats:list", "chats:recent", "sessions:*"},
		Weight:  0.7,
	})

	// Document-related dependencies
	cdg.AddDependency(&CacheDependency{
		Key:     "document:*",
		Pattern: "document:*",
		Affects: []string{"documents:list", "documents:search", "search:*"},
		Weight:  0.9,
	})

	// Training data dependencies
	cdg.AddDependency(&CacheDependency{
		Key:     "training:*",
		Pattern: "training:*",
		Affects: []string{"training:list", "training:stats", "models:*"},
		Weight:  0.6,
	})

	logrus.WithField("dependencies", len(cdg.dependencies)).Info("📋 Predefined cache dependencies loaded")
	return nil
}

// GetDependencyMetrics returns metrics about the dependency graph
func (cdg *CacheDependencyGraph) GetDependencyMetrics() map[string]interface{} {
	cdg.mutex.RLock()
	defer cdg.mutex.RUnlock()

	totalDependencies := len(cdg.dependencies)
	totalAccessPatterns := len(cdg.accessPatterns)
	
	avgDependsOn := 0.0
	avgAffects := 0.0
	
	if totalDependencies > 0 {
		totalDependsOn := 0
		totalAffects := 0
		
		for _, dep := range cdg.dependencies {
			totalDependsOn += len(dep.DependsOn)
			totalAffects += len(dep.Affects)
		}
		
		avgDependsOn = float64(totalDependsOn) / float64(totalDependencies)
		avgAffects = float64(totalAffects) / float64(totalDependencies)
	}

	return map[string]interface{}{
		"total_dependencies":    totalDependencies,
		"total_access_patterns": totalAccessPatterns,
		"avg_depends_on":       avgDependsOn,
		"avg_affects":          avgAffects,
		"learning_enabled":     cdg.isLearning,
	}
}

// Helper functions

// contains checks if a slice contains a string
func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

// matchesPattern checks if a key matches a pattern (simplified wildcard matching)
func matchesPattern(pattern, key string) bool {
	if pattern == "" {
		return false
	}
	
	// Simple wildcard matching
	if pattern == "*" {
		return true
	}
	
	// Pattern ends with *
	if len(pattern) > 0 && pattern[len(pattern)-1] == '*' {
		prefix := pattern[:len(pattern)-1]
		return len(key) >= len(prefix) && key[:len(prefix)] == prefix
	}
	
	// Exact match
	return pattern == key
}
