# Jest Environment Configuration - Quick Reference

## TL;DR

Your Jest environment is now fully configured. The **123+ errors in profile.api.test.ts** and **109+ errors in profile.component.test.tsx** are fixed. Tests now run successfully with full TypeScript support.

## What Changed

| Component | Change | Status |
|-----------|--------|--------|
| `tsconfig.json` | Explicitly excludes test directories | ✅ |
| `tsconfig.test.json` | **Enhanced** with Jest types, React JSX, paths | ✅ |
| `src/__tests__/tsconfig.json` | **NEW** - auto-discovered by VS Code | ✅ |
| `jest.config.mjs` | Added Supabase mock, improved patterns | ✅ |
| `jest.setup.js` | Enhanced documentation | ✅ |
| `jest-mocks/supabase-mock.js` | **NEW** - mocks Supabase client | ✅ |
| `.vscode/settings.json` | Added TypeScript and Jest settings | ✅ |
| `frontend/.vscode/settings.json` | **NEW** - frontend-specific settings | ✅ |

## Configuration File Hierarchy

```
┌─ Main tsconfig.json (jsx: "preserve" - production)
│
├─ tsconfig.test.json (jsx: "react" - testing)
│  └─ extends tsconfig.json
│
└─ src/__tests__/tsconfig.json (jsx: "react" - test directory)
   └─ extends ../../tsconfig.test.json
      └─ AUTO-DISCOVERED BY VS CODE ✅
```

## Key Settings Explained

### jest.config.mjs
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',              // Path aliases
  '^lucide-react$': '<rootDir>/jest-mocks/lucide-react-mock.js',
  '^@supabase/(.*)$': '<rootDir>/jest-mocks/supabase-mock.js',
}

transformIgnorePatterns: [
  '/node_modules/(?!(@supabase|@tanstack|@testing-library|@radix-ui)/)',
  // Transform ESM packages from specific orgs, ignore others
]

setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
// Runs jest.setup.js FIRST to set up matchers and mocks
```

### tsconfig.test.json
```json
{
  "compilerOptions": {
    "types": ["jest", "@testing-library/jest-dom", "@types/jest", "node"],
    // ↑ Tells TypeScript about jest globals and testing library matchers
    
    "jsx": "react",
    // ↑ Transforms JSX for Jest (not "preserve" like production)
    
    "lib": ["ES2015", "ES2017", "DOM", "DOM.Iterable", "ESNext"],
    // ↑ Full DOM support for testing
  }
}
```

### jest.setup.js
```javascript
require('@testing-library/jest-dom');
// ↑ Adds toBeInTheDocument(), toHaveClass(), etc.

Object.defineProperty(window, 'matchMedia', { ... });
// ↑ Mocks CSS media queries (window.matchMedia)

global.IntersectionObserver = class { ... };
// ↑ Mocks Intersection Observer for infinite scroll
```

## Running Tests

```powershell
# Run all tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Run specific test
pnpm test profile.api

# Run tests in specific directory
pnpm test __tests__/profile
```

## VS Code Setup

### Auto-discovered Configuration
- When you open a test file in VS Code, it automatically finds the closest `tsconfig.json`
- For test files: `src/__tests__/tsconfig.json` is found and used ✅
- This file extends `tsconfig.test.json` which has all Jest types

### Manual Reset (if needed)
```
Cmd+Shift+P (or Ctrl+Shift+P on Windows/Linux)
→ "TypeScript: Restart TS Server"
```

## Error Messages Explained

### ❌ Before (Broken)
```
Cannot find name 'describe'
Cannot find name 'it'  
Cannot find name 'expect'
Cannot use namespace 'jest' as a value
Cannot use JSX unless '--jsx' flag is provided
Namespace 'global.jest' has no exported member 'Mock'
```

### ✅ After (Fixed)
All the above errors are resolved through proper TypeScript configuration.

## Creating New Test Files

1. **Location**: `src/__tests__/your-component.test.tsx`
2. **Type references** (optional but recommended):
   ```typescript
   /// <reference types="jest" />
   /// <reference types="@testing-library/jest-dom" />
   ```
3. **Write tests normally**:
   ```typescript
   describe('Component', () => {
     it('renders', () => {
       render(<YourComponent />)
       expect(screen.getByText(/text/i)).toBeInTheDocument()
     })
   })
   ```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot find name 'describe'" | Restart TS Server: Cmd+Shift+P → TypeScript: Restart |
| "Cannot use import outside module" | Check jest-mocks for that package, add to moduleNameMapper |
| "Cannot find module '@/...'" | Verify path aliases in jest.config.mjs match tsconfig.test.json |
| Tests don't run | Run `pnpm test` - most errors are caught at lint time |
| Red squiggles in VS Code | Ensure `src/__tests__/tsconfig.json` exists in repo |

## Files to Know About

```
frontend/
├── jest.config.mjs              ← Jest runtime config
├── jest.setup.js                ← Global test setup (matchers, mocks)
├── tsconfig.json                ← Production TypeScript
├── tsconfig.test.json           ← Test TypeScript (jest types, jsx: react)
├── .vscode/
│   └── settings.json            ← Workspace settings
├── jest-mocks/
│   ├── lucide-react-mock.js     ← Icon mocks
│   └── supabase-mock.js         ← Supabase client mocks
└── src/
    └── __tests__/
        ├── tsconfig.json        ← Test directory config (auto-discovered)
        ├── profile.api.test.ts  ← ✅ 0 errors
        └── profile.component.test.tsx  ← ✅ Full support
```

## Testing the Configuration

```powershell
# Verify TypeScript recognizes test config
npx tsc --project tsconfig.test.json --noEmit

# Run tests with full output
pnpm test -- --verbose

# Check which files match testMatch pattern
pnpm test -- --listTests
```

## Summary

- ✅ Jest environment is **fully configured**
- ✅ TypeScript types for Jest are **properly set up**
- ✅ Path aliases work in tests
- ✅ Mocks are in place for problematic packages
- ✅ VSCode auto-discovers test configuration
- ✅ Tests execute successfully
- ✅ Full IntelliSense support in test files

---

For detailed configuration explanation, see: `docs/JEST-ENVIRONMENT-CONFIGURATION.md`
