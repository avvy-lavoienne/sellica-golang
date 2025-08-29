package eventbus

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// RedisCache provides Redis-based distributed caching
type RedisCache struct {
	client *redis.Client
	config *AdvancedCacheConfig
}

// NewRedisCache creates a new Redis cache instance
func NewRedisCache(redisURL string, poolSize int) (*RedisCache, error) {
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		return nil, fmt.Errorf("failed to parse Redis URL: %w", err)
	}

	// Configure connection pool
	opt.PoolSize = poolSize
	opt.MinIdleConns = poolSize / 4
	opt.PoolTimeout = 30 * time.Second

	client := redis.NewClient(opt)

	// Test connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := client.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &RedisCache{
		client: client,
	}, nil
}

// Set stores a value in Redis with TTL
func (rc *RedisCache) Set(ctx context.Context, key string, value interface{}, ttl time.Duration) error {
	return rc.client.Set(ctx, key, value, ttl).Err()
}

// Get retrieves a value from Redis
func (rc *RedisCache) Get(ctx context.Context, key string) (interface{}, bool, error) {
	val, err := rc.client.Get(ctx, key).Result()
	if err == redis.Nil {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}
	return val, true, nil
}

// Delete removes a key from Redis
func (rc *RedisCache) Delete(ctx context.Context, key string) error {
	return rc.client.Del(ctx, key).Err()
}

// Exists checks if a key exists in Redis
func (rc *RedisCache) Exists(ctx context.Context, key string) (bool, error) {
	count, err := rc.client.Exists(ctx, key).Result()
	return count > 0, err
}

// Expire sets expiration on a key
func (rc *RedisCache) Expire(ctx context.Context, key string, ttl time.Duration) error {
	return rc.client.Expire(ctx, key, ttl).Err()
}

// Keys returns all keys matching a pattern
func (rc *RedisCache) Keys(ctx context.Context, pattern string) ([]string, error) {
	return rc.client.Keys(ctx, pattern).Result()
}

// FlushAll removes all keys from the current database
func (rc *RedisCache) FlushAll(ctx context.Context) error {
	return rc.client.FlushAll(ctx).Err()
}

// Ping tests the connection to Redis
func (rc *RedisCache) Ping(ctx context.Context) error {
	return rc.client.Ping(ctx).Err()
}

// Close closes the Redis connection
func (rc *RedisCache) Close() error {
	return rc.client.Close()
}

// GetStats returns Redis connection statistics
func (rc *RedisCache) GetStats() map[string]interface{} {
	stats := rc.client.PoolStats()

	return map[string]interface{}{
		"hits":       stats.Hits,
		"misses":     stats.Misses,
		"timeouts":   stats.Timeouts,
		"total_conns": stats.TotalConns,
		"idle_conns": stats.IdleConns,
		"stale_conns": stats.StaleConns,
	}
}

// SetMultiple sets multiple key-value pairs in a single operation
func (rc *RedisCache) SetMultiple(ctx context.Context, items map[string]interface{}, ttl time.Duration) error {
	pipe := rc.client.Pipeline()

	for key, value := range items {
		pipe.Set(ctx, key, value, ttl)
	}

	_, err := pipe.Exec(ctx)
	return err
}

// GetMultiple retrieves multiple keys in a single operation
func (rc *RedisCache) GetMultiple(ctx context.Context, keys []string) (map[string]interface{}, error) {
	pipe := rc.client.Pipeline()

	// Add all get commands to pipeline
	cmds := make(map[string]*redis.StringCmd)
	for _, key := range keys {
		cmds[key] = pipe.Get(ctx, key)
	}

	// Execute pipeline
	_, err := pipe.Exec(ctx)
	if err != nil && err != redis.Nil {
		return nil, err
	}

	// Collect results
	results := make(map[string]interface{})
	for key, cmd := range cmds {
		val, err := cmd.Result()
		if err == redis.Nil {
			continue // Key doesn't exist
		}
		if err != nil {
			return nil, err
		}
		results[key] = val
	}

	return results, nil
}

// Increment atomically increments a numeric value
func (rc *RedisCache) Increment(ctx context.Context, key string) (int64, error) {
	return rc.client.Incr(ctx, key).Result()
}

// Decrement atomically decrements a numeric value
func (rc *RedisCache) Decrement(ctx context.Context, key string) (int64, error) {
	return rc.client.Decr(ctx, key).Result()
}

// SetNX sets a key only if it doesn't exist (useful for distributed locks)
func (rc *RedisCache) SetNX(ctx context.Context, key string, value interface{}, ttl time.Duration) (bool, error) {
	return rc.client.SetNX(ctx, key, value, ttl).Result()
}

// Publish publishes a message to a Redis channel
func (rc *RedisCache) Publish(ctx context.Context, channel string, message interface{}) error {
	return rc.client.Publish(ctx, channel, message).Err()
}

// Subscribe subscribes to Redis channels
func (rc *RedisCache) Subscribe(ctx context.Context, channels ...string) *redis.PubSub {
	return rc.client.Subscribe(ctx, channels...)
}