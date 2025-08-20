module selly-backend

go 1.21

require (
	// Web Framework
	github.com/gin-gonic/gin v1.9.1
	github.com/gin-contrib/cors v1.4.0
	github.com/gin-contrib/gzip v0.0.6

	// Database & Storage
	github.com/supabase-community/supabase-go v0.0.1
	github.com/supabase-community/postgrest-go v0.0.2

	// Caching
	github.com/go-redis/redis/v8 v8.11.5
	github.com/patrickmn/go-cache v2.1.0+incompatible

	// Authentication & Security
	github.com/golang-jwt/jwt/v4 v4.5.0
	golang.org/x/crypto v0.12.0

	// Configuration & Environment
	github.com/joho/godotenv v1.4.0
	github.com/spf13/viper v1.16.0

	// Monitoring & Metrics
	github.com/prometheus/client_golang v1.16.0
	github.com/sirupsen/logrus v1.9.3

	// Utilities
	github.com/google/uuid v1.3.0
	github.com/go-playground/validator/v10 v10.15.1

	// Testing
	github.com/stretchr/testify v1.8.4
	github.com/golang/mock v1.6.0
)
