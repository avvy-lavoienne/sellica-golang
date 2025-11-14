package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"time"
)

// StoragePolicy represents a Supabase storage policy
type StoragePolicy struct {
	Name       string `json:"name"`
	Definition string `json:"definition"`
	Operation  string `json:"operation"`
}

// PolicyRequest represents the request body for creating a policy via Supabase API
type PolicyRequest struct {
	Name       string `json:"name"`
	Definition string `json:"definition"`
}

// Main script to create storage RLS policies for avatars bucket
func main() {
	fmt.Println("🚀 Supabase Storage RLS Policy Configuration Script")
	fmt.Println(strings.Repeat("=", 70))

	// Get environment variables
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_ROLE_KEY")

	if supabaseURL == "" || supabaseKey == "" {
		log.Fatal("❌ ERROR: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables required")
	}

	fmt.Printf("✅ Supabase URL: %s\n", supabaseURL)
	fmt.Println()

	// Policies to create
	policies := []StoragePolicy{
		{
			Name:       "Allow authenticated users to upload avatars",
			Operation:  "INSERT",
			Definition: "auth.role() = 'authenticated'",
		},
		{
			Name:       "Allow users to update own avatars",
			Operation:  "UPDATE",
			Definition: "owner = auth.uid()",
		},
		{
			Name:       "Allow users to delete own avatars",
			Operation:  "DELETE",
			Definition: "owner = auth.uid()",
		},
	}

	fmt.Println("📋 Policies to create:")
	for i, policy := range policies {
		fmt.Printf("%d. %s (%s)\n", i+1, policy.Name, policy.Operation)
		fmt.Printf("   Condition: %s\n", policy.Definition)
	}
	fmt.Println()

	// Get bucket ID for 'avatars' bucket
	bucketID, err := getAvatarsBucketID(supabaseURL, supabaseKey)
	if err != nil {
		log.Fatalf("❌ ERROR getting avatars bucket ID: %v", err)
	}
	fmt.Printf("✅ Found avatars bucket ID: %s\n\n", bucketID)

	// Create each policy
	successCount := 0
	for _, policy := range policies {
		fmt.Printf("📝 Creating policy: %s (%s)\n", policy.Name, policy.Operation)

		err := createStoragePolicy(supabaseURL, supabaseKey, bucketID, policy)
		if err != nil {
			fmt.Printf("⚠️  WARNING: %v (may already exist)\n", err)
			// Don't fail, policy might already exist
		} else {
			fmt.Printf("✅ Created successfully\n")
			successCount++
		}
		fmt.Println()

		// Small delay between requests
		time.Sleep(500 * time.Millisecond)
	}

	fmt.Println(strings.Repeat("=", 70))
	fmt.Printf("✅ COMPLETE: %d/%d policies created\n", successCount, len(policies))
	fmt.Println()
	fmt.Println("📝 Next steps:")
	fmt.Println("1. Test avatar upload from frontend")
	fmt.Println("2. Verify HTTP 200 response (not 400)")
	fmt.Println("3. Check Supabase Storage dashboard for new policies")
	fmt.Println()
	fmt.Println("🐛 If issues persist:")
	fmt.Println("   - Check Supabase logs for RLS violations")
	fmt.Println("   - Verify user authentication token is valid")
	fmt.Println("   - Check browser Network tab for request details")
}

// getAvatarsBucketID retrieves the bucket ID for the 'avatars' bucket
func getAvatarsBucketID(supabaseURL, serviceRoleKey string) (string, error) {
	url := fmt.Sprintf("%s/rest/v1/rpc/get_storage_bucket_id", supabaseURL)

	req, err := http.NewRequest("POST", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serviceRoleKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		// Fallback: Use hardcoded bucket name to look up ID
		return getBucketIDByName(supabaseURL, serviceRoleKey, "avatars")
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return getBucketIDByName(supabaseURL, serviceRoleKey, "avatars")
	}

	body, _ := io.ReadAll(resp.Body)
	return string(bytes.TrimSpace(body)), nil
}

// getBucketIDByName queries the storage.buckets table to get bucket ID by name
func getBucketIDByName(supabaseURL, serviceRoleKey, bucketName string) (string, error) {
	url := fmt.Sprintf("%s/rest/v1/storage.buckets?name=eq.%s&select=id", supabaseURL, bucketName)

	req, err := http.NewRequest("GET", url, nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serviceRoleKey))
	req.Header.Set("apikey", serviceRoleKey)

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return "", err
	}

	var buckets []map[string]interface{}
	if err := json.Unmarshal(body, &buckets); err != nil {
		return "", fmt.Errorf("failed to parse response: %v", err)
	}

	if len(buckets) == 0 {
		return "", fmt.Errorf("bucket '%s' not found", bucketName)
	}

	if id, ok := buckets[0]["id"].(string); ok {
		return id, nil
	}

	return "", fmt.Errorf("bucket ID not found in response")
}

// createStoragePolicy creates a storage policy via Supabase API
func createStoragePolicy(supabaseURL, serviceRoleKey, bucketID string, policy StoragePolicy) error {
	url := fmt.Sprintf("%s/rest/v1/rpc/create_storage_policy", supabaseURL)

	payload := map[string]interface{}{
		"bucket_id":  bucketID,
		"name":       policy.Name,
		"operation":  policy.Operation,
		"definition": policy.Definition,
	}

	jsonPayload, err := json.Marshal(payload)
	if err != nil {
		return err
	}

	req, err := http.NewRequest("POST", url, bytes.NewBuffer(jsonPayload))
	if err != nil {
		return err
	}

	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", serviceRoleKey))
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusCreated {
		body, _ := io.ReadAll(resp.Body)
		return fmt.Errorf("API error (status %d): %s", resp.StatusCode, string(body))
	}

	return nil
}
