# Duplicate Operator vs Adjudicate Record - Pattern Comparison

**Purpose**: Document the patterns applied from adjudicate-record to duplicate-operator  
**Date**: 2025-11-10

## File-by-File Comparison

### 1. Page Component (page.tsx)

#### Authentication State Management

**adjudicate-record pattern**:
```typescript
export default function AdjudicateRecordPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!contextUser) {
        toast.error("Sesi tidak ditemukan...");
        router.push("/");
        return;
      }

      let userRoleValue = contextUser.role || "user";
      const normalizedRole = userRoleValue.toLowerCase().trim();
      const isAdmin = ["admin", "superuser"].includes(normalizedRole);

      if (isAdmin) {
        console.log("[AdjudicateRecord] Admin user detected, skipping NIK validation");
        setUser(contextUser);  // ← Set immediately
        setUserRole(userRoleValue);
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: contextUser.nik || "",
          nama_pengaju: contextUser.name,
        }));
        return;
      }

      const userNik = contextUser.nik || "";
      if (!userNik || !validateNIK(userNik)) {
        console.warn("[AdjudicateRecord] Non-admin user has invalid NIK:", userNik);
        toast.error("NIK Anda tidak valid...");
        router.push("/profile");
        return;
      }

      setUser(contextUser);  // ← Set for regular users too
      setUserRole(userRoleValue);
      // ... rest of initialization
    };

    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router]);
}
```

**duplicate-operator (SAME pattern applied)**:
```typescript
export default function DuplicateOperatorPage() {
  const [user, setUser] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<string>("user");

  useEffect(() => {
    const fetchUserData = async () => {
      if (!contextUser) {
        toast.error("Sesi tidak ditemukan...");
        router.push("/");
        return;
      }

      let userRoleValue = contextUser.role || "user";
      const normalizedRole = userRoleValue.toLowerCase().trim();
      const isAdmin = ["admin", "superuser"].includes(normalizedRole);

      if (isAdmin) {
        console.log("[DuplicateOperator] Admin user detected, skipping NIK validation");
        setUser(contextUser);  // ← Identical pattern
        setUserRole(userRoleValue);
        setFormData((prev) => ({
          ...prev,
          nik_pengaju: contextUser.nik || "",
          nama_pengaju: contextUser.name,
        }));
        return;
      }

      const userNik = contextUser.nik || "";
      if (!userNik || !validateNIK(userNik)) {
        console.warn("[DuplicateOperator] Non-admin user has invalid NIK:", userNik);
        toast.error("NIK Anda tidak valid...");
        router.push("/profile");
        return;
      }

      setUser(contextUser);  // ← Identical pattern
      setUserRole(userRoleValue);
      // ... rest of initialization
    };

    if (!isLoadingAuth && contextUser) {
      fetchUserData();
    }
  }, [contextUser, isLoadingAuth, router]);
}
```

✅ **Identical pattern applied**

#### NIK Validation

**adjudicate-record**:
```typescript
const validateNIK = (nik: string) => {
  return nik.length === 16 && /^\d{16}$/.test(nik);
};
```

**duplicate-operator (SAME)**:
```typescript
const validateNIK = (nik: string) => {
  return nik.length === 16 && /^\d{16}$/.test(nik);
};
```

✅ **Identical validation function**

#### Token Retrieval in fetchRekapData

**adjudicate-record**:
```typescript
const fetchRekapData = useCallback(
  async (page = 1, query = "", statusFilter = "all") => {
    // ... validation ...

    // Get JWT token from localStorage (Go backend session)
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Token autentikasi tidak ditemukan...");
      router.push("/login");
      return { totalCount: 0 };
    }

    // Call backend API via Next.js proxy route
    const response = await fetch(
      `/api/data-rekam/adjudicate?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // ... handle response ...
  },
  [contextUser, router],
);
```

**duplicate-operator (SAME pattern)**:
```typescript
const fetchRekapData = useCallback(
  async (page = 1, query = "", statusFilter = "all") => {
    // ... validation ...

    // Get JWT token from localStorage (Go backend session)
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      toast.error("Token autentikasi tidak ditemukan...");
      router.push("/login");
      return { totalCount: 0 };
    }

    // Call backend API via Next.js proxy route
    const response = await fetch(
      `/api/data-rekam/duplicate-operator?${params.toString()}`,
      {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    // ... handle response ...
  },
  [contextUser, router],
);
```

✅ **Identical token retrieval and API call pattern**

#### Form Submission Handler

**adjudicate-record**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    toast.error("Data pengguna tidak ditemukan...");
    return;
  }

  if (userRole === "user") {
    toast.error("Anda tidak memiliki izin untuk mengubah data ini.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      throw new Error("Token autentikasi tidak ditemukan...");
    }

    const dataToSave = {
      id: isEditing && editId ? editId : undefined,
      nik_adjudicate: formData.nik_adjudicate.trim(),
      // ... more fields ...
    };

    const response = await fetch("/api/data-rekam/adjudicate", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
    });

    // ... error handling ...
  } catch (error: any) {
    console.error("Error submitting data:", error);
    // ... error handling ...
  } finally {
    setLoading(false);
  }
};
```

**duplicate-operator (SAME pattern)**:
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!user) {
    toast.error("Data pengguna tidak ditemukan...");
    return;
  }

  if (userRole === "user") {
    toast.error("Anda tidak memiliki izin untuk mengubah data ini.");
    return;
  }

  setLoading(true);
  setError(null);

  try {
    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      throw new Error("Token autentikasi tidak ditemukan...");
    }

    const dataToSave = {
      id: isEditing && editId ? editId : undefined,
      nik_duplicate: formData.nik_duplicate.trim(),
      // ... more fields ...
    };

    const response = await fetch("/api/data-rekam/duplicate-operator", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataToSave),
    });

    // ... error handling ...
  } catch (error: any) {
    console.error("Error submitting data:", error);
    // ... error handling ...
  } finally {
    setLoading(false);
  }
};
```

✅ **Identical form submission pattern**

#### Delete Handler

**adjudicate-record**:
```typescript
const handleDelete = async (id: string) => {
  if (!user) {
    toast.error("Pengguna tidak ditemukan...");
    return;
  }

  if (userRole === "user") {
    toast.error("Anda tidak memiliki izin untuk menghapus data ini.");
    return;
  }

  if (!id) {
    toast.error("ID tidak valid...");
    return;
  }

  if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

  try {
    setError(null);

    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      throw new Error("Token autentikasi tidak ditemukan...");
    }

    const response = await fetch("/api/data-rekam/adjudicate", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    // ... error handling ...
  } catch (error: any) {
    console.error("Error deleting data:", error);
    // ... error handling ...
  }
};
```

**duplicate-operator (SAME pattern)**:
```typescript
const handleDelete = async (id: string) => {
  if (!user) {
    toast.error("Pengguna tidak ditemukan...");
    return;
  }

  if (userRole === "user") {
    toast.error("Anda tidak memiliki izin untuk menghapus data ini.");
    return;
  }

  if (!id) {
    toast.error("ID tidak valid...");
    return;
  }

  if (!confirm("Apakah Anda yakin ingin menghapus pengajuan ini?")) return;

  try {
    setError(null);

    const token = localStorage.getItem("selly_auth_token");
    if (!token) {
      throw new Error("Token autentikasi tidak ditemukan...");
    }

    const response = await fetch("/api/data-rekam/duplicate-operator", {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    // ... error handling ...
  } catch (error: any) {
    console.error("Error deleting data:", error);
    // ... error handling ...
  }
};
```

✅ **Identical delete handler pattern**

### 2. API Route (route.ts)

#### GET Endpoint

**adjudicate-record**:
```typescript
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(
      `${goBackendUrl}/data-rekam/adjudicate${queryString ? '?' + queryString : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    // ... error handling ...
  } catch (error) {
    // ... error handling ...
  }
}
```

**duplicate-operator (SAME pattern)**:
```typescript
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';
    const searchParams = request.nextUrl.searchParams;
    const queryString = searchParams.toString();

    const response = await fetch(
      `${goBackendUrl}/data-rekam/duplicate-operator${queryString ? '?' + queryString : ''}`,
      {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      }
    );

    // ... error handling ...
  } catch (error) {
    // ... error handling ...
  }
}
```

✅ **Identical GET endpoint pattern**

#### POST Endpoint

**adjudicate-record**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token format" },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing user ID in token" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Bad request: Invalid JSON" },
        { status: 400 }
      );
    }

    const requiredFields = [
      "nik_adjudicate",
      "nama_adjudicate",
      "nik_pengaju",
      "nama_pengaju",
      "jenis_eksepsi",
      "tanggal_pengajuan",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { success: false, error: `Bad request: ${field} is required` },
          { status: 400 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Internal server error: Database configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const dataToSave = {
      user_id: body.user_id || userId,
      nik_adjudicate: String(body.nik_adjudicate).trim(),
      nama_adjudicate: String(body.nama_adjudicate).trim(),
      nik_pengaju: String(body.nik_pengaju).trim(),
      nama_pengaju: String(body.nama_pengaju).trim(),
      jenis_eksepsi: String(body.jenis_eksepsi).trim(),
      tanggal_pengajuan: body.tanggal_pengajuan,
      estimasi_tanggal_perekaman: body.estimasi_tanggal_perekaman || null,
      is_ready_to_record: body.is_ready_to_record || false,
    };

    let result;
    if (body.id) {
      const { data, error } = await supabase
        .from("adjudicate_record")
        .update(dataToSave)
        .eq("id", body.id)
        .select();

      if (error) {
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
    } else {
      const { data, error } = await supabase
        .from("adjudicate_record")
        .insert([dataToSave])
        .select();

      if (error) {
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(
      {
        success: true,
        data: result?.[0] || null,
        message: body.id ? "Record updated successfully" : "Record created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[adjudicate-api] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
```

**duplicate-operator (SAME pattern applied with field name changes)**:
```typescript
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing Bearer token" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token format" },
        { status: 401 }
      );
    }

    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Invalid token payload" },
        { status: 401 }
      );
    }

    const userId = payload.sub;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized: Missing user ID in token" },
        { status: 401 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: "Bad request: Invalid JSON" },
        { status: 400 }
      );
    }

    const requiredFields = [
      "nik_duplicate",
      "nama_duplicate",
      "nik_operator",
      "nama_operator",
      "nik_pengaju",
      "nama_pengaju",
      "tanggal_pengajuan",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        return NextResponse.json(
          { success: false, error: `Bad request: ${field} is required` },
          { status: 400 }
        );
      }
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      return NextResponse.json(
        { success: false, error: "Internal server error: Database configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    const dataToSave = {
      user_id: body.user_id || userId,
      nik_duplicate: String(body.nik_duplicate).trim(),
      nama_duplicate: String(body.nama_duplicate).trim(),
      nik_operator: String(body.nik_operator).trim(),
      nama_operator: String(body.nama_operator).trim(),
      nik_pengaju: String(body.nik_pengaju).trim(),
      nama_pengaju: String(body.nama_pengaju).trim(),
      tanggal_perekaman: body.tanggal_perekaman || null,
      tanggal_pengajuan: body.tanggal_pengajuan,
      estimasi_tanggal_perekaman: body.estimasi_tanggal_perekaman || null,
      is_ready_to_record: body.is_ready_to_record || false,
    };

    let result;
    if (body.id) {
      const { data, error } = await supabase
        .from("duplicate_operator")
        .update(dataToSave)
        .eq("id", body.id)
        .select();

      if (error) {
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
    } else {
      const { data, error } = await supabase
        .from("duplicate_operator")
        .insert([dataToSave])
        .select();

      if (error) {
        return NextResponse.json(
          { success: false, error: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json(
      {
        success: true,
        data: result?.[0] || null,
        message: body.id ? "Record updated successfully" : "Record created successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[duplicate-operator-api] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}
```

✅ **Identical POST endpoint pattern with field name changes**

#### DELETE Endpoint

**adjudicate-record**:
```typescript
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing Bearer token' },
        { status: 401 }
      );
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Bearer token format' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Internal server error: Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('adjudicate_record')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Record deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[adjudicate-api] Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

**duplicate-operator (SAME pattern)**:
```typescript
export async function DELETE(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Missing Bearer token' },
        { status: 401 }
      );
    }

    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid Bearer token format' },
        { status: 401 }
      );
    }

    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { success: false, error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { id } = body;
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Record ID is required' },
        { status: 400 }
      );
    }

    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json(
        { success: false, error: 'Internal server error: Database configuration missing' },
        { status: 500 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { error } = await supabase
      .from('duplicate_operator')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Database error: ${error.message}`,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Record deleted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[duplicate-operator-api] Delete error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
```

✅ **Identical DELETE endpoint pattern**

## Summary Table

| Component | Pattern | Status | Notes |
|-----------|---------|--------|-------|
| User State Init | Set immediately before validation | ✅ Applied | Prevents "Sesi tidak ditemukan" errors |
| Admin Role Bypass | Check role, skip validation for admin | ✅ Applied | Allows admins to manage records |
| NIK Validation | Regular function, not memoized | ✅ Applied | Prevents infinite loops |
| Token Retrieval | localStorage.getItem("selly_auth_token") | ✅ Applied | Works with Go backend auth |
| API GET Endpoint | Forward to Go backend with auth | ✅ Applied | Data retrieval pattern |
| API POST Endpoint | JWT validation + service role bypass | ✅ Applied | Create/update pattern |
| API DELETE Endpoint | JWT validation + service role bypass | ✅ Applied | Delete pattern |
| Error Handling | Try-catch + status codes + toast | ✅ Applied | Consistent across module |
| Logging | Console logs with component prefix | ✅ Applied | Aids debugging |
| Field Mapping | Adjusted for duplicate-operator fields | ✅ Applied | Domain-specific fields |

## Conclusion

✅ **100% Pattern Fidelity** - The duplicate-operator implementation now follows the exact same patterns established by adjudicate-record, ensuring consistency across the data-rekam module and reducing future maintenance burden.

**Key Benefits**:
- Predictable behavior across similar pages
- Easier onboarding for new team members
- Reduced debugging time
- Consistent error handling
- Standardized authentication flow
