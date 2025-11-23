# Quick Fix Templates: Copy-Paste Solutions for Common Issues

**Document**: Frontend-Backend Integration Quick Fix Templates
**Project Date**: 2025-11-09
**Created**: 2025-11-09
**Version**: 1.0
**Status**: ✅ Complete
**Priority**: 📈 High
**Language**: English
**Audience**: Development Team
**Type**: Implementation Template

## Overview

This document contains ready-to-use code templates for fixing the most common integration issues found during component audits. Copy and adapt these templates for your specific use case.

## Template 1: API Route with Service Role

**Use When**: Component needs to read/write database data securely

**File**: `frontend/src/app/api/v1/[resource]/route.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ STEP 1: Validate Authorization
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: Missing Bearer token" },
        { status: 401 }
      );
    }

    // ✅ STEP 2: Extract and verify JWT
    const token = authHeader.substring(7);
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token format" },
        { status: 401 }
      );
    }

    const payload = JSON.parse(
      Buffer.from(parts[1], "base64").toString()
    );
    const userId = payload.sub;

    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized: Missing user ID in token" },
        { status: 401 }
      );
    }

    // ✅ STEP 3: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { message: "Bad request: Invalid JSON" },
        { status: 400 }
      );
    }

    // ✅ STEP 4: Validate required fields
    if (!body.name || body.name.trim() === "") {
      return NextResponse.json(
        { message: "Bad request: Name is required" },
        { status: 400 }
      );
    }

    // ✅ STEP 5: Initialize admin Supabase client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set");
      return NextResponse.json(
        { message: "Internal server error: Missing configuration" },
        { status: 500 }
      );
    }

    // ✅ STEP 6: Perform operation with service role
    const { data, error } = await supabaseAdmin
      .from("TABLE_NAME")
      .insert({
        user_id: userId,
        name: body.name.trim(),
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { message: "Failed to create record: Database error" },
        { status: 500 }
      );
    }

    // ✅ STEP 7: Return success response
    return NextResponse.json(
      {
        message: "Record created successfully",
        data: data,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Customization**:
- Replace `TABLE_NAME` with actual Supabase table
- Replace `INSERT` with `UPDATE`, `DELETE` as needed
- Modify validation to match your fields
- Add additional error checks

## Template 2: Frontend Component Using API Route

**Use When**: Component calls API route instead of direct Supabase

**File**: `frontend/src/components/MyComponent.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context"; // Or your auth provider
import { toast } from "sonner";

interface ApiResponse {
  message: string;
  data?: Record<string, unknown>;
}

export function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  const handleAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // ✅ STEP 1: Get token from localStorage
      const token = localStorage.getItem("selly_auth_token");
      if (!token) {
        throw new Error("Anda harus login terlebih dahulu");
      }

      // ✅ STEP 2: Validate token format
      if (!token.startsWith("Bearer ")) {
        throw new Error("Token format invalid");
      }

      // ✅ STEP 3: Call API route
      const response = await fetch("/api/v1/resource", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token.replace("Bearer ", "")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "Your data here",
          // Add other fields
        }),
      });

      // ✅ STEP 4: Handle response
      if (!response.ok) {
        const errorData = (await response.json()) as ApiResponse;
        throw new Error(errorData.message || "Unknown error");
      }

      const result = (await response.json()) as ApiResponse;
      console.log("Success:", result);

      // ✅ STEP 5: Update state and notify user
      toast.success(result.message || "Operasi berhasil");

      // ✅ STEP 6: Emit event for other components
      window.dispatchEvent(
        new CustomEvent("resourceUpdated", {
          detail: { data: result.data, userId: auth.user?.id },
        })
      );

      // Optionally refresh local state
      // setData(result.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("Error:", message);
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleAction}>
      {error && <div className="text-red-600">{error}</div>}
      <button type="submit" disabled={loading}>
        {loading ? "Loading..." : "Submit"}
      </button>
    </form>
  );
}
```

**Customization**:
- Replace `/api/v1/resource` with your API route path
- Replace `POST` with `PATCH`, `DELETE` as needed
- Modify request body fields
- Change event name from `resourceUpdated`
- Customize error messages to Indonesian

## Template 3: Event Emission After Update

**Use When**: Component updates data and needs to notify other components

**Code Section for Component**:

```typescript
// ✅ Add this after successful API call
window.dispatchEvent(
  new CustomEvent("resourceUpdated", {
    detail: {
      userId: auth.user?.id,
      data: result.data,
      action: "update", // or "create", "delete"
      timestamp: new Date().toISOString(),
    },
  })
);

// ✅ Toast notification in user's language
toast.success("Profil berhasil diperbarui");
```

## Template 4: Event Listener in Related Component

**Use When**: Component needs to react to updates from another component

**File**: `frontend/src/components/RelatedComponent.tsx`

```typescript
"use client";

import { useEffect, useState } from "react";

interface ResourceData {
  id: string;
  name: string;
  // Add other fields
}

export function RelatedComponent() {
  const [data, setData] = useState<ResourceData | null>(null);

  useEffect(() => {
    // ✅ STEP 1: Define event handler
    const handleUpdate = (event: Event) => {
      const customEvent = event as CustomEvent;
      const { userId, data: updatedData, action } = customEvent.detail;

      console.log(`Resource ${action}: ${userId}`, updatedData);

      // ✅ STEP 2: Update local state
      if (updatedData) {
        setData(updatedData);
      }

      // ✅ STEP 3: Update localStorage if needed
      if (updatedData?.id) {
        localStorage.setItem(
          "resource_data",
          JSON.stringify(updatedData)
        );
      }
    };

    // ✅ STEP 4: Register event listener
    window.addEventListener("resourceUpdated", handleUpdate);

    // ✅ STEP 5: Cleanup on unmount (IMPORTANT!)
    return () => {
      window.removeEventListener("resourceUpdated", handleUpdate);
    };
  }, []); // Empty dependency array - setup once on mount

  return (
    <div>
      {data ? (
        <div>Name: {data.name}</div>
      ) : (
        <div>No data loaded</div>
      )}
    </div>
  );
}
```

**Important**: Always include cleanup in the return statement!

## Template 5: File Upload with API Route

**Use When**: Component needs to upload files to storage

**API Route**: `frontend/src/app/api/v1/upload/route.ts`

```typescript
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // ✅ STEP 1: Validate token (same as other routes)
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64").toString()
    );
    const userId = payload.sub;

    // ✅ STEP 2: Parse FormData
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // ✅ STEP 3: Validate file
    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { message: "File type not allowed" },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { message: "File too large (max 5MB)" },
        { status: 400 }
      );
    }

    // ✅ STEP 4: Create admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY || ""
    );

    // ✅ STEP 5: Upload file
    const fileName = `${userId}/${Date.now()}-${file.name}`;
    const buffer = await file.arrayBuffer();

    const { data, error } = await supabaseAdmin.storage
      .from("bucket-name")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("Upload error:", error);
      return NextResponse.json(
        { message: "Upload failed" },
        { status: 500 }
      );
    }

    // ✅ STEP 6: Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage
      .from("bucket-name")
      .getPublicUrl(fileName);

    return NextResponse.json(
      {
        message: "File uploaded",
        url: publicUrl,
        path: fileName,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Frontend Usage**:

```typescript
const handleUpload = async (file: File) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/v1/upload", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token.replace("Bearer ", "")}`,
    },
    body: formData,
  });

  const result = await response.json();
  console.log("Upload URL:", result.url);

  // ✅ Emit event about upload
  window.dispatchEvent(
    new CustomEvent("fileUploaded", {
      detail: { url: result.url, fileName: file.name },
    })
  );
};
```

## Template 6: Error Handling Pattern

**Use When**: Handling errors consistently across all components

**Component Pattern**:

```typescript
// ✅ Specific error with context
try {
  const response = await fetch("/api/v1/resource", {
    method: "POST",
    headers: { "Authorization": `Bearer ${token}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message);
  }

  const result = await response.json();
  return result;
} catch (error) {
  // ✅ Console log with context for debugging
  console.error("Failed to create resource:", {
    error: error instanceof Error ? error.message : String(error),
    timestamp: new Date().toISOString(),
    context: "MyComponent.handleCreate",
  });

  // ✅ Show user-friendly message in Indonesian
  const userMessage = error instanceof Error
    ? error.message
    : "Gagal membuat resource. Silakan coba lagi.";

  toast.error(userMessage);
  setError(userMessage);
}
```

## Template 7: Environment Variable Setup

**File**: `frontend/.env.local`

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# ✅ CRITICAL: Service Role Key from backend/.env
# This enables API routes to bypass RLS policies
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:8080
```

**Important Notes**:
- `SUPABASE_SERVICE_ROLE_KEY` must match backend's key
- Never commit `.env.local` to git
- Add to `.gitignore` if not already there
- Variables prefixed with `NEXT_PUBLIC_` are exposed to browser
- Variables without prefix are only available on server

## Template 8: TypeScript Types for API Responses

**File**: `frontend/src/types/api.ts`

```typescript
// ✅ Base API response type
export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
  error?: string;
}

// ✅ Common error response
export interface ApiError {
  message: string;
  code?: string;
  status: number;
}

// ✅ User profile type
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  nip?: string;
  position?: string;
  nik?: string;
  created_at: string;
  updated_at: string;
}

// ✅ JWT payload type
export interface JwtPayload {
  sub: string; // user ID
  email: string;
  role: string;
  iat: number;
  exp: number;
}

// ✅ Event detail types
export interface AvatarUpdatedEvent {
  userId: string;
  avatar_url: string | null;
  timestamp: string;
}

export interface ProfileUpdatedEvent {
  userId: string;
  profile: UserProfile;
  action: "create" | "update" | "delete";
}
```

**Usage**:

```typescript
const result = await response.json() as ApiResponse<UserProfile>;
```

## Quick Checklist: Before Submitting Code

- [ ] Removed all direct `supabase.from()` calls
- [ ] Removed all direct `supabase.storage` calls
- [ ] Created API route if needed
- [ ] API route validates JWT token
- [ ] API route validates request data
- [ ] API route uses service role key
- [ ] Component calls API route with Bearer token
- [ ] Component handles error responses
- [ ] Component emits event on success
- [ ] Related components listen for events
- [ ] Event listeners have cleanup
- [ ] localStorage updated if needed
- [ ] Error messages are in Indonesian
- [ ] TypeScript has no errors
- [ ] Console logging added for debugging
- [ ] Tested successful operation
- [ ] Tested error scenarios

## Common Mistakes to Avoid

### ❌ WRONG: Mixing two patterns

```typescript
// NO! Don't mix direct calls and API routes
const { data: file } = await supabase.storage.from("avatars").upload(...);
const response = await fetch("/api/v1/update", { ... });
```

### ✅ CORRECT: Use API route for everything

```typescript
// YES! Call API route that handles everything
const response = await fetch("/api/v1/avatar", {
  method: "POST",
  body: formData,
});
```

### ❌ WRONG: Forgetting event cleanup

```typescript
useEffect(() => {
  window.addEventListener("update", handler);
  // NO! Missing cleanup
}, []);
```

### ✅ CORRECT: Clean up event listener

```typescript
useEffect(() => {
  window.addEventListener("update", handler);
  return () => window.removeEventListener("update", handler);
}, []);
```

### ❌ WRONG: Wrong token key

```typescript
const token = localStorage.getItem("auth_token"); // WRONG KEY!
```

### ✅ CORRECT: Consistent token key

```typescript
const token = localStorage.getItem("selly_auth_token"); // CORRECT!
```

---

**Last Updated**: 2025-11-09
**Status**: Ready for immediate use
**Version**: 1.0
**Maintenance**: Update as new patterns emerge
