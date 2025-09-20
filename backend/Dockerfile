# Multi-stage Docker build for Go backend
FROM golang:1.21-alpine AS builder

# Install dependencies
RUN apk add --no-cache git ca-certificates tzdata

# Set working directory
WORKDIR /app

# Copy go mod files
COPY go.mod go.sum ./

# Download dependencies
RUN go mod download

# Copy source code
COPY . .

# Build the application
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -ldflags '-extldflags "-static"' -o selly-backend ./cmd/server

# Final stage - minimal runtime image
FROM alpine:latest

# Install ca-certificates for HTTPS requests
RUN apk --no-cache add ca-certificates tzdata

# Create non-root user
RUN addgroup -g 1001 -S selly && \
    adduser -S selly -u 1001

# Set working directory
WORKDIR /app

# Copy the binary from builder stage
COPY --from=builder /app/selly-backend .

# Copy configuration files if they exist
COPY --from=builder /app/.env* ./

# Change ownership to non-root user
RUN chown -R selly:selly /app
USER selly

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health/simple || exit 1

# Run the application
CMD ["./selly-backend"]
