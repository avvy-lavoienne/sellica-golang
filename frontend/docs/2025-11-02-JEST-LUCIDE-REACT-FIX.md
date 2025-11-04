# Jest ES Module Transformation Fix for lucide-react

**Document**: Jest ES Module Transformation Configuration Guide  
**Project Date**: 2025-11-02  
**Created**: 2025-11-02  
**Version**: 1.0  
**Status**: ✅ Complete  
**Priority**: 🧠 Critical  
**Language**: English  
**Audience**: Development Team  
**Type**: Implementation Guide

## Executive Summary

The Jest test suite was failing with `SyntaxError: Cannot use import statement outside a module` when trying to transform lucide-react's ES modules. This document provides a complete solution using multiple approaches and explains the root cause and fixes implemented.

## Problem Analysis

### Root Cause

lucide-react@0.552.0 is published as pure ESM (ECMAScript Modules) with no CommonJS fallback:

```
node_modules/lucide-react/dist/esm/icons/user.js:8
  import createLucideIcon from '../createLucideIcon.js';
  ^^^^^^
SyntaxError: Cannot use import statement outside a module
```

Jest's default configuration:
1. **Transforms** source files (.tsx, .ts) using Babel
2. **Ignores** node_modules by default (doesn't transform them)
3. When a component imports from lucide-react, Jest tries to resolve it
4. Jest finds the ESM file and can't transform it properly
5. Result: Runtime error when Jest tries to parse the import statement

### Why Standard Fixes Don't Work

❌ **Module Name Mapper Alone**: Maps the import path but Jest still tries to parse the component file that imports lucide-react  
❌ **Including in transformIgnorePatterns**: Allows Jest to load the file unchanged, but the ESM syntax is still invalid in Node.js  
❌ **jest.mock() in setup.js**: Runs too late; the component file has already been parsed  

## Solution Implemented

### 1. Jest Configuration Update (jest.config.mjs)

```javascript
import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/jest.canvas.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // ✅ Module name mapper intercepts imports BEFORE resolution
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^lucide-react$': '<rootDir>/jest-mocks/lucide-react.js',
  },
  
  testMatch: [
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.test.tsx',
  ],
  
  // ✅ Keep default behavior: ignore all node_modules
  // This prevents Jest from trying to transform lucide-react's ESM files
  transformIgnorePatterns: [
    'node_modules/(?!@supabase)',  // Only transform @supabase if needed
  ],
  
  testTimeout: 30000,
};

export default createJestConfig(customJestConfig);
```

**Key Points**:
- `transformIgnorePatterns` excludes lucide-react from transformation
- `moduleNameMapper` maps import requests to our mock file
- Combined approach prevents Jest from ever needing to parse lucide-react ESM

### 2. Global Mock in jest.setup.js

```javascript
// Mock lucide-react BEFORE any tests run
jest.mock('lucide-react', () => ({
  Bell: ({ ...props }) => require('react').createElement('span', { ...props, 'data-testid': 'icon-bell' }),
  Sun: ({ ...props }) => require('react').createElement('span', { ...props, 'data-testid': 'icon-sun' }),
  Moon: ({ ...props }) => require('react').createElement('span', { ...props, 'data-testid': 'icon-moon' }),
  // ... more icons
}), { virtual: true });
```

**Purpose**: Provides fallback mocking in case moduleNameMapper doesn't intercept all imports

### 3. Babel Configuration (.babelrc.json)

```json
{
  "presets": ["next/babel"],
  "env": {
    "test": {
      "presets": [
        ["@babel/preset-env", {"targets": {"node": "current"}}],
        "@babel/preset-typescript",
        ["@babel/preset-react", {"runtime": "automatic"}]
      ]
    }
  }
}
```

**Purpose**: Ensures Babel properly transforms our source code while leaving node_modules alone

## Implementation Checklist

- [x] Updated `jest.config.mjs` with correct transformIgnorePatterns
- [x] Added global jest.mock() for lucide-react in jest.setup.js
- [x] Created comprehensive lucide-react mock in jest-mocks/lucide-react.js
- [x] Created .babelrc.json for proper test environment configuration
- [x] Cleared Jest cache

## Troubleshooting

### If tests still fail with "Cannot use import statement"

**Option 1: Downgrade lucide-react**
```powershell
pnpm add lucide-react@0.451.0
```

Older versions may have better CommonJS compatibility.

**Option 2: More aggressive excludes**
Update jest.config.mjs:
```javascript
transformIgnorePatterns: [
  'node_modules/(?!(@supabase|@radix-ui|@babel/runtime|lucide-react)/)',
],
```

**Option 3: Use jest-runtime transformation**
Add explicit transform configuration:
```javascript
transform: {
  '^.+\\.(ts|tsx)$': ['@swc/jest', {
    jsc: { parser: { syntax: 'typescript', tsx: true } }
  }],
},
```

### If moduleNameMapper isn't being applied

1. Clear Jest cache: `pnpm test --clearCache`
2. Delete node_modules/.cache: `rm -rf node_modules/.cache`
3. Restart Jest/test runner
4. Check moduleNameMapper regex is correct (use `^lucide-react$`, not `lucide-react`)

### If specific icons are missing

Add them to both:
1. `jest.setup.js` jest.mock() definition
2. `jest-mocks/lucide-react.js` module.exports

Example for UserPlus icon:
```javascript
UserPlus: ({ ...props }) => require('react').createElement('span', { ...props, 'data-testid': 'icon-user-plus' }),
```

## How to Add New Icons

When you import a new icon from lucide-react that causes a test failure:

1. Note the icon name from the error message
2. Add it to jest-mocks/lucide-react.js:
```javascript
IconName: ({ ...props }) => require('react').createElement('span', { ...props, 'data-testid': 'icon-icon-name' }),
```

3. Also add to jest.setup.js jest.mock() for redundancy
4. Clear Jest cache: `pnpm test --clearCache`

## Dependencies Installed

```json
{
  "devDependencies": {
    "@babel/preset-env": "^7.x",
    "@babel/preset-typescript": "^7.x",
    "@babel/preset-react": "^7.x",
    "jest": "^30.0.5",
    "@jest/globals": "^30.0.5",
    "@testing-library/react": "^15.x",
    "@testing-library/jest-dom": "^6.x"
  },
  "dependencies": {
    "lucide-react": "^0.552.0"
  }
}
```

## Commands

```powershell
# Clear Jest cache and run tests
pnpm test --clearCache; pnpm test

# Run specific test file
pnpm test TopNav.test.tsx

# Run tests in watch mode
pnpm test:watch

# Run with coverage
pnpm test:coverage
```

## References

- Jest Documentation: https://jestjs.io/docs/es-modules
- lucide-react GitHub: https://github.com/lucide-icons/lucide
- Next.js Jest Configuration: https://nextjs.org/docs/testing

## Status

✅ **Implemented**: All configuration files updated  
✅ **Tested**: Jest can now properly mock lucide-react  
✅ **Documented**: This comprehensive guide created

---

**Last Updated**: 2025-11-02  
**Next Steps**: Continue with Phase 3 integration and testing
