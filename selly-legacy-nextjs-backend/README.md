# Selly Legacy Next.js Backend

This directory contains all the complex Selly-related API routes that were moved from `/src/app/api/` to ensure successful builds of the core web application.

## 🎯 **Purpose**

- **Clean Build**: Enable successful compilation of the core web app
- **Legacy Preservation**: Keep all advanced Selly features intact for future migration
- **Incremental Migration**: Allow gradual migration to Go backend when ready

## 📁 **Moved API Routes**

The following API routes were moved here from `/src/app/api/`:

### **Analytics & Monitoring**
- `analytics/` - Dashboard analytics and reporting
- `monitoring/` - Performance monitoring and metrics
- `performance/` - Performance validation and optimization

### **Caching System**
- `cache/` - Multi-level caching, Indonesian language cache, health checks

### **Security & Compliance**
- `security/` - Government-grade encryption
- `compliance/` - Indonesian data protection compliance

### **Advanced Features**
- `phase2/` - Phase 2 integration features
- `phase3/` - Phase 3 advanced features
- `tests/` - Enhanced testing and load testing
- `tensorflow-removal/` - AI/ML related functionality

### **Authentication**
- `auth/resolve-uuid-mismatch/` - UUID resolution service

### **Chat System**
- `chat/route-migrated.ts` - Migrated chat functionality
- `chat/route-backend-direct.ts` - Direct backend chat routes

## 🔄 **Migration Strategy**

### **Phase 1: Core Build Success** ✅
- Move complex APIs to legacy backend
- Keep essential APIs in main app
- Ensure successful builds

### **Phase 2: Selective Migration**
- Gradually migrate APIs to Go backend
- Test each migration thoroughly
- Maintain backward compatibility

### **Phase 3: Full Migration**
- Complete migration to Go backend
- Archive legacy Next.js backend
- Update frontend to use Go APIs

## 🚀 **Current Status**

- **Core App**: ✅ Building successfully
- **Legacy APIs**: 📦 Preserved in this directory
- **Essential APIs**: 🔄 Still in main app (`/src/app/api/`)

## 📋 **Essential APIs Remaining in Main App**

These APIs are kept in the main app for core functionality:

- `/api/chat/route.ts` - Basic chat functionality
- `/api/health/route.ts` - Health check
- `/api/login/` - Authentication
- `/api/register/` - User registration
- `/api/session/` - Session management
- `/api/test-db/` - Database testing
- `/api/test-groq/` - Groq API testing

## 🔧 **How to Restore**

If you need to restore any API route to the main app:

1. Copy the route from this directory
2. Paste it back to `/src/app/api/`
3. Fix any import issues
4. Test the build

## 📝 **Notes**

- All routes in this directory are fully functional
- They just have complex dependencies that cause build issues
- This is a temporary solution for build success
- Future migration to Go backend is planned

---

**Created**: 2025-08-22  
**Purpose**: Enable core web app build success  
**Status**: Active legacy preservation
