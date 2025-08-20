# SELLY Go Backend Makefile

# Variables
BINARY_NAME=selly-backend
MAIN_PATH=./cmd/server
BUILD_DIR=./build
DOCKER_IMAGE=selly-backend
DOCKER_TAG=latest

# Go parameters
GOCMD=go
GOBUILD=$(GOCMD) build
GOCLEAN=$(GOCMD) clean
GOTEST=$(GOCMD) test
GOGET=$(GOCMD) get
GOMOD=$(GOCMD) mod
GOFMT=gofmt

# Build flags
LDFLAGS=-ldflags "-X main.Version=$(shell git describe --tags --always --dirty) -X main.BuildTime=$(shell date -u '+%Y-%m-%d_%H:%M:%S')"

.PHONY: all build clean test coverage deps fmt lint run docker-build docker-run help

# Default target
all: clean deps fmt lint test build

# Build the application
build:
	@echo "Building $(BINARY_NAME)..."
	@mkdir -p $(BUILD_DIR)
	$(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Clean build artifacts
clean:
	@echo "Cleaning..."
	$(GOCLEAN)
	@rm -rf $(BUILD_DIR)
	@echo "Clean complete"

# Run tests
test:
	@echo "Running tests..."
	$(GOTEST) -v ./...

# Run tests with coverage
coverage:
	@echo "Running tests with coverage..."
	$(GOTEST) -v -coverprofile=coverage.out ./...
	$(GOCMD) tool cover -html=coverage.out -o coverage.html
	@echo "Coverage report generated: coverage.html"

# Download dependencies
deps:
	@echo "Downloading dependencies..."
	$(GOMOD) download
	$(GOMOD) tidy

# Format code
fmt:
	@echo "Formatting code..."
	$(GOFMT) -s -w .

# Lint code (requires golangci-lint)
lint:
	@echo "Linting code..."
	@if command -v golangci-lint >/dev/null 2>&1; then \
		golangci-lint run; \
	else \
		echo "golangci-lint not installed. Install with: go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest"; \
	fi

# Run the application
run:
	@echo "Running $(BINARY_NAME)..."
	$(GOCMD) run $(MAIN_PATH)

# Run with live reload (requires air)
dev:
	@echo "Starting development server with live reload..."
	@if command -v air >/dev/null 2>&1; then \
		air; \
	else \
		echo "air not installed. Install with: go install github.com/cosmtrek/air@latest"; \
		echo "Falling back to regular run..."; \
		$(MAKE) run; \
	fi

# Build for production
build-prod:
	@echo "Building for production..."
	@mkdir -p $(BUILD_DIR)
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -a -installsuffix cgo -o $(BUILD_DIR)/$(BINARY_NAME) $(MAIN_PATH)
	@echo "Production build complete: $(BUILD_DIR)/$(BINARY_NAME)"

# Build for multiple platforms
build-all:
	@echo "Building for multiple platforms..."
	@mkdir -p $(BUILD_DIR)
	# Linux
	CGO_ENABLED=0 GOOS=linux GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-linux-amd64 $(MAIN_PATH)
	# Windows
	CGO_ENABLED=0 GOOS=windows GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-windows-amd64.exe $(MAIN_PATH)
	# macOS
	CGO_ENABLED=0 GOOS=darwin GOARCH=amd64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-amd64 $(MAIN_PATH)
	# macOS ARM64
	CGO_ENABLED=0 GOOS=darwin GOARCH=arm64 $(GOBUILD) $(LDFLAGS) -o $(BUILD_DIR)/$(BINARY_NAME)-darwin-arm64 $(MAIN_PATH)
	@echo "Multi-platform build complete"

# Docker commands
docker-build:
	@echo "Building Docker image..."
	docker build -t $(DOCKER_IMAGE):$(DOCKER_TAG) .
	@echo "Docker image built: $(DOCKER_IMAGE):$(DOCKER_TAG)"

docker-run:
	@echo "Running Docker container..."
	docker run -d \
		--name $(BINARY_NAME) \
		-p 8080:8080 \
		--env-file .env \
		$(DOCKER_IMAGE):$(DOCKER_TAG)
	@echo "Docker container started: $(BINARY_NAME)"

docker-stop:
	@echo "Stopping Docker container..."
	docker stop $(BINARY_NAME) || true
	docker rm $(BINARY_NAME) || true

docker-logs:
	@echo "Showing Docker logs..."
	docker logs -f $(BINARY_NAME)

# Docker Compose commands
compose-up:
	@echo "Starting services with Docker Compose..."
	docker-compose up -d

compose-down:
	@echo "Stopping services with Docker Compose..."
	docker-compose down

compose-logs:
	@echo "Showing Docker Compose logs..."
	docker-compose logs -f

compose-build:
	@echo "Building services with Docker Compose..."
	docker-compose build

# Development helpers
install-tools:
	@echo "Installing development tools..."
	go install github.com/cosmtrek/air@latest
	go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest
	go install github.com/swaggo/swag/cmd/swag@latest
	@echo "Development tools installed"

# Health checks
health:
	@echo "Checking application health..."
	@curl -f http://localhost:8080/health || echo "Health check failed"

health-simple:
	@echo "Simple health check..."
	@curl -f http://localhost:8080/health/simple || echo "Simple health check failed"

# Performance testing
perf-test:
	@echo "Running performance tests..."
	@curl -s http://localhost:8080/metrics | jq '.'
	@curl -s http://localhost:8080/database/performance | jq '.'
	@curl -s http://localhost:8080/cache/performance | jq '.'

# Load testing (requires hey)
load-test:
	@echo "Running load test..."
	@if command -v hey >/dev/null 2>&1; then \
		hey -n 1000 -c 10 http://localhost:8080/health/simple; \
	else \
		echo "hey not installed. Install with: go install github.com/rakyll/hey@latest"; \
	fi

# Generate API documentation (requires swag)
docs:
	@echo "Generating API documentation..."
	@if command -v swag >/dev/null 2>&1; then \
		swag init -g cmd/server/main.go; \
	else \
		echo "swag not installed. Install with: go install github.com/swaggo/swag/cmd/swag@latest"; \
	fi

# Security scan (requires gosec)
security:
	@echo "Running security scan..."
	@if command -v gosec >/dev/null 2>&1; then \
		gosec ./...; \
	else \
		echo "gosec not installed. Install with: go install github.com/securecodewarrior/gosec/v2/cmd/gosec@latest"; \
	fi

# Benchmark tests
bench:
	@echo "Running benchmarks..."
	$(GOTEST) -bench=. -benchmem ./...

# Generate mocks (requires mockgen)
mocks:
	@echo "Generating mocks..."
	@if command -v mockgen >/dev/null 2>&1; then \
		go generate ./...; \
	else \
		echo "mockgen not installed. Install with: go install github.com/golang/mock/mockgen@latest"; \
	fi

# Help
help:
	@echo "Available commands:"
	@echo "  build         - Build the application"
	@echo "  clean         - Clean build artifacts"
	@echo "  test          - Run tests"
	@echo "  coverage      - Run tests with coverage"
	@echo "  deps          - Download dependencies"
	@echo "  fmt           - Format code"
	@echo "  lint          - Lint code"
	@echo "  run           - Run the application"
	@echo "  dev           - Run with live reload"
	@echo "  build-prod    - Build for production"
	@echo "  build-all     - Build for multiple platforms"
	@echo "  docker-build  - Build Docker image"
	@echo "  docker-run    - Run Docker container"
	@echo "  compose-up    - Start with Docker Compose"
	@echo "  compose-down  - Stop Docker Compose"
	@echo "  health        - Check application health"
	@echo "  perf-test     - Run performance tests"
	@echo "  load-test     - Run load test"
	@echo "  install-tools - Install development tools"
	@echo "  help          - Show this help"
