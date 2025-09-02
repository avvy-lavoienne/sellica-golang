package main

import (
	"context"
	"crypto/tls"
	"fmt"
	"os"
	"strings"

	"github.com/redis/go-redis/v9"
)

func main() {
	redisURL := "rediss://default:AZt2AAIjcDE4MzM3YTAyODVjMDg0ZTcxYjBjZmQ3MWY1ZWE1ZWVmN3AxMA@creative-stingray-39798.upstash.io:6379"
	
	opt, err := redis.ParseURL(redisURL)
	if err != nil {
		fmt.Printf("Error parsing Redis URL: %v\n", err)
		os.Exit(1)
	}
	
	if strings.HasPrefix(redisURL, "rediss://") {
		if opt.TLSConfig == nil {
			opt.TLSConfig = &tls.Config{}
		}
		host := opt.Addr
		if colonIndex := strings.LastIndex(host, ":"); colonIndex != -1 {
			host = host[:colonIndex]
		}
		opt.TLSConfig.ServerName = host
	}
	
	client := redis.NewClient(opt)
	ctx := context.Background()
	
	// Check doc: keys
	docKeys, err := client.Keys(ctx, "doc:*").Result()
	if err != nil {
		fmt.Printf("Error getting doc: keys: %v\n", err)
	} else {
		fmt.Printf("Found %d doc: keys\n", len(docKeys))
		for i, key := range docKeys {
			if i < 5 {
				fmt.Printf("  %s\n", key)
			}
		}
	}
	
	// Check rag_doc: keys
	ragDocKeys, err := client.Keys(ctx, "rag_doc:*").Result()
	if err != nil {
		fmt.Printf("Error getting rag_doc: keys: %v\n", err)
	} else {
		fmt.Printf("Found %d rag_doc: keys\n", len(ragDocKeys))
		for i, key := range ragDocKeys {
			if i < 5 {
				fmt.Printf("  %s\n", key)
			}
		}
	}
	
	// Check all keys
	allKeys, err := client.Keys(ctx, "*").Result()
	if err != nil {
		fmt.Printf("Error getting all keys: %v\n", err)
	} else {
		fmt.Printf("Found %d total keys\n", len(allKeys))
		for i, key := range allKeys {
			if i < 10 {
				fmt.Printf("  %s\n", key)
			}
		}
	}
}
