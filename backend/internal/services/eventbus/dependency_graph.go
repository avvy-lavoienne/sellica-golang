package eventbus

import (
	"sync"
)

// DependencyGraph tracks cache key dependencies for intelligent invalidation
type DependencyGraph struct {
	dependencies map[string][]string // key -> dependent keys
	reverseDeps  map[string][]string // key -> keys that depend on it
	mu          sync.RWMutex
}

// NewDependencyGraph creates a new dependency graph
func NewDependencyGraph() *DependencyGraph {
	return &DependencyGraph{
		dependencies: make(map[string][]string),
		reverseDeps:  make(map[string][]string),
	}
}

// AddDependency adds a dependency relationship between cache keys
func (dg *DependencyGraph) AddDependency(key, dependsOn string) error {
	dg.mu.Lock()
	defer dg.mu.Unlock()

	// Add forward dependency (key depends on dependsOn)
	dg.dependencies[key] = append(dg.dependencies[key], dependsOn)

	// Remove duplicates from dependencies
	dg.dependencies[key] = removeDuplicates(dg.dependencies[key])

	// Add reverse dependency (dependsOn is depended on by key)
	dg.reverseDeps[dependsOn] = append(dg.reverseDeps[dependsOn], key)

	// Remove duplicates from reverse dependencies
	dg.reverseDeps[dependsOn] = removeDuplicates(dg.reverseDeps[dependsOn])

	return nil
}

// RemoveDependency removes a dependency relationship
func (dg *DependencyGraph) RemoveDependency(key, dependsOn string) error {
	dg.mu.Lock()
	defer dg.mu.Unlock()

	// Remove from forward dependencies
	if deps, exists := dg.dependencies[key]; exists {
		dg.dependencies[key] = removeFromSlice(deps, dependsOn)
		if len(dg.dependencies[key]) == 0 {
			delete(dg.dependencies, key)
		}
	}

	// Remove from reverse dependencies
	if reverseDeps, exists := dg.reverseDeps[dependsOn]; exists {
		dg.reverseDeps[dependsOn] = removeFromSlice(reverseDeps, key)
		if len(dg.reverseDeps[dependsOn]) == 0 {
			delete(dg.reverseDeps, dependsOn)
		}
	}

	return nil
}

// GetDependencies returns all keys that the given key depends on
func (dg *DependencyGraph) GetDependencies(key string) []string {
	dg.mu.RLock()
	defer dg.mu.RUnlock()

	if deps, exists := dg.dependencies[key]; exists {
		// Return a copy to prevent external modification
		result := make([]string, len(deps))
		copy(result, deps)
		return result
	}

	return []string{}
}

// GetDependentKeys returns all keys that depend on the given key
func (dg *DependencyGraph) GetDependentKeys(key string) []string {
	dg.mu.RLock()
	defer dg.mu.RUnlock()

	if deps, exists := dg.reverseDeps[key]; exists {
		// Return a copy to prevent external modification
		result := make([]string, len(deps))
		copy(result, deps)
		return result
	}

	return []string{}
}

// GetAllDependencies returns all dependencies recursively
func (dg *DependencyGraph) GetAllDependencies(key string, maxDepth int) []string {
	dg.mu.RLock()
	defer dg.mu.RUnlock()

	visited := make(map[string]bool)
	return dg.getAllDependenciesRecursive(key, maxDepth, 0, visited)
}

// GetAllDependents returns all dependents recursively
func (dg *DependencyGraph) GetAllDependents(key string, maxDepth int) []string {
	dg.mu.RLock()
	defer dg.mu.RUnlock()

	visited := make(map[string]bool)
	return dg.getAllDependentsRecursive(key, maxDepth, 0, visited)
}

// HasDependency checks if a dependency relationship exists
func (dg *DependencyGraph) HasDependency(key, dependsOn string) bool {
	dg.mu.RLock()
	defer dg.mu.RUnlock()

	if deps, exists := dg.dependencies[key]; exists {
		for _, dep := range deps {
			if dep == dependsOn {
				return true
			}
		}
	}

	return false
}

// GetDependencyStats returns statistics about the dependency graph
func (dg *DependencyGraph) GetDependencyStats() map[string]interface{} {
	dg.mu.RLock()
	defer dg.mu.RUnlock()

	totalKeys := len(dg.dependencies)
	totalDependencies := 0
	maxDepsPerKey := 0
	keysWithDeps := 0

	for key, deps := range dg.dependencies {
		depCount := len(deps)
		totalDependencies += depCount

		if depCount > 0 {
			keysWithDeps++
		}

		if depCount > maxDepsPerKey {
			maxDepsPerKey = depCount
		}

		// Also count reverse dependencies
		if reverseDeps, exists := dg.reverseDeps[key]; exists {
			totalDependencies += len(reverseDeps)
		}
	}

	avgDepsPerKey := 0.0
	if keysWithDeps > 0 {
		avgDepsPerKey = float64(totalDependencies) / float64(keysWithDeps)
	}

	return map[string]interface{}{
		"total_keys":         totalKeys,
		"total_dependencies": totalDependencies,
		"keys_with_deps":     keysWithDeps,
		"max_deps_per_key":   maxDepsPerKey,
		"avg_deps_per_key":   avgDepsPerKey,
	}
}

// Clear removes all dependencies
func (dg *DependencyGraph) Clear() {
	dg.mu.Lock()
	defer dg.mu.Unlock()

	dg.dependencies = make(map[string][]string)
	dg.reverseDeps = make(map[string][]string)
}

// RemoveKey removes all dependencies for a specific key
func (dg *DependencyGraph) RemoveKey(key string) {
	dg.mu.Lock()
	defer dg.mu.Unlock()

	// Remove all dependencies of this key
	delete(dg.dependencies, key)

	// Remove this key from all reverse dependencies
	for dependsOn, dependents := range dg.reverseDeps {
		dg.reverseDeps[dependsOn] = removeFromSlice(dependents, key)
		if len(dg.reverseDeps[dependsOn]) == 0 {
			delete(dg.reverseDeps, dependsOn)
		}
	}
}

// getAllDependenciesRecursive recursively gets all dependencies
func (dg *DependencyGraph) getAllDependenciesRecursive(key string, maxDepth, currentDepth int, visited map[string]bool) []string {
	if currentDepth >= maxDepth || visited[key] {
		return []string{}
	}

	visited[key] = true
	var allDeps []string

	if deps, exists := dg.dependencies[key]; exists {
		for _, dep := range deps {
			if !visited[dep] {
				allDeps = append(allDeps, dep)
				recursiveDeps := dg.getAllDependenciesRecursive(dep, maxDepth, currentDepth+1, visited)
				allDeps = append(allDeps, recursiveDeps...)
			}
		}
	}

	return removeDuplicates(allDeps)
}

// getAllDependentsRecursive recursively gets all dependents
func (dg *DependencyGraph) getAllDependentsRecursive(key string, maxDepth, currentDepth int, visited map[string]bool) []string {
	if currentDepth >= maxDepth || visited[key] {
		return []string{}
	}

	visited[key] = true
	var allDependents []string

	if deps, exists := dg.reverseDeps[key]; exists {
		for _, dep := range deps {
			if !visited[dep] {
				allDependents = append(allDependents, dep)
				recursiveDeps := dg.getAllDependentsRecursive(dep, maxDepth, currentDepth+1, visited)
				allDependents = append(allDependents, recursiveDeps...)
			}
		}
	}

	return removeDuplicates(allDependents)
}

// removeDuplicates removes duplicate strings from a slice
func removeDuplicates(slice []string) []string {
	keys := make(map[string]bool)
	var result []string

	for _, item := range slice {
		if !keys[item] {
			keys[item] = true
			result = append(result, item)
		}
	}

	return result
}

// removeFromSlice removes a specific string from a slice
func removeFromSlice(slice []string, item string) []string {
	var result []string
	for _, s := range slice {
		if s != item {
			result = append(result, s)
		}
	}
	return result
}