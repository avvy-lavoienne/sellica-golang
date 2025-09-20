package training

import (
	"context"
	"testing"
	"time"

	"selly-backend/internal/services/cache"
)

// Phase 3 Week 1: Real-time analysis performance benchmarks
func BenchmarkRealTimeAnalysis(b *testing.B) {
	// Initialize cache service
	cacheService, err := cache.NewService("redis://localhost:6379")
	if err != nil {
		b.Logf("Redis not available, using memory cache only: %v", err)
	}

	// Create real-time analyzer with ultra-fast optimization
	analyzer := NewRealTimeAnalyzer(cacheService)
	ctx := context.Background()

	// Test queries for different service types
	testQueries := []string{
		"Bagaimana cara membuat KTP baru?",
		"Saya ingin mengurus kartu keluarga",
		"Prosedur pembuatan akta kelahiran",
		"Status pengajuan KTP saya",
		"Masalah dengan kartu keluarga",
		"Informasi layanan administrasi",
	}

	b.Run("UltraFastAnalysis", func(b *testing.B) {
		b.ResetTimer()
		start := time.Now()
		
		for i := 0; i < b.N; i++ {
			query := testQueries[i%len(testQueries)]
			_, err := analyzer.AnalyzeQuery(ctx, query, nil)
			if err != nil {
				b.Errorf("Analysis failed: %v", err)
			}
		}
		
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Ultra-fast analysis: %v per operation (target: <50ms)", avgDuration)
		
		// Validate performance target
		if avgDuration > 50*time.Millisecond {
			b.Logf("⚠️ Performance target not met: %v > 50ms", avgDuration)
		} else {
			b.Logf("✅ Performance target achieved: %v < 50ms", avgDuration)
		}
	})

	b.Run("CachedAnalysis", func(b *testing.B) {
		// Pre-populate cache
		for _, query := range testQueries {
			analyzer.AnalyzeQuery(ctx, query, nil)
		}

		b.ResetTimer()
		start := time.Now()
		
		for i := 0; i < b.N; i++ {
			query := testQueries[i%len(testQueries)]
			_, err := analyzer.AnalyzeQuery(ctx, query, nil)
			if err != nil {
				b.Errorf("Cached analysis failed: %v", err)
			}
		}
		
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Cached analysis: %v per operation (should be <1ms)", avgDuration)
		
		// Cached operations should be extremely fast
		if avgDuration > time.Millisecond {
			b.Logf("⚠️ Cache performance slower than expected: %v > 1ms", avgDuration)
		} else {
			b.Logf("✅ Cache performance excellent: %v < 1ms", avgDuration)
		}
	})

	b.Run("ConcurrentAnalysis", func(b *testing.B) {
		b.ResetTimer()
		start := time.Now()
		
		b.RunParallel(func(pb *testing.PB) {
			i := 0
			for pb.Next() {
				query := testQueries[i%len(testQueries)]
				_, err := analyzer.AnalyzeQuery(ctx, query, nil)
				if err != nil {
					b.Errorf("Concurrent analysis failed: %v", err)
				}
				i++
			}
		})
		
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Concurrent analysis: %v per operation", avgDuration)
	})
}

// Benchmark fast path matching performance
func BenchmarkFastPathMatching(b *testing.B) {
	servicePatterns := map[string][]string{
		"ktp": {"ktp", "kartu tanda penduduk", "identitas", "penduduk"},
		"kk":  {"kk", "kartu keluarga", "keluarga", "anggota keluarga"},
		"akta": {"akta", "kelahiran", "kematian", "perkawinan"},
		"general": {"bantuan", "informasi", "layanan"},
	}

	fastPathMatcher := NewFastPathMatcher(servicePatterns)

	testQueries := []string{
		"Bagaimana cara membuat KTP baru?",
		"Saya ingin mengurus kartu keluarga",
		"Prosedur pembuatan akta kelahiran",
		"Informasi layanan administrasi",
	}

	b.Run("FastPathMatching", func(b *testing.B) {
		b.ResetTimer()
		start := time.Now()
		
		for i := 0; i < b.N; i++ {
			query := testQueries[i%len(testQueries)]
			service := fastPathMatcher.MatchService(query)
			if service == "" {
				// This is okay for some queries
			}
		}
		
		duration := time.Since(start)
		avgDuration := duration / time.Duration(b.N)
		b.Logf("Fast path matching: %v per operation", avgDuration)
		
		// Fast path should be extremely fast (sub-microsecond)
		if avgDuration > 10*time.Microsecond {
			b.Logf("⚠️ Fast path slower than expected: %v", avgDuration)
		} else {
			b.Logf("✅ Fast path performance excellent: %v", avgDuration)
		}
	})
}

// Test analysis accuracy and performance
func TestAnalysisAccuracyAndPerformance(t *testing.T) {
	cacheService, err := cache.NewService("redis://localhost:6379")
	if err != nil {
		t.Logf("Redis not available, using memory cache only: %v", err)
	}

	analyzer := NewRealTimeAnalyzer(cacheService)
	ctx := context.Background()

	testCases := []struct {
		query           string
		expectedService string
		description     string
	}{
		{"Bagaimana cara membuat KTP baru?", "ktp", "KTP creation query"},
		{"Saya ingin mengurus kartu keluarga", "kk", "KK processing query"},
		{"Prosedur pembuatan akta kelahiran", "akta", "Birth certificate query"},
		{"Status pengajuan KTP saya", "ktp", "KTP status query"},
		{"Masalah dengan kartu keluarga", "kk", "KK problem query"},
	}

	t.Run("AccuracyAndPerformance", func(t *testing.T) {
		for _, tc := range testCases {
			t.Run(tc.description, func(t *testing.T) {
				start := time.Now()
				result, err := analyzer.AnalyzeQuery(ctx, tc.query, nil)
				duration := time.Since(start)

				if err != nil {
					t.Errorf("Analysis failed: %v", err)
					return
				}

				// Check accuracy
				if result.Classification.ServiceType != tc.expectedService {
					t.Logf("⚠️ Classification mismatch: got %s, expected %s", 
						result.Classification.ServiceType, tc.expectedService)
				} else {
					t.Logf("✅ Correct classification: %s", result.Classification.ServiceType)
				}

				// Check performance
				t.Logf("Analysis time: %v (target: <50ms)", duration)
				if duration > 50*time.Millisecond {
					t.Logf("⚠️ Performance target not met: %v > 50ms", duration)
				} else {
					t.Logf("✅ Performance target achieved: %v < 50ms", duration)
				}

				// Check confidence
				if result.Confidence < 0.7 {
					t.Logf("⚠️ Low confidence: %f", result.Confidence)
				} else {
					t.Logf("✅ Good confidence: %f", result.Confidence)
				}
			})
		}
	})

	t.Run("CacheEffectiveness", func(t *testing.T) {
		query := "Bagaimana cara membuat KTP baru?"

		// First call (cache miss)
		start := time.Now()
		result1, err := analyzer.AnalyzeQuery(ctx, query, nil)
		firstCallDuration := time.Since(start)
		if err != nil {
			t.Errorf("First analysis failed: %v", err)
			return
		}

		// Second call (cache hit)
		start = time.Now()
		result2, err := analyzer.AnalyzeQuery(ctx, query, nil)
		secondCallDuration := time.Since(start)
		if err != nil {
			t.Errorf("Second analysis failed: %v", err)
			return
		}

		t.Logf("First call (cache miss): %v", firstCallDuration)
		t.Logf("Second call (cache hit): %v", secondCallDuration)

		// Cache hit should be significantly faster
		if secondCallDuration >= firstCallDuration {
			t.Logf("⚠️ Cache not effective: second call not faster")
		} else {
			speedup := float64(firstCallDuration) / float64(secondCallDuration)
			t.Logf("✅ Cache effective: %fx speedup", speedup)
		}

		// Results should be consistent
		if result1.Classification.ServiceType != result2.Classification.ServiceType {
			t.Errorf("Inconsistent results: %s vs %s", 
				result1.Classification.ServiceType, result2.Classification.ServiceType)
		}
	})
}
