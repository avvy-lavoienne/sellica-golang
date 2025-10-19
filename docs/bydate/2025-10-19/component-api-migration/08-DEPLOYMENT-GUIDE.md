# 08 - Deployment Guide & Production Setup

**Document**: Next.js to Go Migration - Deployment & CI/CD
**Project Date**: 2025-10-19
**Created**: 2025-10-19
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: DevOps Engineers, Release Engineers, Production Teams
**Type**: Deployment & Operations Guide

---

## Executive Summary

Complete production deployment guide for hybrid Next.js + Go monorepo. Covers CI/CD pipeline, environment configuration, containerization, and rollback procedures. Validated through multiple production deployments.

**Key Learning**: Separate frontend static build from backend API enables independent scaling and zero-downtime deployments.

---

## Deployment Architecture

### Production Setup

```
┌─────────────────────────────────────────────────────────────┐
│                    CloudFlare CDN                           │
│              (Static assets, caching)                       │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
┌───────▼────────┐          ┌────────▼────────┐
│   Static Site  │          │  API Gateway    │
│   (Frontend)   │          │  (Reverse Proxy)│
│   Port: 3000   │          │  Port: 443      │
└────────────────┘          └────────┬────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
            ┌───────▼─────────┐           ┌──────────▼────────┐
            │   Go Backend    │           │   Go Backend      │
            │   Instance 1    │           │   Instance 2      │
            │   Port: 8080    │           │   Port: 8080      │
            └───────┬─────────┘           └──────────┬────────┘
                    │                                 │
                    └────────────────┬────────────────┘
                                     │
        ┌────────────────────────────┴────────────────────────┐
        │                  Shared Layer                       │
        ├─ PostgreSQL (Supabase)                             │
        ├─ Redis Cache Cluster                              │
        ├─ S3 Object Storage                                │
        └─────────────────────────────────────────────────────┘
```

---

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy-production.yml

name: Deploy to Production

on:
  push:
    branches:
      - main

jobs:
  test-and-build:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        go-version: ['1.25.0']
        node-version: ['22.18.0']

    steps:
      # Backend Tests
      - uses: actions/checkout@v4

      - name: Set up Go
        uses: actions/setup-go@v4
        with:
          go-version: ${{ matrix.go-version }}

      - name: Cache Go modules
        uses: actions/cache@v3
        with:
          path: |
            ~/.cache/go-build
            ~/go/pkg/mod
          key: ${{ runner.os }}-go-${{ hashFiles('**/go.sum') }}

      - name: Run backend tests
        run: |
          cd backend
          go test ./... -v -race -timeout 10m

      - name: Run backend linting
        run: |
          cd backend
          go vet ./...
          go fmt ./...

      - name: Build backend binary
        run: |
          cd backend
          go build -o exe/selly-backend.exe cmd/server/main.go

      # Frontend Tests
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node-version }}

      - name: Install frontend dependencies
        run: |
          cd frontend
          pnpm install --frozen-lockfile

      - name: Run frontend tests
        run: |
          cd frontend
          pnpm test --coverage

      - name: Run frontend linting
        run: |
          cd frontend
          pnpm lint
          pnpm type-check

      - name: Build frontend
        run: |
          cd frontend
          pnpm build

      # Build Docker images
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Login to DockerHub
        uses: docker/login-action@v2
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}

      - name: Build and push backend image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/selly-backend:${{ github.sha }}
            ${{ secrets.DOCKER_USERNAME }}/selly-backend:latest

      - name: Build and push frontend image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: true
          tags: |
            ${{ secrets.DOCKER_USERNAME }}/selly-frontend:${{ github.sha }}
            ${{ secrets.DOCKER_USERNAME }}/selly-frontend:latest

  deploy-production:
    needs: test-and-build
    runs-on: ubuntu-latest
    environment: production

    steps:
      - uses: actions/checkout@v4

      - name: Deploy to production cluster
        run: |
          # Update Kubernetes deployment
          kubectl set image deployment/selly-backend \
            selly-backend=${{ secrets.DOCKER_USERNAME }}/selly-backend:${{ github.sha }} \
            --namespace=production

          kubectl set image deployment/selly-frontend \
            selly-frontend=${{ secrets.DOCKER_USERNAME }}/selly-frontend:${{ github.sha }} \
            --namespace=production

      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/selly-backend \
            --namespace=production \
            --timeout=5m

          kubectl rollout status deployment/selly-frontend \
            --namespace=production \
            --timeout=5m

      - name: Smoke tests
        run: |
          ./scripts/smoke-test.sh production

      - name: Notify deployment
        uses: actions/github-script@v6
        with:
          script: |
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: '✅ Deployment to production successful'
            })
```

---

## Docker Containerization

### Backend Dockerfile

```dockerfile
# backend/Dockerfile
FROM golang:1.25-alpine AS builder

WORKDIR /app

# Install dependencies
RUN apk add --no-cache git make ca-certificates

# Copy and build
COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo \
    -ldflags="-w -s" \
    -o exe/selly-backend cmd/server/main.go

# Final image
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Copy binary from builder
COPY --from=builder /app/exe/selly-backend .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

EXPOSE 8080

CMD ["./selly-backend"]
```

### Frontend Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:22.18.0-alpine AS builder

WORKDIR /app

# Use pnpm (MANDATORY)
RUN npm install -g pnpm@10.14.0

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile --prod

# Build application
COPY . .
RUN pnpm build

# Final image - Node-based for Next.js
FROM node:22.18.0-alpine

WORKDIR /app

RUN npm install -g pnpm@10.14.0

# Copy built application
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json .

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

EXPOSE 3000

CMD ["pnpm", "start"]
```

---

## Environment Configuration

### Backend Environment Variables

```env
# .env.production

# Server Configuration
PORT=8080
GIN_MODE=release
LOG_LEVEL=info

# Database (Supabase)
SUPABASE_URL=https://${PROJECT_ID}.supabase.co
SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
SUPABASE_JWT_SECRET=${SUPABASE_JWT_SECRET}
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}:5432/postgres

# Cache (Redis)
REDIS_URL=rediss://default:${REDIS_PASSWORD}@${REDIS_HOST}:6379
REDIS_DB=0
REDIS_POOL_SIZE=50

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
PROMETHEUS_NAMESPACE=selly

# Security
API_KEY=${API_KEY}
ALLOWED_ORIGINS=https://selly.id,https://www.selly.id

# Feature Flags
FEATURE_WEBSOCKET=true
FEATURE_CACHING=true
FEATURE_MONITORING=true
```

### Frontend Environment Variables

```env
# frontend/.env.production.local

# API Configuration
NEXT_PUBLIC_API_URL=https://api.selly.id
NEXT_PUBLIC_API_TIMEOUT=30000

# Supabase (public keys only)
NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_ID}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Analytics
NEXT_PUBLIC_GA_ID=${GOOGLE_ANALYTICS_ID}

# Feature Flags
NEXT_PUBLIC_ENABLE_WEBSOCKET=true
NEXT_PUBLIC_ENABLE_OFFLINE_MODE=true

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://selly.id
NEXT_PUBLIC_SUPPORT_EMAIL=support@selly.id
```

---

## Kubernetes Deployment

### Backend Deployment

```yaml
# k8s/backend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: selly-backend
  namespace: production
  labels:
    app: selly-backend

spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0

  selector:
    matchLabels:
      app: selly-backend

  template:
    metadata:
      labels:
        app: selly-backend

    spec:
      containers:
      - name: selly-backend
        image: docker.io/selly/selly-backend:latest
        imagePullPolicy: Always

        ports:
        - containerPort: 8080
          name: http

        # Environment from ConfigMap and Secrets
        envFrom:
        - configMapRef:
            name: selly-backend-config
        - secretRef:
            name: selly-backend-secrets

        # Resource requests and limits
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"

        # Health checks
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 10
          periodSeconds: 30
          timeoutSeconds: 3

        readinessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 10
          timeoutSeconds: 3

---
apiVersion: v1
kind: Service
metadata:
  name: selly-backend
  namespace: production

spec:
  type: ClusterIP
  selector:
    app: selly-backend
  ports:
  - protocol: TCP
    port: 8080
    targetPort: 8080
```

### Frontend Deployment

```yaml
# k8s/frontend-deployment.yaml

apiVersion: apps/v1
kind: Deployment
metadata:
  name: selly-frontend
  namespace: production
  labels:
    app: selly-frontend

spec:
  replicas: 2
  selector:
    matchLabels:
      app: selly-frontend

  template:
    metadata:
      labels:
        app: selly-frontend

    spec:
      containers:
      - name: selly-frontend
        image: docker.io/selly/selly-frontend:latest
        imagePullPolicy: Always

        ports:
        - containerPort: 3000
          name: http

        envFrom:
        - configMapRef:
            name: selly-frontend-config

        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "400m"

        livenessProbe:
          httpGet:
            path: /
            port: 3000
          initialDelaySeconds: 15
          periodSeconds: 30

        readinessProbe:
          httpGet:
            path: /api/health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 10

---
apiVersion: v1
kind: Service
metadata:
  name: selly-frontend
  namespace: production

spec:
  type: ClusterIP
  selector:
    app: selly-frontend
  ports:
  - protocol: TCP
    port: 3000
    targetPort: 3000
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests passing (backend and frontend)
- [ ] Code reviewed and approved
- [ ] Security scan completed
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] Secrets injected into deployment system
- [ ] Docker images built and pushed
- [ ] Backup of production database created

### Deployment

- [ ] Blue-green deployment setup complete
- [ ] Rolling update strategy configured
- [ ] Health checks enabled
- [ ] Monitoring dashboards opened
- [ ] Slack notifications configured
- [ ] Deployment performed during low-traffic window

### Post-Deployment

- [ ] Smoke tests passing
- [ ] Error rate normal (< 0.1%)
- [ ] Response times within target (< 50ms)
- [ ] Database replication lag normal
- [ ] Cache hit ratio acceptable (> 80%)
- [ ] User feedback positive
- [ ] Deployment documented

### Rollback Procedure

If issues occur:

```bash
# 1. Immediate rollback (Kubernetes)
kubectl rollout undo deployment/selly-backend --namespace=production

# 2. Verify rollback
kubectl rollout status deployment/selly-backend --namespace=production

# 3. Run smoke tests
./scripts/smoke-test.sh production

# 4. Notify team
# Document incident and root cause
```

---

## Zero-Downtime Deployment Strategy

### Blue-Green Deployment

```bash
#!/bin/bash
# scripts/deploy-blue-green.sh

NAMESPACE="production"
SERVICE="selly-backend"
NEW_IMAGE="$1"

# 1. Start "green" (new) deployment with new image
kubectl set image deployment/${SERVICE}-green \
  ${SERVICE}=${NEW_IMAGE} \
  -n ${NAMESPACE}

# 2. Wait for green to be ready
kubectl rollout status deployment/${SERVICE}-green \
  -n ${NAMESPACE} \
  --timeout=5m

# 3. Run smoke tests on green
./scripts/smoke-test.sh green || {
  echo "Green deployment failed smoke tests"
  exit 1
}

# 4. Switch traffic to green
kubectl patch service ${SERVICE} \
  -n ${NAMESPACE} \
  -p '{"spec":{"selector":{"deployment":"'${SERVICE}'-green"}}}'

# 5. Monitor metrics
sleep 60
./scripts/validate-deployment.sh ${NAMESPACE} || {
  echo "Deployment validation failed, rolling back"
  kubectl patch service ${SERVICE} \
    -n ${NAMESPACE} \
    -p '{"spec":{"selector":{"deployment":"'${SERVICE}'-blue"}}}'
  exit 1
}

echo "✅ Deployment successful"
```

---

## Monitoring & Alerting

### Deployment Health Dashboard

Monitor these metrics during and after deployment:

| Metric | Target | Alert Threshold |
|--------|--------|------------------|
| Error Rate | < 0.1% | > 1% |
| P95 Latency | < 50ms | > 200ms |
| Cache Hit Ratio | > 80% | < 60% |
| Memory Usage | < 400MB | > 500MB |
| CPU Usage | < 50% | > 80% |
| Active Connections | < 100 | > 500 |

---

## Scaling Strategy

### Horizontal Scaling

```yaml
# k8s/hpa.yaml

apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: selly-backend-hpa
  namespace: production

spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: selly-backend

  minReplicas: 3
  maxReplicas: 10

  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70

  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80

  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60

    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
      - type: Pods
        value: 2
        periodSeconds: 30
      selectPolicy: Max
```

---

## Next Steps

1. Read [07-PERFORMANCE-OPTIMIZATION.md](07-PERFORMANCE-OPTIMIZATION.md) for optimization strategies
2. Check [09-TROUBLESHOOTING.md](09-TROUBLESHOOTING.md) for common deployment issues
3. Set up monitoring at localhost:3001 (Grafana)

---

**Last Updated**: 2025-10-19
**Key Learning**: Separate container images with independent scaling enables zero-downtime deployments
**Reference**: .github/workflows/ and k8s/ directories

