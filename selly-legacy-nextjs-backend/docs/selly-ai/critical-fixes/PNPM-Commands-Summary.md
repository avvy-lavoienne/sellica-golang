# PNPM Commands Summary - RLS Policy Fixes

**Updated for PNPM Package Manager**  
**Date**: 2025-01-28  
**Priority**: 🔴 **CRITICAL**

---

## 🚀 **Quick Start Commands**

### **Apply All Fixes (Recommended)**
```bash
# Complete fix and validation in one command
pnpm run fix:critical-stability
```

### **Step-by-Step Commands**
```bash
# 1. Apply RLS policy fixes
pnpm run apply:rls-fixes

# 2. Test and validate fixes
pnpm run test:rls-policies

# 3. Run comprehensive validation (optional)
pnpm exec tsx scripts/validate-rls-fixes.ts
```

---

## 📋 **Available PNPM Scripts**

| Command | Description | Usage |
|---------|-------------|-------|
| `pnpm run apply:rls-fixes` | Apply RLS policy migration | Primary fix command |
| `pnpm run test:rls-policies` | Test RLS policies | Validation command |
| `pnpm run fix:critical-stability` | Complete fix + validation | One-command solution |

---

## 🔧 **Manual Commands (If Needed)**

### **Direct Script Execution**
```bash
# Run migration script directly
pnpm exec tsx scripts/apply-rls-fixes.ts

# Run test script directly  
pnpm exec tsx scripts/test-rls-policies.ts

# Run validation script directly
pnpm exec tsx scripts/validate-rls-fixes.ts
```

### **Development Dependencies**
```bash
# Install tsx if not available
pnpm add -D tsx

# Install dotenv if not available
pnpm add -D dotenv
```

---

## ✅ **Execution Order**

### **For First-Time Setup**
1. `pnpm run fix:critical-stability` ← **Start here**
2. Test chat functionality in browser
3. Check application logs for errors
4. Proceed to Phase 2 if all tests pass

### **For Troubleshooting**
1. `pnpm run apply:rls-fixes` ← Apply fixes
2. `pnpm run test:rls-policies` ← Validate fixes
3. `pnpm exec tsx scripts/validate-rls-fixes.ts` ← Deep validation
4. Manual SQL execution if automated fails

---

## 🎯 **Success Indicators**

### **Command Output Should Show**
```
✅ CRITICAL RLS POLICY FIXES COMPLETED SUCCESSFULLY
✅ Service role authentication: FIXED
✅ Guest session handling: ENHANCED  
✅ Database persistence: RESTORED
✅ Ready for Phase 2: Connection Pool Optimization
```

### **Test Results Should Show**
```
📊 RLS POLICY TEST RESULTS - PHASE 1 CRITICAL FIXES
📈 SUMMARY:
  Total Tests: X
  Passed: X ✅
  Failed: 0 ✅
  Success Rate: 100.0%
🚀 Ready for Phase 2: Connection Pool Optimization
```

---

## 🚨 **If Commands Fail**

### **Common Issues**
1. **"tsx not found"** → Run: `pnpm add -D tsx`
2. **"Permission denied"** → Check Supabase service role key
3. **"Module not found"** → Run: `pnpm install`
4. **"Database connection failed"** → Check `.env.local` file

### **Fallback Option**
If all automated commands fail:
1. Open Supabase Dashboard → SQL Editor
2. Copy/paste: `src/database/migrations/003_manual_rls_fixes.sql`
3. Click "Run"
4. Test chat functionality manually

---

## 📞 **Next Steps After Success**

1. **Verify chat works** in the application
2. **Check browser console** for any remaining errors
3. **Test both guest and authenticated users**
4. **Proceed to Phase 2**: Connection Pool Optimization

---

**🎉 Ready to execute: `pnpm run fix:critical-stability`**
