package main

import (
	"context"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/redis/go-redis/v9"
)

func main() {
	// Get Redis URL from environment or use the provided Upstash URL
	redisURL := os.Getenv("REDIS_URL")
	if redisURL == "" {
		redisURL = "rediss://default:AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA@creative-stingray-39798.upstash.io:6379"
		fmt.Println("Using default Upstash Redis URL")
	} else {
		fmt.Printf("Using Redis URL from environment: %s\n", maskCredentials(redisURL))
	}

	// Parse Redis URL and create client
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		log.Fatalf("Failed to parse Redis URL: %v", err)
	}

	client := redis.NewClient(opt)
	defer client.Close()

	ctx := context.Background()

	// Test connection
	fmt.Println("Testing Upstash Redis connection...")
	
	start := time.Now()
	pong, err := client.Ping(ctx).Result()
	pingDuration := time.Since(start)
	
	if err != nil {
		log.Fatalf("Failed to ping Redis: %v", err)
	}
	
	fmt.Printf("✅ Connection successful! Ping: %s (took %v)\n", pong, pingDuration)

	// Test basic operations
	fmt.Println("\nTesting basic operations...")

	// Test SET operation
	testKey := "upstash_test_key"
	testValue := "Hello from SELLY Go Backend!"
	
	start = time.Now()
	err = client.Set(ctx, testKey, testValue, 5*time.Minute).Err()
	setDuration := time.Since(start)
	
	if err != nil {
		log.Fatalf("Failed to set key: %v", err)
	}
	fmt.Printf("✅ SET operation successful (took %v)\n", setDuration)

	// Test GET operation
	start = time.Now()
	val, err := client.Get(ctx, testKey).Result()
	getDuration := time.Since(start)
	
	if err != nil {
		log.Fatalf("Failed to get key: %v", err)
	}
	fmt.Printf("✅ GET operation successful: %s (took %v)\n", val, getDuration)

	// Test JSON data
	fmt.Println("\nTesting JSON data operations...")
	
	jsonKey := "upstash_json_test"
	jsonData := map[string]interface{}{
		"message":   "Training data test",
		"timestamp": time.Now().Unix(),
		"metadata": map[string]interface{}{
			"accuracy":   0.95,
			"model_type": "tensorflow",
		},
	}

	// Convert to JSON string for Redis
	jsonStr := fmt.Sprintf(`{"message":"%s","timestamp":%d,"metadata":{"accuracy":%.2f,"model_type":"%s"}}`,
		jsonData["message"], jsonData["timestamp"], 
		jsonData["metadata"].(map[string]interface{})["accuracy"],
		jsonData["metadata"].(map[string]interface{})["model_type"])

	start = time.Now()
	err = client.Set(ctx, jsonKey, jsonStr, 5*time.Minute).Err()
	jsonSetDuration := time.Since(start)
	
	if err != nil {
		log.Fatalf("Failed to set JSON data: %v", err)
	}
	fmt.Printf("✅ JSON SET operation successful (took %v)\n", jsonSetDuration)

	start = time.Now()
	jsonVal, err := client.Get(ctx, jsonKey).Result()
	jsonGetDuration := time.Since(start)
	
	if err != nil {
		log.Fatalf("Failed to get JSON data: %v", err)
	}
	fmt.Printf("✅ JSON GET operation successful: %s (took %v)\n", jsonVal, jsonGetDuration)

	// Test performance with multiple operations
	fmt.Println("\nTesting performance with multiple operations...")
	
	operationCount := 10
	totalDuration := time.Duration(0)
	
	for i := 0; i < operationCount; i++ {
		key := fmt.Sprintf("perf_test_%d", i)
		value := fmt.Sprintf("Performance test value %d", i)
		
		start = time.Now()
		err = client.Set(ctx, key, value, 1*time.Minute).Err()
		if err != nil {
			log.Printf("Failed to set key %s: %v", key, err)
			continue
		}
		
		_, err = client.Get(ctx, key).Result()
		if err != nil {
			log.Printf("Failed to get key %s: %v", key, err)
			continue
		}
		
		opDuration := time.Since(start)
		totalDuration += opDuration
	}
	
	avgDuration := totalDuration / time.Duration(operationCount)
	fmt.Printf("✅ Performance test completed: %d operations, average %v per operation\n", 
		operationCount, avgDuration)

	// Test TTL functionality
	fmt.Println("\nTesting TTL functionality...")
	
	ttlKey := "upstash_ttl_test"
	err = client.Set(ctx, ttlKey, "TTL test value", 2*time.Second).Err()
	if err != nil {
		log.Fatalf("Failed to set TTL key: %v", err)
	}
	
	// Check TTL
	ttl, err := client.TTL(ctx, ttlKey).Result()
	if err != nil {
		log.Fatalf("Failed to get TTL: %v", err)
	}
	fmt.Printf("✅ TTL set successfully: %v remaining\n", ttl)

	// Clean up test keys
	fmt.Println("\nCleaning up test keys...")
	
	keys := []string{testKey, jsonKey, ttlKey}
	for i := 0; i < operationCount; i++ {
		keys = append(keys, fmt.Sprintf("perf_test_%d", i))
	}
	
	deleted, err := client.Del(ctx, keys...).Result()
	if err != nil {
		log.Printf("Warning: Failed to clean up some keys: %v", err)
	} else {
		fmt.Printf("✅ Cleaned up %d test keys\n", deleted)
	}

	// Performance summary
	separator := strings.Repeat("=", 60)
	fmt.Println("\n" + separator)
	fmt.Println("UPSTASH REDIS INTEGRATION TEST SUMMARY")
	fmt.Println(separator)
	fmt.Printf("Connection Ping:     %v\n", pingDuration)
	fmt.Printf("SET Operation:       %v\n", setDuration)
	fmt.Printf("GET Operation:       %v\n", getDuration)
	fmt.Printf("JSON SET Operation:  %v\n", jsonSetDuration)
	fmt.Printf("JSON GET Operation:  %v\n", jsonGetDuration)
	fmt.Printf("Average Operation:   %v\n", avgDuration)
	fmt.Println(separator)
	
	// Check if performance meets Phase 1 requirements
	if avgDuration <= 30*time.Millisecond {
		fmt.Println("✅ PERFORMANCE: Meets Phase 1 requirements (≤30ms)")
	} else {
		fmt.Printf("⚠️  PERFORMANCE: Exceeds Phase 1 target (>30ms, actual: %v)\n", avgDuration)
	}
	
	fmt.Println("✅ Upstash Redis integration test completed successfully!")
}

// maskCredentials masks sensitive parts of the Redis URL for logging
func maskCredentials(url string) string {
	if len(url) < 20 {
		return url
	}
	
	// Find the @ symbol to locate credentials
	atIndex := -1
	for i, char := range url {
		if char == '@' {
			atIndex = i
			break
		}
	}
	
	if atIndex == -1 {
		return url
	}
	
	// Find the start of credentials (after ://)
	credStart := -1
	for i := 0; i < atIndex-2; i++ {
		if url[i:i+3] == "://" {
			credStart = i + 3
			break
		}
	}
	
	if credStart == -1 {
		return url
	}
	
	// Mask the credentials
	masked := url[:credStart] + "***:***" + url[atIndex:]
	return masked
}
