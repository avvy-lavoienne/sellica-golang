package rag

import (
	"context"
	"fmt"
	"math"
	"math/rand"
	"sort"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

// HNSWIndex implements Hierarchical Navigable Small World algorithm for fast vector similarity search
type HNSWIndex struct {
	// Core HNSW parameters
	maxM       int     // Maximum number of connections for each node
	maxM0      int     // Maximum number of connections for layer 0
	ml         float64 // Level generation factor
	ef         int     // Size of the dynamic candidate list
	efConstruction int // Size of the dynamic candidate list during construction

	// Index data structures
	vectors    [][]float32           // Vector storage
	levels     []int                 // Level for each vector
	graph      [][]map[int]float32   // Multi-layer graph structure [node][level][neighbor] = distance
	entryPoint int                   // Entry point for search
	
	// Metadata storage
	metadata   []map[string]interface{} // Metadata for each vector
	
	// Thread safety
	mutex      sync.RWMutex
	
	// Performance tracking
	searchTimes    []time.Duration
	insertTimes    []time.Duration
	performanceMu  sync.RWMutex
	
	// Configuration
	vectorDim      int
	distanceFunc   DistanceFunction
	
	// Memory monitoring integration
	memoryMonitor  *MemoryMonitor
}

// DistanceFunction defines the interface for distance calculation
type DistanceFunction func(a, b []float32) float32

// HNSWSearchResult represents a search result with score and metadata
type HNSWSearchResult struct {
	ID       int                    `json:"id"`
	Score    float32                `json:"score"`
	Vector   []float32              `json:"vector,omitempty"`
	Metadata map[string]interface{} `json:"metadata,omitempty"`
}

// HNSWConfig holds configuration for HNSW index
type HNSWConfig struct {
	MaxM           int               `json:"max_m"`           // Default: 16
	MaxM0          int               `json:"max_m0"`          // Default: 32
	Ef             int               `json:"ef"`              // Default: 200
	EfConstruction int               `json:"ef_construction"` // Default: 200
	ML             float64           `json:"ml"`              // Default: 1/ln(2)
	DistanceFunc   DistanceFunction  `json:"-"`               // Distance function
	VectorDim      int               `json:"vector_dim"`      // Vector dimensions
}

// NewHNSWIndex creates a new HNSW index with the given configuration
func NewHNSWIndex(config *HNSWConfig) *HNSWIndex {
	if config == nil {
		config = &HNSWConfig{
			MaxM:           16,
			MaxM0:          32,
			Ef:             200,
			EfConstruction: 200,
			ML:             1.0 / math.Log(2.0),
			DistanceFunc:   CosineSimilarity,
			VectorDim:      768, // Default for Indonesian BERT
		}
	}

	index := &HNSWIndex{
		maxM:           config.MaxM,
		maxM0:          config.MaxM0,
		ml:             config.ML,
		ef:             config.Ef,
		efConstruction: config.EfConstruction,
		vectors:        make([][]float32, 0),
		levels:         make([]int, 0),
		graph:          make([][]map[int]float32, 0),
		metadata:       make([]map[string]interface{}, 0),
		entryPoint:     -1,
		vectorDim:      config.VectorDim,
		distanceFunc:   config.DistanceFunc,
		searchTimes:    make([]time.Duration, 0),
		insertTimes:    make([]time.Duration, 0),
	}

	// Initialize memory monitoring if available
	index.memoryMonitor = NewMemoryMonitor()
	index.memoryMonitor.StartMonitoring(60 * time.Second) // Monitor every minute

	logrus.WithFields(logrus.Fields{
		"max_m":           config.MaxM,
		"max_m0":          config.MaxM0,
		"ef":              config.Ef,
		"ef_construction": config.EfConstruction,
		"vector_dim":      config.VectorDim,
	}).Info("🔍 HNSW index initialized")

	return index
}

// AddVector adds a vector to the HNSW index
func (h *HNSWIndex) AddVector(ctx context.Context, vector []float32, metadata map[string]interface{}) (int, error) {
	startTime := time.Now()
	
	// Check context cancellation
	select {
	case <-ctx.Done():
		return -1, fmt.Errorf("context cancelled during vector addition: %w", ctx.Err())
	default:
	}

	h.mutex.Lock()
	defer h.mutex.Unlock()

	// Validate vector dimensions
	if len(vector) != h.vectorDim {
		return -1, fmt.Errorf("vector dimension mismatch: expected %d, got %d", h.vectorDim, len(vector))
	}

	// Assign ID and add vector
	id := len(h.vectors)
	h.vectors = append(h.vectors, vector)
	h.metadata = append(h.metadata, metadata)

	// Generate random level for the new node
	level := h.getRandomLevel()
	h.levels = append(h.levels, level)

	// Initialize graph structure for this node
	nodeGraph := make([]map[int]float32, level+1)
	for i := 0; i <= level; i++ {
		nodeGraph[i] = make(map[int]float32)
	}
	h.graph = append(h.graph, nodeGraph)

	// If this is the first node, set it as entry point
	if h.entryPoint == -1 {
		h.entryPoint = id
		h.recordInsertTime(time.Since(startTime))
		return id, nil
	}

	// Insert the node into the graph
	if err := h.insertNode(ctx, id, vector, level); err != nil {
		return -1, fmt.Errorf("failed to insert node: %w", err)
	}

	h.recordInsertTime(time.Since(startTime))
	
	logrus.WithFields(logrus.Fields{
		"id":           id,
		"level":        level,
		"insert_time":  time.Since(startTime),
		"total_vectors": len(h.vectors),
	}).Debug("Vector added to HNSW index")

	return id, nil
}

// SearchKNN performs k-nearest neighbor search
func (h *HNSWIndex) SearchKNN(ctx context.Context, query []float32, k int) ([]HNSWSearchResult, error) {
	startTime := time.Now()
	
	// Check context cancellation
	select {
	case <-ctx.Done():
		return nil, fmt.Errorf("context cancelled during search: %w", ctx.Err())
	default:
	}

	h.mutex.RLock()
	defer h.mutex.RUnlock()

	if len(h.vectors) == 0 {
		return []HNSWSearchResult{}, nil
	}

	if len(query) != h.vectorDim {
		return nil, fmt.Errorf("query dimension mismatch: expected %d, got %d", h.vectorDim, len(query))
	}

	// Perform multi-level search
	results, err := h.searchLayers(ctx, query, k)
	if err != nil {
		return nil, fmt.Errorf("search failed: %w", err)
	}

	h.recordSearchTime(time.Since(startTime))
	
	logrus.WithFields(logrus.Fields{
		"k":           k,
		"results":     len(results),
		"search_time": time.Since(startTime),
	}).Debug("HNSW search completed")

	return results, nil
}

// getRandomLevel generates a random level for a new node
func (h *HNSWIndex) getRandomLevel() int {
	level := 0
	for rand.Float64() < h.ml && level < 16 { // Cap at 16 levels
		level++
	}
	return level
}

// insertNode inserts a node into the HNSW graph
func (h *HNSWIndex) insertNode(ctx context.Context, nodeID int, vector []float32, level int) error {
	// Start from the top level and work down
	currentNearest := h.entryPoint
	
	// Search from top level down to level+1
	for lev := h.levels[h.entryPoint]; lev > level; lev-- {
		currentNearest = h.searchLayer(ctx, vector, currentNearest, 1, lev)[0].ID
		
		// Check context cancellation
		select {
		case <-ctx.Done():
			return fmt.Errorf("context cancelled during node insertion: %w", ctx.Err())
		default:
		}
	}

	// Insert connections from level down to 0
	for lev := level; lev >= 0; lev-- {
		candidates := h.searchLayer(ctx, vector, currentNearest, h.efConstruction, lev)
		
		// Select neighbors
		maxConn := h.maxM
		if lev == 0 {
			maxConn = h.maxM0
		}
		
		neighbors := h.selectNeighbors(candidates, maxConn)
		
		// Add bidirectional connections
		for _, neighbor := range neighbors {
			h.graph[nodeID][lev][neighbor.ID] = neighbor.Score
			h.graph[neighbor.ID][lev][nodeID] = neighbor.Score
			
			// Prune connections if necessary
			if len(h.graph[neighbor.ID][lev]) > maxConn {
				h.pruneConnections(neighbor.ID, lev, maxConn)
			}
		}
		
		currentNearest = neighbors[0].ID
	}

	// Update entry point if necessary
	if level > h.levels[h.entryPoint] {
		h.entryPoint = nodeID
	}

	return nil
}

// searchLayers performs the multi-layer search algorithm
func (h *HNSWIndex) searchLayers(ctx context.Context, query []float32, k int) ([]HNSWSearchResult, error) {
	if h.entryPoint == -1 {
		return []HNSWSearchResult{}, nil
	}

	// Start from entry point and search down
	currentNearest := h.entryPoint
	
	// Search from top level down to level 1
	for lev := h.levels[h.entryPoint]; lev > 0; lev-- {
		candidates := h.searchLayer(ctx, query, currentNearest, 1, lev)
		if len(candidates) > 0 {
			currentNearest = candidates[0].ID
		}
		
		// Check context cancellation
		select {
		case <-ctx.Done():
			return nil, fmt.Errorf("context cancelled during search: %w", ctx.Err())
		default:
		}
	}

	// Search at level 0 with ef
	candidates := h.searchLayer(ctx, query, currentNearest, max(h.ef, k), 0)
	
	// Return top k results
	if len(candidates) > k {
		candidates = candidates[:k]
	}

	return candidates, nil
}

// searchLayer searches within a specific layer
func (h *HNSWIndex) searchLayer(ctx context.Context, query []float32, entryPoint int, ef int, level int) []HNSWSearchResult {
	visited := make(map[int]bool)
	candidates := make([]HNSWSearchResult, 0)
	dynamic := make([]HNSWSearchResult, 0)

	// Initialize with entry point
	dist := h.distanceFunc(query, h.vectors[entryPoint])
	entry := HNSWSearchResult{
		ID:       entryPoint,
		Score:    dist,
		Vector:   h.vectors[entryPoint],
		Metadata: h.metadata[entryPoint],
	}
	
	candidates = append(candidates, entry)
	dynamic = append(dynamic, entry)
	visited[entryPoint] = true

	for len(dynamic) > 0 {
		// Check context cancellation
		select {
		case <-ctx.Done():
			return candidates
		default:
		}

		// Get closest unvisited candidate
		sort.Slice(dynamic, func(i, j int) bool {
			return dynamic[i].Score < dynamic[j].Score
		})
		
		current := dynamic[0]
		dynamic = dynamic[1:]

		// Stop if current is farther than the ef-th candidate
		if len(candidates) >= ef {
			sort.Slice(candidates, func(i, j int) bool {
				return candidates[i].Score < candidates[j].Score
			})
			if current.Score > candidates[ef-1].Score {
				break
			}
		}

		// Explore neighbors
		for neighborID := range h.graph[current.ID][level] {
			if !visited[neighborID] {
				visited[neighborID] = true
				
				dist := h.distanceFunc(query, h.vectors[neighborID])
				neighbor := HNSWSearchResult{
					ID:       neighborID,
					Score:    dist,
					Vector:   h.vectors[neighborID],
					Metadata: h.metadata[neighborID],
				}

				candidates = append(candidates, neighbor)
				
				if len(candidates) < ef || dist < candidates[len(candidates)-1].Score {
					dynamic = append(dynamic, neighbor)
				}
			}
		}
	}

	// Sort and return top candidates
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Score < candidates[j].Score
	})

	if len(candidates) > ef {
		candidates = candidates[:ef]
	}

	return candidates
}

// selectNeighbors selects the best neighbors using a simple heuristic
func (h *HNSWIndex) selectNeighbors(candidates []HNSWSearchResult, maxConn int) []HNSWSearchResult {
	if len(candidates) <= maxConn {
		return candidates
	}

	// Sort by distance and take the closest ones
	sort.Slice(candidates, func(i, j int) bool {
		return candidates[i].Score < candidates[j].Score
	})

	return candidates[:maxConn]
}

// pruneConnections removes excess connections from a node
func (h *HNSWIndex) pruneConnections(nodeID int, level int, maxConn int) {
	connections := h.graph[nodeID][level]
	if len(connections) <= maxConn {
		return
	}

	// Convert to slice for sorting
	type connection struct {
		id   int
		dist float32
	}
	
	connSlice := make([]connection, 0, len(connections))
	for id, dist := range connections {
		connSlice = append(connSlice, connection{id: id, dist: dist})
	}

	// Sort by distance and keep only the closest
	sort.Slice(connSlice, func(i, j int) bool {
		return connSlice[i].dist < connSlice[j].dist
	})

	// Clear and rebuild connections
	h.graph[nodeID][level] = make(map[int]float32)
	for i := 0; i < maxConn && i < len(connSlice); i++ {
		h.graph[nodeID][level][connSlice[i].id] = connSlice[i].dist
	}
}

// recordSearchTime records search performance
func (h *HNSWIndex) recordSearchTime(duration time.Duration) {
	h.performanceMu.Lock()
	defer h.performanceMu.Unlock()
	
	h.searchTimes = append(h.searchTimes, duration)
	
	// Keep only last 1000 measurements
	if len(h.searchTimes) > 1000 {
		h.searchTimes = h.searchTimes[1:]
	}
}

// recordInsertTime records insertion performance
func (h *HNSWIndex) recordInsertTime(duration time.Duration) {
	h.performanceMu.Lock()
	defer h.performanceMu.Unlock()
	
	h.insertTimes = append(h.insertTimes, duration)
	
	// Keep only last 1000 measurements
	if len(h.insertTimes) > 1000 {
		h.insertTimes = h.insertTimes[1:]
	}
}

// GetStats returns performance statistics
func (h *HNSWIndex) GetStats() map[string]interface{} {
	h.mutex.RLock()
	h.performanceMu.RLock()
	defer h.mutex.RUnlock()
	defer h.performanceMu.RUnlock()

	stats := map[string]interface{}{
		"total_vectors": len(h.vectors),
		"entry_point":   h.entryPoint,
		"max_level":     0,
	}

	if len(h.levels) > 0 {
		maxLevel := 0
		for _, level := range h.levels {
			if level > maxLevel {
				maxLevel = level
			}
		}
		stats["max_level"] = maxLevel
	}

	// Calculate average search time
	if len(h.searchTimes) > 0 {
		var total time.Duration
		for _, t := range h.searchTimes {
			total += t
		}
		stats["avg_search_time_ms"] = float64(total.Nanoseconds()) / float64(len(h.searchTimes)) / 1e6
	}

	// Calculate average insert time
	if len(h.insertTimes) > 0 {
		var total time.Duration
		for _, t := range h.insertTimes {
			total += t
		}
		stats["avg_insert_time_ms"] = float64(total.Nanoseconds()) / float64(len(h.insertTimes)) / 1e6
	}

	return stats
}

// Close cleans up resources
func (h *HNSWIndex) Close() error {
	h.mutex.Lock()
	defer h.mutex.Unlock()

	if h.memoryMonitor != nil {
		h.memoryMonitor.StopMonitoring()
	}

	// Clear data structures
	h.vectors = nil
	h.levels = nil
	h.graph = nil
	h.metadata = nil
	h.searchTimes = nil
	h.insertTimes = nil

	logrus.Info("🔒 HNSW index closed")
	return nil
}

// Utility functions

// CosineSimilarity calculates cosine similarity between two vectors
func CosineSimilarity(a, b []float32) float32 {
	var dotProduct, normA, normB float32
	
	for i := 0; i < len(a); i++ {
		dotProduct += a[i] * b[i]
		normA += a[i] * a[i]
		normB += b[i] * b[i]
	}
	
	if normA == 0 || normB == 0 {
		return 0
	}
	
	// Return distance (1 - similarity) for consistent ordering
	similarity := dotProduct / (float32(math.Sqrt(float64(normA))) * float32(math.Sqrt(float64(normB))))
	return 1.0 - similarity
}

// EuclideanDistance calculates Euclidean distance between two vectors
func EuclideanDistance(a, b []float32) float32 {
	var sum float32
	for i := 0; i < len(a); i++ {
		diff := a[i] - b[i]
		sum += diff * diff
	}
	return float32(math.Sqrt(float64(sum)))
}

// Helper function
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}
