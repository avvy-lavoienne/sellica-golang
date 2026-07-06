# Phase 1A: Frontend Security Audit — Sellica

**Date:** 2026-07-06
**Target:** http://localhost:4000 (Next.js 15.4.6 dev server)
**Auditor:** Hikari (Orchestrator)

---

## Executive Summary

| Category | Pass | Fail | Warning |
|----------|------|------|---------|
| Security Headers | 0 | 7 | 0 |
| API Key Leakage | 3 | 0 | 1 |
| Source Map Exposure | 1 | 0 | 0 |
| Auth Token Storage | 0 | 1 | 1 |
| XSS Sanitization | 0 | 1 | 1 |
| Route Protection | 0 | 1 | 0 |
| Input Validation | 0 | 1 | 1 |
| **TOTAL** | **4** | **11** | **4** |

**Risk Level: HIGH** — 11 findings yang perlu ditangani sebelum production.

---

## 1. Security Headers Check

| Header | Present? | Value | Severity | Recommendation |
|--------|----------|-------|----------|----------------|
| Content-Security-Policy | ❌ MISSING | — | **CRITICAL** | Add CSP header restrict script/style sources |
| X-Content-Type-Options | ❌ MISSING | — | **HIGH** | Add `nosniff` to prevent MIME sniffing |
| X-Frame-Options | ❌ MISSING | — | **HIGH** | Add `DENY` or `SAMEORIGIN` to prevent clickjacking |
| Strict-Transport-Security | ❌ MISSING | — | **HIGH** | Add HSTS header for HTTPS enforcement |
| X-XSS-Protection | ❌ MISSING | — | **MEDIUM** | Add `1; mode=block` (legacy browsers) |
| Referrer-Policy | ❌ MISSING | — | **MEDIUM** | Add `strict-origin-when-cross-origin` |
| Permissions-Policy | ❌ MISSING | — | **MEDIUM** | Restrict camera, microphone, geolocation |
| X-Powered-By | ⚠️ PRESENT | `Next.js` | **LOW** | Remove to hide technology stack |

**Response Headers (raw):**
```
HTTP/1.1 200 OK
Vary: RSC, Next-Router-State-Tree, Next-Router-Prefetch, Next-Router-Segment-Prefetch, Accept-Encoding
link: </_next/static/media/e4af272ccee01ff0-s.p.woff2>; rel=preload; as="font"; crossorigin=""; type="font/woff2"
Cache-Control: no-store, must-revalidate
X-Powered-By: Next.js
Content-Type: text/html; charset=utf-8
```

**Fix:** Tambahkan middleware.ts dengan security headers:
```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.delete('X-Powered-By');
  return response;
}
```

---

## 2. API Key Leakage

| Check | Status | Details |
|-------|--------|---------|
| Supabase anon key in source | ✅ Expected | `NEXT_PUBLIC_SUPABASE_ANON_KEY` — safe for client-side |
| Supabase service_role key | ✅ Protected | Disabled: `supabaseAdmin = null` with comment "Disabled for security" |
| Hardcoded secrets | ✅ None found | No hardcoded API keys in source code |
| NEXT_PUBLIC_ vars | ⚠️ Review | 10+ NEXT_PUBLIC_ vars exposed to client (expected but audit list) |

**Exposed NEXT_PUBLIC_ variables:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_USE_GO_AUTH`
- `NEXT_PUBLIC_ENABLE_AUTH_FALLBACK`
- `NEXT_PUBLIC_GO_BACKEND_URL`

**Verdict:** ✅ No critical leakage. Anon key is safe for client. Service role properly disabled.

---

## 3. Source Map Exposure

| Check | Status |
|-------|--------|
| `/_next/static/chunks/main.js.map` | ✅ 404 (not exposed) |
| `/_next/static/chunks/app/layout.js.map` | ✅ 404 (not exposed) |
| `/_next/static/chunks/webpack.js.map` | ✅ 404 (not exposed) |

**Verdict:** ✅ Source maps not accessible.

---

## 4. Auth Token Storage

| Check | Status | Severity |
|-------|--------|----------|
| Token storage location | ⚠️ localStorage | **HIGH** |
| Token key | `sb-token` (Supabase) + Go backend tokens | — |
| Cookie flags | ❌ Not using cookies for auth | **MEDIUM** |

**Finding:** Auth tokens stored in `localStorage` which is accessible via JavaScript (XSS vector). 

**Risk:** If XSS vulnerability exists, attacker can steal auth tokens from localStorage.

**Recommendation:** Consider using httpOnly cookies for auth tokens (Supabase SSR supports this via `@supabase/ssr`).

---

## 5. XSS Sanitization

| Check | Status | Severity |
|-------|--------|----------|
| Sanitization library installed | ❌ No DOMPurify | **HIGH** |
| Chat message sanitization | ✅ `sanitizeMessage()` in chatUtils.ts | — |
| Form input sanitization | ❌ Minimal | **MEDIUM** |
| Output encoding | ⚠️ React default (JSX auto-escapes) | LOW |

**Finding:** No comprehensive XSS sanitization library. Only `sanitizeMessage()` for chat messages. React's JSX auto-escaping provides baseline protection, but dangerouslySetInnerHTML usage or direct DOM manipulation could bypass it.

**Search Results:**
```
src/utils/chatUtils.ts:311: export function sanitizeMessage(message: string): string {
```

**Recommendation:** Install DOMPurify for any user-generated content rendering.

---

## 6. Route Protection

| Check | Status | Severity |
|-------|--------|----------|
| Next.js middleware.ts | ❌ Empty/missing | **CRITICAL** |
| Client-side auth check | ✅ Present in layout.tsx | — |
| Server-side protection | ❌ None | **CRITICAL** |

**Finding:** Route protection is CLIENT-SIDE ONLY via `useEffect` + `GoAuthAPI.isAuthenticated()` in `src/app/(protected)/layout.tsx`. No server-side middleware.

**Risk:** Client-side protection can be bypassed by:
1. Disabling JavaScript
2. Using browser DevTools to modify state
3. Direct API calls without going through the UI

**Code Location:** `src/app/(protected)/layout.tsx` — "use client" component with useEffect auth check

**Recommendation:** Add server-side middleware.ts for route protection:
```typescript
export function middleware(request: NextRequest) {
  const token = request.cookies.get('sb-token')?.value;
  if (!token && request.nextUrl.pathname.startsWith('/(protected)')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}
```

---

## 7. Input Validation

| Check | Status | Severity |
|-------|--------|----------|
| Login form validation | ⚠️ `required` only | **MEDIUM** |
| Register form validation | ⚠️ Minimal | **MEDIUM** |
| Forgot password validation | ✅ `required` attribute | — |
| Client-side validation library | ❌ No zod/yup/formik | **LOW** |

**Finding:** Form validation is minimal — only HTML5 `required` attributes. No structured validation library (zod, yup, formik) for comprehensive input validation.

---

## 8. Positive Findings ✅

| Check | Status | Notes |
|-------|--------|-------|
| Service role key protection | ✅ | `supabaseAdmin = null` — disabled for security |
| Supabase client config | ✅ | Using `createBrowserClient` with anon key only |
| Source map exposure | ✅ | Not accessible |
| .env in .gitignore | ✅ | All .env variants properly gitignored |
| Go backend auth fallback | ✅ | Dual auth system with proper fallback |
| Cache-Control | ✅ | `no-store, must-revalidate` — prevents caching sensitive data |

---

## Severity Summary

| Severity | Count | Findings |
|----------|-------|----------|
| **CRITICAL** | 2 | No security headers, No server-side route protection |
| **HIGH** | 4 | Missing CSP, X-Content-Type-Options, X-Frame-Options, HSTS, localStorage tokens |
| **MEDIUM** | 4 | Missing X-XSS-Protection, Referrer-Policy, Permissions-Policy, minimal validation |
| **LOW** | 1 | X-Powered-By exposed |

---

## Recommendations (Priority Order)

1. **[CRITICAL]** Add middleware.ts with security headers + server-side route protection
2. **[HIGH]** Implement CSP header (Content-Security-Policy)
3. **[HIGH]** Consider httpOnly cookies for auth tokens (Supabase SSR)
4. **[MEDIUM]** Install DOMPurify for user-generated content
5. **[MEDIUM]** Add structured validation library (zod) for forms
6. **[LOW]** Remove X-Powered-By header
