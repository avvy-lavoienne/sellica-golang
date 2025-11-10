package profile

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"selly-backend/internal/services/cache"
)

// CacheAdapterImpl implements the CacheAdapter interface
type CacheAdapterImpl struct {
	cache *cache.Service
	ttl   time.Duration
}

// NewCacheAdapter creates a new cache adapter with TTL
func NewCacheAdapter(cache *cache.Service, ttlSeconds int) CacheAdapter {
	if ttlSeconds <= 0 {
		ttlSeconds = 300 // default 5 minutes
	}
	return &CacheAdapterImpl{
		cache: cache,
		ttl:   time.Duration(ttlSeconds) * time.Second,
	}
}

// GetProfile retrieves a cached profile
func (ca *CacheAdapterImpl) GetProfile(ctx context.Context, userID string) (*ProfileData, error) {
	key := fmt.Sprintf("profile:%s", userID)
	data, err := ca.cache.Get(key)
	if err != nil {
		// Cache miss is not an error, just return nil
		return nil, nil
	}

	if data == nil {
		return nil, nil
	}

	// Type assertion to []byte
	var profile ProfileData
	switch v := data.(type) {
	case []byte:
		if err := json.Unmarshal(v, &profile); err != nil {
			return nil, nil
		}
	case string:
		if err := json.Unmarshal([]byte(v), &profile); err != nil {
			return nil, nil
		}
	default:
		// Try to marshal and unmarshal
		jsonData, err := json.Marshal(data)
		if err != nil {
			return nil, nil
		}
		if err := json.Unmarshal(jsonData, &profile); err != nil {
			return nil, nil
		}
	}

	return &profile, nil
}

// SetProfile sets a profile in cache
func (ca *CacheAdapterImpl) SetProfile(ctx context.Context, userID string, profile *ProfileData) error {
	key := fmt.Sprintf("profile:%s", userID)
	return ca.cache.Set(key, profile, ca.ttl)
}

// InvalidateProfile removes a profile from cache
func (ca *CacheAdapterImpl) InvalidateProfile(ctx context.Context, userID string) error {
	key := fmt.Sprintf("profile:%s", userID)
	ca.cache.Delete(key)
	return nil
}

// GetAvatarURL retrieves a cached avatar URL
func (ca *CacheAdapterImpl) GetAvatarURL(ctx context.Context, userID string) (string, error) {
	key := fmt.Sprintf("avatar_url:%s", userID)
	data, err := ca.cache.Get(key)
	if err != nil {
		// Cache miss is not an error
		return "", nil
	}

	if data == nil {
		return "", nil
	}

	// Type assertion to string
	switch v := data.(type) {
	case string:
		return v, nil
	case []byte:
		return string(v), nil
	default:
		return fmt.Sprintf("%v", v), nil
	}
}

// SetAvatarURL sets an avatar URL in cache
func (ca *CacheAdapterImpl) SetAvatarURL(ctx context.Context, userID, url string) error {
	key := fmt.Sprintf("avatar_url:%s", userID)
	return ca.cache.Set(key, url, ca.ttl)
}

// InvalidateAvatar removes an avatar URL from cache
func (ca *CacheAdapterImpl) InvalidateAvatar(ctx context.Context, userID string) error {
	key := fmt.Sprintf("avatar_url:%s", userID)
	ca.cache.Delete(key)
	return nil
}

// HealthCheck verifies cache connectivity
func (ca *CacheAdapterImpl) HealthCheck(ctx context.Context) error {
	// Try to set and get a test key
	testKey := "cache_health_check"
	testValue := "ok"

	if err := ca.cache.Set(testKey, testValue, time.Second); err != nil {
		return fmt.Errorf("cache write failed: %w", err)
	}

	data, err := ca.cache.Get(testKey)
	if err != nil {
		return fmt.Errorf("cache read failed: %w", err)
	}

	if data == nil {
		return fmt.Errorf("cache health check: data not found")
	}

	// Cleanup
	ca.cache.Delete(testKey)

	return nil
}
