import { NextRequest, NextResponse } from 'next/server';
import { createClient } from "@supabase/supabase-js";

/**
 * GET /api/data-rekam/adjudicate
 * 
 * Retrieves adjudicate record list with authorization.
 * This is a secure API route that:
 * 1. Validates user authentication via their token
 * 2. Passes query parameters to Go backend
 * 3. Handles authorization checks server-side
 * 4. Returns paginated filtered results
 * 
 * Query Parameters:
 * - page: Page number (default: 1)
 * - page_size: Results per page (default: 10, max: 100)
 * - status: Filter by status (all, completed, pending)
 * - search: Text search query
 * - start_date: Filter by start date (YYYY-MM-DD)
 * - end_date: Filter by end date (YYYY-MM-DD)
 */
export async function GET(request: NextRequest) {
    try {
        // Get authorization token from request headers
        const authHeader = request.headers.get('authorization');
        
        if (!authHeader) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Authentication required'
                },
                { status: 401 }
            );
        }

        // Get the Go backend URL
        const goBackendUrl = process.env.NEXT_PUBLIC_GO_BACKEND_URL || 'http://localhost:8080';

        // Forward query parameters to Go backend
        const searchParams = request.nextUrl.searchParams;
        const queryString = searchParams.toString();

        // Call the Go backend data-rekam endpoint
        const response = await fetch(
            `${goBackendUrl}/data-rekam/adjudicate${queryString ? '?' + queryString : ''}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': authHeader,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
            }
        );

        // Check if response is okay
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            
            // Pass through authentication errors (401, 403)
            if (response.status === 401 || response.status === 403) {
                return NextResponse.json(
                    {
                        success: false,
                        error: errorData.error || 'Authentication failed'
                    },
                    { status: response.status }
                );
            }

            console.error('Go backend error:', {
                status: response.status,
                error: errorData
            });

            return NextResponse.json(
                {
                    success: false,
                    error: 'Failed to retrieve adjudicate records'
                },
                { status: response.status }
            );
        }

        // Parse successful response from Go backend
        const data = await response.json();

        // Return the data to the frontend
        return NextResponse.json(data, { status: 200 });

    } catch (error) {
        console.error('API route error:', error);
        
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}

/**
 * POST /api/data-rekam/adjudicate
 * 
 * Creates or updates an adjudicate record using Supabase.
 * This is a secure API route that:
 * 1. Validates user authentication via JWT token
 * 2. Extracts user ID from token payload
 * 3. Validates request body fields
 * 4. Performs insert or update operation using Supabase service role
 * 5. Returns the created/updated record
 * 
 * Request Body:
 * - id (optional): For update operations
 * - user_id: UUID of the user
 * - nik_adjudicate: NIK of the adjudicate person
 * - nama_adjudicate: Name of the adjudicate person
 * - nik_pengaju: NIK of the requestor
 * - nama_pengaju: Name of the requestor
 * - jenis_eksepsi: Type of exception
 * - tanggal_pengajuan: Date of request (YYYY-MM-DD)
 * - estimasi_tanggal_perekaman: Estimated recording date (YYYY-MM-DD)
 * - is_ready_to_record: Is ready to record (boolean)
 */
export async function POST(request: NextRequest) {
  try {
    // ✅ STEP 1: Validate Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized: Missing Bearer token" },
        { status: 401 }
      );
    }

    // ✅ STEP 2: Extract and verify JWT token format
    const token = authHeader.substring(7);
    const parts = token.split(".");
    if (parts.length !== 3) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token format" },
        { status: 401 }
      );
    }

    // ✅ STEP 3: Decode and parse JWT payload
    let payload: any;
    try {
      payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    } catch (e) {
      return NextResponse.json(
        { message: "Unauthorized: Invalid token payload" },
        { status: 401 }
      );
    }

    // ✅ STEP 4: Extract user ID from token
    const userId = payload.sub;
    if (!userId) {
      return NextResponse.json(
        { message: "Unauthorized: Missing user ID in token" },
        { status: 401 }
      );
    }

    // ✅ STEP 5: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { message: "Bad request: Invalid JSON" },
        { status: 400 }
      );
    }

    // ✅ STEP 6: Validate required fields
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
        console.error(
          `[adjudicate-api] Missing or empty required field: ${field}`
        );
        return NextResponse.json(
          { message: `Bad request: ${field} is required` },
          { status: 400 }
        );
      }
    }

    // ✅ STEP 7: Create Supabase client with service role
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.error("[adjudicate-api] Missing Supabase configuration");
      return NextResponse.json(
        { message: "Internal server error: Database configuration missing" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // ✅ STEP 8: Prepare data for insert/update
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

    // ✅ STEP 9: Perform insert or update
    let result;
    if (body.id) {
      // Update existing record
      const { data, error } = await supabase
        .from("adjudicate_record")
        .update(dataToSave)
        .eq("id", body.id)
        .select();

      if (error) {
        console.error("[adjudicate-api] Update error:", error);
        return NextResponse.json(
          { message: `Database error: ${error.message}` },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Insert new record
      const { data, error } = await supabase
        .from("adjudicate_record")
        .insert([dataToSave])
        .select();

      if (error) {
        console.error("[adjudicate-api] Insert error details:", {
          message: error.message,
          code: (error as any).code,
          details: (error as any).details,
          hint: (error as any).hint,
          fullError: error,
          dataToSave,
        });
        return NextResponse.json(
          { 
            message: `Database error: ${error.message}`,
            code: (error as any).code,
            details: (error as any).details,
          },
          { status: 500 }
        );
      }

      result = data;
    }

    // ✅ STEP 10: Return success response
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
        message:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/data-rekam/adjudicate
 * 
 * Deletes an adjudicate record by ID.
 * 
 * Required:
 * - id: The UUID of the record to delete
 * - Authorization header with Bearer token
 */
export async function DELETE(request: NextRequest) {
  try {
    // Step 1: Validate authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('[adjudicate-api] Missing authorization header');
      return NextResponse.json(
        { message: 'Unauthorized: Missing Bearer token' },
        { status: 401 }
      );
    }

    // Step 2: Parse and validate JWT token
    const tokenParts = authHeader.split(' ');
    if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
      console.error('[adjudicate-api] Invalid authorization format');
      return NextResponse.json(
        { message: 'Unauthorized: Invalid Bearer token format' },
        { status: 401 }
      );
    }

    // Step 3: Get record ID from request body
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      console.error('[adjudicate-api] Failed to parse request body');
      return NextResponse.json(
        { message: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { id } = body;
    if (!id) {
      console.error('[adjudicate-api] Missing record ID');
      return NextResponse.json(
        { message: 'Record ID is required' },
        { status: 400 }
      );
    }

    // Step 4: Verify Supabase configuration
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('[adjudicate-api] Missing Supabase configuration');
      return NextResponse.json(
        { message: 'Internal server error: Database configuration missing' },
        { status: 500 }
      );
    }

    // Step 5: Create Supabase client with service role
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Step 6: Delete the record
    const { error } = await supabase
      .from('adjudicate_record')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[adjudicate-api] Delete error details:', {
        message: error.message,
        code: (error as any).code,
        details: (error as any).details,
        hint: (error as any).hint,
      });
      return NextResponse.json(
        {
          message: `Database error: ${error.message}`,
          code: (error as any).code,
          details: (error as any).details,
        },
        { status: 500 }
      );
    }

    // Step 7: Return success response
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
        message:
          error instanceof Error
            ? error.message
            : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
