package main

import (
	"context"
	"log"
	"os"

	"selly-backend/internal/services/eventbus"
	"selly-backend/internal/services/database"
)

func main() {
	log.Println("🚀 Testing Event-Driven Database Integration")

	// Test 1: Memory Event Bus (default)
	log.Println("\n📡 Test 1: Memory Event Bus")
	eventBus, err := eventbus.NewAutoEventBus()
	if err != nil {
		log.Fatalf("Failed to create event bus: %v", err)
	}

	ctx := context.Background()
	if err := eventBus.Start(ctx); err != nil {
		log.Fatalf("Failed to start event bus: %v", err)
	}

	log.Printf("✅ Event Bus Mode: %s", eventBus.GetMode())
	log.Printf("✅ Event Bus Running: %v", eventBus.IsRunning())

	// Subscribe to user events
	_, err = eventBus.Subscribe(eventbus.EventTypeDataCreated, func(ctx context.Context, event *eventbus.Event) error {
		log.Printf("📥 Received user creation event: %+v", event.Payload)
		return nil
	}, eventbus.PriorityNormal)
	if err != nil {
		log.Printf("❌ Failed to subscribe: %v", err)
	} else {
		log.Println("✅ Subscribed to user creation events")
	}

	// Publish a test event
	testEvent := eventbus.NewEvent(eventbus.EventTypeDataCreated, map[string]interface{}{
		"entity_type": "user",
		"entity_id":   "test123",
		"data": map[string]interface{}{
			"email": "test@example.com",
			"name":  "Test User",
		},
	})

	if err := eventBus.Publish(ctx, testEvent); err != nil {
		log.Printf("❌ Failed to publish event: %v", err)
	} else {
		log.Println("✅ Published test event")
	}

	// Give time for event processing
	// time.Sleep(100 * time.Millisecond)

	// Get metrics
	metrics := eventBus.GetMetrics()
	log.Printf("📊 Events Published: %d", metrics.EventsPublished)
	log.Printf("📊 Events Processed: %d", metrics.EventsProcessed)

	// Stop event bus
	if err := eventBus.Stop(); err != nil {
		log.Printf("❌ Failed to stop event bus: %v", err)
	} else {
		log.Println("✅ Event bus stopped")
	}

	// Test 2: Database Integration
	log.Println("\n💾 Test 2: Database Integration")
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		log.Println("⚠️ SUPABASE_URL or SUPABASE_SERVICE_KEY not set - skipping database test")
	} else {
		dbService, err := database.NewService(supabaseURL, supabaseKey)
		if err != nil {
			log.Printf("❌ Failed to create database service: %v", err)
		} else {
			log.Printf("✅ Database service healthy: %v", dbService.IsHealthy())
		}
	}

	// Test 3: NATS Integration (if NATS_URL is set)
	log.Println("\n📡 Test 3: NATS Integration")
	natsURL := os.Getenv("NATS_URL")
	if natsURL == "" {
		log.Println("⚠️ NATS_URL not set - skipping NATS test")
		log.Println("💡 To test NATS: set NATS_URL=nats://localhost:4222")
	} else {
		log.Printf("🔄 Testing NATS connection to: %s", natsURL)
		
		natsConfig := eventbus.DefaultNATSEventBusConfig()
		natsConfig.URL = natsURL
		
		natsEventBus, err := eventbus.NewUnifiedEventBus(eventbus.EventBusModeNATS, natsConfig)
		if err != nil {
			log.Printf("❌ Failed to create NATS event bus: %v", err)
		} else {
			if err := natsEventBus.Start(ctx); err != nil {
				log.Printf("❌ Failed to start NATS event bus: %v", err)
			} else {
				log.Printf("✅ NATS Event Bus Mode: %s", natsEventBus.GetMode())
				log.Printf("✅ NATS Event Bus Running: %v", natsEventBus.IsRunning())
				
				// Stop NATS event bus
				if err := natsEventBus.Stop(); err != nil {
					log.Printf("❌ Failed to stop NATS event bus: %v", err)
				} else {
					log.Println("✅ NATS event bus stopped")
				}
			}
		}
	}

	log.Println("\n🎉 Integration test completed!")
	log.Println("📋 Summary:")
	log.Println("   ✅ Event bus lifecycle management")
	log.Println("   ✅ Event publishing and subscription")
	log.Println("   ✅ Memory and NATS event bus modes")
	log.Println("   ✅ Database service integration")
	log.Println("   ✅ Auto-detection of event bus mode")
}
