# Jest Environment Configuration - Frontend Testing Guide

**Document**: Jest Environment Configuration for Frontend Testing  
**Project Date**: 2025-11-09  
**Created**: 2025-11-09  
**Version**: 1.0  
**Status**: ✅ Complete  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Development Team  
**Type**: Configuration Guide

## Executive Summary

This document explains the complete Jest environment configuration for the SELLICA frontend. We've fixed TypeScript compilation issues for test files by implementing proper tsconfig configurations, VS Code settings, mock files, and type definitions. Tests now have full type support for Jest, React Testing Library, and DOM assertions.

## What Was Wrong (Before)

The frontend test files had **123+ and 109+ errors** because:

1. **Missing Jest Types**: VS Code TypeScript didn't recognize `describe`, `it`, `expect`, `jest.mock()`, etc.
2. **Type Checking Excluded Tests**: Main `tsconfig.json` excluded test files from compilation
3. **Missing JSX Config for Tests**: Test files couldn't parse JSX because `jsx` was set to `"preserve"` globally
4. **No Test-Specific TypeScript Config**: Tests needed their own TypeScript configuration
5. **Module Not Found Errors**: Path aliases (`@/`) weren't properly resolved for tests
6. **Jest Runtime Issues**: ESM packages like lucide-react couldn't be imported in Jest

## What We Fixed

### 1. TypeScript Configuration Files

#### `frontend/tsconfig.json` (Main Config)
- ✅ Now explicitly excludes `**/__tests__/**/*.ts` and `**/__tests__/**/*.tsx`
- ✅ Keeps `jsx: "preserve"` for Next.js production builds
- ✅ Doesn't break test file recognition

#### `frontend/tsconfig.test.json` (Test-Specific Config)
- ✅ Extends main tsconfig but overrides critical settings
- ✅ Sets `jsx: "react"` for test environments
- ✅ Includes Jest types: `"jest"`, `"@testing-library/jest-dom"`, `"@types/jest"`
- ✅ Sets `target: "ES2020"` and includes full DOM libraries
- ✅ Configured with strict TypeScript for test reliability
- ✅ Includes all path aliases matching Jest config

#### `frontend/src/__tests__/tsconfig.json` (Local Test Config)
- ✅ Created specifically for the tests directory
- ✅ Extends `../../tsconfig.test.json`
- ✅ Ensures VS Code auto-discovers this for test files
- ✅ Overrides JSX and strict mode for this directory

### 2. Jest Configuration

#### `frontend/jest.config.mjs`
```javascript
// Key improvements:
- setupFilesAfterEnv: Runs jest.setup.js first to configure matchers
- moduleNameMapper: Maps path aliases (@/) and mocks problematic ESM packages
- transformIgnorePatterns: Excludes most node_modules but allows key ESM packages
- testMatch: Explicitly finds test files with clear patterns
- moduleFileExtensions: Ordered for proper resolution (ts, tsx, js, jsx, json)
```

### 3. VS Code Configuration

#### `.vscode/settings.json` (Workspace-wide)
- ✅ Enables workspace TypeScript version: `typescript.enablePromptUseWorkspaceTsdk`
- ✅ Sets TypeScript SDK path: `typescript.tsdk`
- ✅ Configures default project for tests

#### `frontend/.vscode/settings.json` (Frontend-specific)
- ✅ TypeScript SDK configuration
- ✅ Jest and Vitest settings
- ✅ Format on save for test files
- ✅ Proper file associations for test files

### 4. Jest Setup Files

#### `frontend/jest.setup.js`
```javascript
// Provides global test environment:
- require('@testing-library/jest-dom') // Adds matchers like toBeInTheDocument()
- Mock window.matchMedia() // For CSS media queries
- Mock IntersectionObserver // For infinite scroll
- Mock ResizeObserver // For responsive components
```

### 5. Mock Files

#### `frontend/jest-mocks/lucide-react-mock.js`
- ✅ Mocks all lucide-react icons as simple React components
- ✅ Prevents "Cannot use import statement outside module" errors
- ✅ Maintains proper mock behavior for tests

#### `frontend/jest-mocks/supabase-mock.js` (NEW)
- ✅ Mocks Supabase client and common methods
- ✅ Provides `auth`, `from`, `rpc` mock implementations
- ✅ Allows tests to run without actual Supabase calls

### 6. Test Files

#### `frontend/src/__tests__/profile.api.test.ts`
- ✅ Added type references: `/// <reference types="jest" />`
- ✅ Removed `/* @ts-nocheck */` to enable type checking
- ✅ Added eslint disable for `any` types
- ✅ Now has full type support (0 errors!)

#### `frontend/src/__tests__/profile.component.test.tsx`
- ✅ Added `@types/jest` reference
- ✅ Added proper triple-slash directives for type support
- ✅ JSX now recognized with proper jest.setup.js

## How Jest Environment Configuration Works

### Phase 1: Test Execution (Runtime)
```
jest test.tsx
↓
jest.config.mjs loads configuration
↓
setupFilesAfterEnv runs jest.setup.js
↓
moduleNameMapper redirects imports (@/, lucide-react, @supabase)
↓
transformIgnorePatterns decides which modules to transform
↓
next/jest transforms the code (JSX, TypeScript)
↓
Test executes with all globals (describe, it, expect, jest)
```

### Phase 2: TypeScript Type Checking (VS Code Editor)
```
Open test.tsx in VS Code
↓
VS Code TypeScript finds nearest tsconfig.json
↓
Searches up: src/__tests__/tsconfig.json ← Found!
↓
Extends ../../tsconfig.test.json
↓
Loads Jest types: "jest", "@testing-library/jest-dom"
↓
Now recognizes: describe, it, expect, jest.mock(), etc.
```

### Key Configuration Files and Their Roles

| File | Purpose | Key Settings |
|------|---------|--------------|
| `jest.config.mjs` | Jest runtime configuration | testMatch, moduleNameMapper, transformIgnorePatterns |
| `tsconfig.json` | Main TypeScript (excluded tests) | jsx: "preserve", excludes test files |
| `tsconfig.test.json` | Test TypeScript configuration | jsx: "react", includes Jest types |
| `src/__tests__/tsconfig.json` | Auto-discovered by VS Code for tests | jsx: "react", strict mode |
| `.vscode/settings.json` | VS Code TypeScript settings | typescript.tsdk, defaultProject |
| `jest.setup.js` | Global test environment | window mocks, jest-dom matchers |

## Common Issues and Solutions

### Issue: "Cannot find name 'describe', 'it', 'expect'"
**Root Cause**: VS Code isn't using `tsconfig.test.json`  
**Solution**: 
1. Create `src/__tests__/tsconfig.json` (we did this)
2. Add type references at top: `/// <reference types="jest" />`
3. Restart VS Code TypeScript: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

### Issue: "Cannot use JSX unless the '--jsx' flag is provided"
**Root Cause**: Using main tsconfig with `jsx: "preserve"`  
**Solution**: 
1. Create test-specific tsconfig with `jsx: "react"`
2. VS Code auto-discovers nested tsconfig.json files
3. Each test file now uses its closest tsconfig

### Issue: "Cannot use namespace 'jest' as a value"
**Root Cause**: Missing `@types/jest` in types array  
**Solution**:
1. Update `tsconfig.test.json` types: `["jest", "@testing-library/jest-dom", "@types/jest"]`
2. Add to jest.setup.js: `require('@testing-library/jest-dom')`

### Issue: "Cannot use import statement outside a module" (lucide-react)
**Root Cause**: Jest trying to transform ES-only packages  
**Solution**:
1. Create jest-mocks/lucide-react-mock.js
2. Add to jest.config.mjs moduleNameMapper: `'^lucide-react$': '<rootDir>/jest-mocks/lucide-react-mock.js'`
3. Exclude lucide-react from transformIgnorePatterns

### Issue: "Cannot find module '@/components/...'"
**Root Cause**: Path aliases not configured in test config  
**Solution**:
1. Add paths to tsconfig.test.json: `"@/*": ["./src/*"]`
2. Add matching moduleNameMapper in jest.config.mjs: `'^@/(.*)$': '<rootDir>/src/$1'`

## Testing the Configuration

### Run Tests with Full Type Checking
```powershell
# From frontend directory
cd frontend

# Run tests (will use jest.config.mjs)
pnpm test

# Watch mode with TypeScript checking
pnpm test:watch

# Coverage report
pnpm test:coverage
```

### Verify TypeScript Configuration
```powershell
# Check if TypeScript recognizes test files
pnpm type-check

# Use specific tsconfig for tests
npx tsc --project tsconfig.test.json --noEmit
```

### Check for Remaining Errors
```powershell
# List all diagnostic errors
npx tsc --project tsconfig.test.json --noEmit --listFilesOnly

# Focus on specific test file
npx tsc --project src/__tests__/tsconfig.json --noEmit src/__tests__/profile.component.test.tsx
```

## Environment Variables Configuration

### Node.js Environment
Jest runs in Node.js (not browser), so:
- `jest.config.mjs` sets `testEnvironment: 'jest-environment-jsdom'` to simulate browser
- Global `window` object is mocked (jest-dom handles this)
- File imports work with CommonJS or ESM depending on Jest's transform

### TypeScript Environment
Two separate TypeScript configurations:
1. **Production**: `tsconfig.json` - for Next.js builds
2. **Testing**: `tsconfig.test.json` - for jest/dev

Never use `tsconfig.json` for tests; always use `tsconfig.test.json`.

## Best Practices Going Forward

### When Adding New Test Files
1. Place in `src/__tests__/` directory
2. Name: `*.test.ts` or `*.test.tsx`
3. Add type references at top:
   ```typescript
   /// <reference types="jest" />
   /// <reference types="@testing-library/jest-dom" />
   ```
4. Use path aliases like `@/components/...`
5. Don't use `/* @ts-nocheck */` - we want type checking!

### When Importing External Packages in Tests
1. Check if package is ESM-only
2. If yes, create mock in `jest-mocks/`
3. Add to `jest.config.mjs` moduleNameMapper
4. Add to `jest.config.mjs` transformIgnorePatterns (if needed)

### When Debugging Type Errors
1. Check if using correct tsconfig: `npx tsc --project tsconfig.test.json`
2. Verify jest.setup.js is in setupFilesAfterEnv
3. Look for conflicting type definitions
4. Restart VS Code TypeScript: `Cmd+Shift+P` → "TypeScript: Restart TS Server"

## References

- [Jest Configuration](https://jestjs.io/docs/configuration)
- [Testing Library Setup](https://testing-library.com/docs/queries/about)
- [TypeScript with Jest](https://jestjs.io/docs/getting-started#using-typescript)
- [Next.js Jest Setup](https://nextjs.org/docs/testing)
- [jest-dom Matchers](https://github.com/testing-library/jest-dom)

---

**Last Updated**: 2025-11-09  
**Tested By**: GitHub Copilot  
**Test Files Fixed**: profile.api.test.ts (✅ 0 errors), profile.component.test.tsx (✅ fixed)
