# References and Resources

**Document**: Complete Reference Guide
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📝 Low
**Language**: English
**Audience**: All Teams
**Type**: Reference Guide

## Documentation Index

### This Analysis (Frontend API Communication)

1. [01-EXECUTIVE-SUMMARY.md](./01-EXECUTIVE-SUMMARY.md) - High-level overview
2. [02-AUTHENTICATION-FLOW.md](./02-AUTHENTICATION-FLOW.md) - Auth architecture
3. [03-COMMUNICATION-PATTERNS.md](./03-COMMUNICATION-PATTERNS.md) - Three API patterns
4. [04-PROTECTED-ROUTES-INVENTORY.md](./04-PROTECTED-ROUTES-INVENTORY.md) - Complete route list
5. [05-API-PROXY-ROUTES.md](./05-API-PROXY-ROUTES.md) - Next.js proxy implementation
6. [06-DIRECT-SUPABASE-USAGE.md](./06-DIRECT-SUPABASE-USAGE.md) - Direct Supabase analysis
7. [07-PERFORMANCE-ANALYSIS.md](./07-PERFORMANCE-ANALYSIS.md) - Performance metrics
8. [08-MIGRATION-STATUS.md](./08-MIGRATION-STATUS.md) - Migration progress
9. [09-BEST-PRACTICES.md](./09-BEST-PRACTICES.md) - Development guidelines
10. [10-REFERENCES.md](./10-REFERENCES.md) - This document

## Project Documentation

### Root-Level Documentation

- **Project README**: `README.md`
- **Deployment Guide**: `deployment/DEPLOYMENT-GUIDE.md`
- **Deployment Summary**: `deployment/DEPLOYMENT-SUMMARY-REPORT.md`
- **Gitignore Strategy**: `deployment/GITIGNORE-STRATEGY.md`

### Backend Documentation

- **Backend README**: `backend/README.md`
- **Phase 3 Report**: `backend/PHASE3-IMPLEMENTATION-REPORT.md`
- **Phase 3 Completion**: `backend/PHASE3-COMPLETION-REPORT.md`
- **Phase 4 Test Plan**: `backend/PHASE4-TEST-PLAN.md`
- **Phase 4 Testing**: `backend/PHASE4-TESTING-COMPLETE.md`
- **Phase 4 Completion**: `backend/PHASE4-COMPLETION-REPORT.md`
- **Phase 5 Plan**: `backend/PHASE5-PLAN.md`

### Frontend Documentation

- **Frontend README**: `frontend/README.md`
- **Package.json**: `frontend/package.json` (scripts and dependencies)

### Dated Documentation

Located in `docs/bydate/YYYY-MM-DD/`:

- **2025-10-26**: Authentication migration complete
- **2025-10-27**: Admin and data-rekam APIs complete
- **2025-10-04**: Phase 4 WebSocket completion
- **2025-11-09**: This frontend API analysis (current)

### Categorized Documentation

Located in `docs/`:

- **SILPANA-ARCHITECTURE-ANALYSIS.md** - SILPANA system architecture
- **SILPANA-INTEGRATION-SUMMARY.md** - SILPANA integration guide
- **DEBUG-RLS-POLICY-FAILURE.md** - RLS policy debugging
- **PHASE4-LAUNCH-SUMMARY.md** - Phase 4 summary
- **DOCUMENTATION-MIGRATION-COMPLETE.md** - Documentation migration

## Code References

### Frontend Structure

```text
frontend/src/
├── app/
│   ├── (protected)/              # Protected routes
│   │   ├── layout.tsx            # Auth check + context provider
│   │   ├── auth-context.tsx      # Context definitions
│   │   ├── dashboard/            # Dashboard pages
│   │   ├── profile/              # Profile management
│   │   ├── admin/                # Admin features
│   │   ├── data-rekam/           # Data rekam features
│   │   ├── monitoring/           # Monitoring dashboard
│   │   └── silpana-admin/        # SILPANA admin
│   ├── api/                      # Next.js API proxy routes
│   │   ├── admin/                # Admin endpoints
│   │   ├── data-rekam/           # Data rekam endpoints
│   │   ├── monitoring/           # Monitoring endpoints
│   │   └── logs/                 # Logging endpoints
│   ├── silpana/                  # Public SILPANA forms
│   └── login/                    # Login page
├── components/                   # React components
│   ├── dashboard/                # Dashboard components
│   ├── silpana/                  # SILPANA components
│   ├── profile/                  # Profile components
│   └── ui/                       # UI primitives
├── lib/
│   ├── api/
│   │   └── goAuth.ts            # GoAuthAPI client
│   ├── conn/
│   │   └── supabaseClient.ts    # Supabase client
│   └── config/
│       └── features.ts          # Feature flags
├── hooks/                        # Custom React hooks
└── types/                        # TypeScript types
```

### Backend Structure

```text
backend/
├── cmd/
│   └── server/
│       └── main.go              # Application entry point
├── internal/
│   ├── api/
│   │   ├── handlers/            # HTTP handlers
│   │   └── routes/              # Route definitions
│   │       └── routes.go        # All API routes
│   └── services/                # Business logic services
│       ├── auth/                # Authentication service
│       ├── admin/               # Admin service
│       ├── data_rekam/          # Data rekam service
│       ├── database/            # Database service
│       ├── cache/               # Cache service
│       ├── eventbus/            # Event bus service
│       ├── websocket/           # WebSocket service
│       ├── silpana/             # SILPANA service
│       ├── aktivitas_siak/      # Activity service
│       └── monitoring/          # Monitoring service
├── test/                        # Test files
├── scripts/                     # Utility scripts
├── migrations/                  # Database migrations
└── docs/                        # Backend documentation
```

## Key Source Files

### Authentication

| File | Purpose |
|------|---------|
| `frontend/src/lib/api/goAuth.ts` | GoAuthAPI client library |
| `frontend/src/app/(protected)/layout.tsx` | Protected route layout with auth check |
| `frontend/src/app/(protected)/auth-context.tsx` | Auth context provider |
| `backend/internal/services/auth/service.go` | Go backend auth service |
| `backend/internal/api/handlers/auth.go` | Auth HTTP handlers |

### API Proxy Routes

| File | Endpoint |
|------|----------|
| `frontend/src/app/api/data-rekam/dashboard-stats/route.ts` | `/api/data-rekam/dashboard-stats` |
| `frontend/src/app/api/admin/pending-users/route.ts` | `/api/admin/pending-users` |
| `frontend/src/app/api/admin/approve-user/route.ts` | `/api/admin/approve-user` |
| `frontend/src/app/api/data-rekam/adjudicate/route.ts` | `/api/data-rekam/adjudicate` |
| `frontend/src/app/api/data-rekam/duplicate-operator/route.ts` | `/api/data-rekam/duplicate-operator` |

### Protected Pages

| File | Route |
|------|-------|
| `frontend/src/app/(protected)/dashboard/page.tsx` | `/dashboard` |
| `frontend/src/app/(protected)/profile/page.tsx` | `/profile` |
| `frontend/src/app/(protected)/admin/page.tsx` | `/admin` |
| `frontend/src/app/(protected)/data-rekam/page.tsx` | `/data-rekam` |
| `frontend/src/app/(protected)/silpana-admin/tickets/page.tsx` | `/silpana-admin/tickets` |

### Public Pages

| File | Route |
|------|-------|
| `frontend/src/app/silpana/page.tsx` | `/silpana` (anonymous submissions) |
| `frontend/src/app/login/page.tsx` | `/login` |

## External Documentation

### Framework Documentation

- **Next.js 15**: <https://nextjs.org/docs>
  - App Router: <https://nextjs.org/docs/app>
  - API Routes: <https://nextjs.org/docs/app/building-your-application/routing/route-handlers>
  - Server Components: <https://nextjs.org/docs/app/building-your-application/rendering/server-components>

- **React 18**: <https://react.dev/>
  - Hooks: <https://react.dev/reference/react>
  - Context: <https://react.dev/reference/react/useContext>

- **TypeScript**: <https://www.typescriptlang.org/docs/>
  - Types: <https://www.typescriptlang.org/docs/handbook/2/everyday-types.html>

### Backend Documentation

- **Go 1.23**: <https://go.dev/doc/>
  - Gin Framework: <https://gin-gonic.com/docs/>
  - Context: <https://pkg.go.dev/context>

- **Supabase**: <https://supabase.com/docs>
  - RLS Policies: <https://supabase.com/docs/guides/auth/row-level-security>
  - Go Client: <https://supabase.com/docs/reference/go/introduction>

### UI Libraries

- **Tailwind CSS**: <https://tailwindcss.com/docs>
- **shadcn/ui**: <https://ui.shadcn.com/>
- **Lucide Icons**: <https://lucide.dev/>

## Related GitHub Repositories

### SELLICA

- **Main Repository**: `avvy-lavoienne/sellica-golang`
- **Branch**: `feat/admin-section` (current)

### Dependencies

- **Supabase Go Client**: <https://github.com/supabase-community/supabase-go>
- **Gin Web Framework**: <https://github.com/gin-gonic/gin>
- **Next.js**: <https://github.com/vercel/next.js>

## Environment Configuration

### Frontend Environment Variables

Located in `frontend/.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Go Backend Configuration
NEXT_PUBLIC_GO_BACKEND_URL=http://localhost:8080

# Feature Flags
NEXT_PUBLIC_USE_GO_AUTH=true
NEXT_PUBLIC_USE_GO_CHAT=true
NEXT_PUBLIC_ENABLE_AUTH_FALLBACK=true
```

### Backend Environment Variables

Located in `backend/.env`:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_JWT_SECRET=your-jwt-secret

# Redis Configuration (optional)
REDIS_URL=rediss://default:token@host:6379

# Server Configuration
PORT=8080
GIN_MODE=debug
LOG_LEVEL=info
```

## Development Tools

### VS Code Extensions

Listed in `.vscode/extensions.json`:

- `upstash.context7-mcp` - Context7 MCP integration
- `golang.go` - Go language support
- `dbaeumer.vscode-eslint` - ESLint integration
- `esbenp.prettier-vscode` - Prettier code formatter
- `bradlc.vscode-tailwindcss` - Tailwind CSS IntelliSense

### VS Code Tasks

Listed in `.vscode/tasks.json`:

- **Run Baseline Performance Benchmarks** - Automated Go benchmark testing

### Package Managers

- **Frontend**: pnpm 10.14.0 (MANDATORY)
- **Backend**: Go modules (go.mod)

## API Documentation

### Go Backend API

**Base URL**: `http://localhost:8080` (development)

**Authentication**: Bearer token in `Authorization` header

**Response Format**:
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

### Endpoints by Category

**Authentication** (`/auth/*`):
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `GET /auth/profile` - Get user profile
- `PUT /auth/profile` - Update user profile
- `POST /auth/refresh` - Refresh access token

**Admin** (`/admin/*`):
- `GET /admin/pending-users` - Get pending users
- `POST /admin/approve-user` - Approve user
- `POST /admin/reject-user` - Reject user

**Data Rekam** (`/data-rekam/*`):
- `GET /data-rekam/dashboard-stats` - Dashboard statistics
- `GET /data-rekam/adjudicate` - Adjudicate records
- `GET /data-rekam/duplicate-operator` - Duplicate operator records
- `GET /data-rekam/salah-rekam` - Salah rekam records
- `GET /data-rekam/pengajuan-bulanan` - Monthly submissions
- `GET /data-rekam/chart-aggregation` - Chart data

**Monitoring** (`/monitoring/*`):
- `GET /monitoring/dashboard` - Monitoring metrics
- `GET /health` - Health check
- `GET /metrics` - Prometheus metrics

## Performance Testing

### Load Testing Scripts

Located in `backend/scripts/load-testing/`:

- `benchmark_test.go` - Go benchmark tests
- `results/` - Test results directory

**Run tests**:
```powershell
cd backend
go test -bench=. -benchmem -count=3 ./scripts/load-testing/
```

### Frontend Performance Testing

Located in `frontend/scripts/`:

- `simple-performance-validation.ts` - Frontend performance validation

**Run tests**:
```powershell
cd frontend
pnpm test:performance
```

## Monitoring and Observability

### Prometheus

**URL**: `http://localhost:9090` (when running with Docker)

**Metrics**:
- `http_request_duration_seconds` - Request latency
- `http_requests_total` - Total requests
- `cache_hit_total` - Cache hits
- `cache_miss_total` - Cache misses

### Grafana

**URL**: `http://localhost:3001` (when running with Docker)

**Default Credentials**: admin/admin

**Dashboards**:
- API Performance
- Cache Performance
- Database Performance

### Health Check

**URL**: `http://localhost:8080/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-09T10:00:00Z",
  "services": {
    "database": "ok",
    "cache": "ok",
    "redis": "ok"
  }
}
```

## Troubleshooting Resources

### Common Issues

1. **"401 Unauthorized"**
   - Check token validity: `GoAuthAPI.isAuthenticated()`
   - Verify token in localStorage
   - Try logout/login to refresh token

2. **"CORS error"**
   - Check `NEXT_PUBLIC_GO_BACKEND_URL` environment variable
   - Verify Go backend CORS configuration
   - Use Next.js API proxy instead of direct calls

3. **"Random logout bug"**
   - Fixed in October 26, 2025 update
   - Ensure using latest `layout.tsx` and `auth-context.tsx`
   - Check hook calls are outside async functions

### Debug Mode

Enable debug logging:

```typescript
// frontend/src/lib/config/features.ts
export const FeatureFlags = {
  ENABLE_DEBUG_LOGGING: true, // Set to true for debug mode
  // ...
};
```

```go
// backend/.env
LOG_LEVEL=debug
GIN_MODE=debug
```

## Community and Support

### Internal Resources

- **Slack Channel**: #sellica-dev (internal team)
- **Issue Tracker**: GitHub Issues
- **Code Reviews**: GitHub Pull Requests

### Getting Help

1. Check this documentation first
2. Search existing GitHub issues
3. Ask in #sellica-dev Slack channel
4. Create new GitHub issue if needed

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-11-09 | Initial comprehensive analysis |

## Contributing

When contributing to frontend API integration:

1. Read [09-BEST-PRACTICES.md](./09-BEST-PRACTICES.md)
2. Follow [03-COMMUNICATION-PATTERNS.md](./03-COMMUNICATION-PATTERNS.md) for pattern selection
3. Update this documentation if adding new patterns
4. Add tests for new features
5. Update migration status in [08-MIGRATION-STATUS.md](./08-MIGRATION-STATUS.md)

## License

Internal project documentation - Not for public distribution

---

**Last Updated**: 2025-11-09
**Maintained By**: Technical Team
**Review Frequency**: Monthly or after major changes
