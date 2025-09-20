# SELLY Legacy Next.js Backend Components

**Purpose**: Temporary staging area for legacy Next.js backend components during migration to Go backend.

## Directory Structure

```
selly-legacy-nextjs-backend/
├── api-routes/                 # All Next.js API routes
│   ├── core/                   # Core business logic routes (chat, training-data)
│   ├── auth/                   # Authentication routes
│   ├── monitoring/             # Monitoring and metrics routes
│   ├── admin/                  # Administrative routes
│   ├── cache/                  # Cache management routes
│   ├── compliance/             # Government compliance routes
│   ├── performance/            # Performance testing routes
│   ├── security/               # Security-related routes
│   ├── session/                # Session management routes
│   └── testing/                # Testing and validation routes
├── business-logic/             # Core business logic services
│   ├── ai/                     # AI and ML services
│   ├── training/               # Training data services
│   ├── analytics/              # Analytics services
│   ├── session/                # Session management
│   └── workflow/               # Business workflow services
├── backend-utilities/          # Server-side utilities
│   ├── database/               # Database connections and utilities
│   ├── cache/                  # Caching services
│   ├── monitoring/             # Monitoring utilities
│   ├── security/               # Security utilities
│   └── integration/            # Integration utilities
├── middleware/                 # Server-side middleware
│   ├── auth/                   # Authentication middleware
│   ├── security/               # Security middleware
│   └── monitoring/             # Monitoring middleware
├── data-processing/            # Data processing and migration
│   ├── training-data/          # Training data processors
│   ├── analytics/              # Analytics processors
│   ├── compliance/             # Compliance data processors
│   └── migration/              # Data migration utilities
└── documentation/              # Migration documentation
    ├── api-mapping.md          # API route mapping to Go backend
    ├── service-mapping.md      # Service mapping documentation
    └── migration-log.md        # Migration progress log
```

## Migration Categories

### 🔴 **Critical Priority**
- Core chat API routes and services
- Training data collection and processing
- Authentication and session management
- Database connection services

### 🟡 **High Priority**
- Monitoring and metrics services
- Cache management services
- Security and compliance services
- Performance optimization services

### 🟢 **Medium Priority**
- Administrative interfaces
- Testing and validation utilities
- Analytics and reporting services
- Documentation and migration utilities

## Migration Process

1. **Identify**: Scan and categorize all legacy components
2. **Relocate**: Move components to appropriate staging directories
3. **Document**: Create mapping documentation for each component
4. **Validate**: Ensure no critical dependencies are broken
5. **Archive**: Move to final backend archive location

## Status Tracking

- [ ] API Routes Migration (0/47+ routes)
- [ ] Business Logic Services (0/200+ files)
- [ ] Backend Utilities (0/50+ files)
- [ ] Middleware Components (0/15+ files)
- [ ] Data Processing (0/30+ files)

## Next Steps

After staging completion, components will be migrated to:
`/backend/data-init/selly-legacy-nextjs-backend/`

This serves as the permanent archive and reference for the legacy Next.js backend implementation.
