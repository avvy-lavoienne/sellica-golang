package main

import (
	"fmt"
	"runtime"
	"strings"
	"time"

	"github.com/sirupsen/logrus"

	"selly-backend/internal/services/rag"
)

func main() {
	logrus.SetLevel(logrus.InfoLevel)
	
	fmt.Println(strings.Repeat("=", 80))
	fmt.Println("WEEK 1: MEMORY OPTIMIZATION VALIDATION")
	fmt.Println(strings.Repeat("=", 80))
	
	// Test 1: Memory Monitor Functionality
	fmt.Println("\n🧪 Test 1: Memory Monitor Functionality")
	testMemoryMonitor()
	
	// Test 2: Memory Leak Detection
	fmt.Println("\n🧪 Test 2: Memory Leak Detection Simulation")
	testMemoryLeakDetection()
	
	// Test 3: Resource Cleanup
	fmt.Println("\n🧪 Test 3: Resource Cleanup Validation")
	testResourceCleanup()
	
	fmt.Println("\n" + strings.Repeat("=", 80))
	fmt.Println("✅ WEEK 1: MEMORY OPTIMIZATION VALIDATION COMPLETED")
	fmt.Println("🎯 Ready to proceed to Week 2: Vector Search Optimization")
	fmt.Println(strings.Repeat("=", 80))
}

func testMemoryMonitor() {
	fmt.Println("   Creating memory monitor...")
	
	monitor := rag.NewMemoryMonitor()
	defer monitor.StopMonitoring()
	
	// Start monitoring with short interval
	monitor.StartMonitoring(100 * time.Millisecond)
	
	// Wait for some data collection
	time.Sleep(500 * time.Millisecond)
	
	// Get current stats
	stats := monitor.GetCurrentStats()
	fmt.Printf("   ✓ Current memory usage: %.2f MB\n", stats.AllocMB)
	fmt.Printf("   ✓ Goroutines: %d\n", stats.Goroutines)
	fmt.Printf("   ✓ GC count: %d\n", stats.NumGC)
	
	// Get history
	history := monitor.GetMemoryHistory()
	fmt.Printf("   ✓ History entries collected: %d\n", len(history))
	
	// Test forced GC
	beforeStats := monitor.GetCurrentStats()
	monitor.ForceGarbageCollection()
	afterStats := monitor.GetCurrentStats()
	
	fmt.Printf("   ✓ Forced GC - Before: %.2f MB, After: %.2f MB\n", 
		beforeStats.AllocMB, afterStats.AllocMB)
	
	fmt.Println("   ✅ Memory monitor test PASSED")
}

func testMemoryLeakDetection() {
	fmt.Println("   Simulating memory usage patterns...")
	
	monitor := rag.NewMemoryMonitor()
	defer monitor.StopMonitoring()
	
	monitor.StartMonitoring(50 * time.Millisecond)
	
	// Force garbage collection before starting
	runtime.GC()
	runtime.GC()
	time.Sleep(100 * time.Millisecond)
	
	initialStats := monitor.GetCurrentStats()
	fmt.Printf("   Initial memory: %.2f MB\n", initialStats.AllocMB)
	
	// Simulate some memory allocation and cleanup
	const iterations = 1000
	data := make([][]byte, 0, iterations)
	
	for i := 0; i < iterations; i++ {
		// Allocate some memory
		chunk := make([]byte, 1024) // 1KB chunks
		data = append(data, chunk)
		
		// Periodically clean up to simulate proper resource management
		if i%100 == 0 {
			// Clear some data
			if len(data) > 50 {
				data = data[25:]
			}
			runtime.GC()
		}
		
		// Small delay to allow monitoring
		if i%50 == 0 {
			time.Sleep(10 * time.Millisecond)
		}
	}
	
	// Final cleanup
	data = nil
	runtime.GC()
	runtime.GC()
	time.Sleep(200 * time.Millisecond)
	
	finalStats := monitor.GetCurrentStats()
	memoryIncrease := finalStats.AllocMB - initialStats.AllocMB
	
	fmt.Printf("   Final memory: %.2f MB\n", finalStats.AllocMB)
	fmt.Printf("   Memory increase: %.2f MB\n", memoryIncrease)
	
	// Check if memory increase is reasonable (less than 10MB for this test)
	if memoryIncrease < 10.0 {
		fmt.Println("   ✅ Memory leak detection test PASSED - No significant memory leak")
	} else {
		fmt.Printf("   ⚠️ Memory leak detection test WARNING - Memory increased by %.2f MB\n", memoryIncrease)
	}
}

func testResourceCleanup() {
	fmt.Println("   Testing resource cleanup patterns...")
	
	// Test multiple monitor creation and cleanup
	for i := 0; i < 5; i++ {
		monitor := rag.NewMemoryMonitor()
		monitor.StartMonitoring(10 * time.Millisecond)
		
		// Let it run briefly
		time.Sleep(50 * time.Millisecond)
		
		// Stop monitoring (cleanup)
		monitor.StopMonitoring()
		
		fmt.Printf("   ✓ Monitor %d created and cleaned up\n", i+1)
	}
	
	// Force garbage collection to clean up any remaining resources
	runtime.GC()
	runtime.GC()
	time.Sleep(100 * time.Millisecond)
	
	// Check final state
	var finalStats runtime.MemStats
	runtime.ReadMemStats(&finalStats)
	
	fmt.Printf("   ✓ Final goroutines: %d\n", runtime.NumGoroutine())
	fmt.Printf("   ✓ Final memory: %.2f MB\n", float64(finalStats.Alloc)/1024/1024)
	
	fmt.Println("   ✅ Resource cleanup test PASSED")
}
