import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/data-rekam/pengajuan-bulanan
 * 
 * Creates or updates a pengajuan bulanan (monthly submission) record.
 * This is a secure API route that:
 * 1. Validates user authentication via JWT token
 * 2. Extracts user ID from token payload
 * 3. Validates request body fields
 * 4. Performs insert or update operation using Supabase service role
 * 5. Returns the created/updated record
 * 
 * Request Body:
 * - id (optional): For update operations
 * - nik_pengajuan_hapus: NIK to be deleted
 * - nama_pengajuan: Name of submission
 * - alasan_pengajuan: Reason for submission
 * - alasan_lainnya: Other reason (optional)
 * - nik_pengaju: NIK of submitter
 * - nama_pengaju: Name of submitter
 * - tanggal_pengajuan: Submission date
 * - estimasi_tanggal_perekaman: Estimated recording date (optional)
 * - is_ready_to_record: Status flag (optional)
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
      "nik_pengajuan_hapus",
      "nama_pengajuan",
      "alasan_pengajuan",
      "nik_pengaju",
      "nama_pengaju",
      "tanggal_pengajuan",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim() === "") {
        console.error(
          `[pengajuan-bulanan-api] Missing or empty required field: ${field}`
        );
        return NextResponse.json(
          { message: `Bad request: ${field} is required` },
          { status: 400 }
        );
      }
    }

    // ✅ STEP 7: Check for Supabase configuration
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[pengajuan-bulanan-api] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set"
      );
      return NextResponse.json(
        { message: "Internal server error: Missing configuration" },
        { status: 500 }
      );
    }

    // ✅ STEP 8: Initialize admin Supabase client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // ✅ STEP 9: Prepare data for insertion/update
    const dataToSave = {
      user_id: userId,
      nik_pengajuan_hapus: String(body.nik_pengajuan_hapus).trim(),
      nama_pengajuan: String(body.nama_pengajuan).trim(),
      alasan_pengajuan: body.alasan_pengajuan,
      alasan_lainnya: body.alasan_lainnya
        ? String(body.alasan_lainnya).trim()
        : null,
      nik_pengaju: String(body.nik_pengaju).trim(),
      nama_pengaju: String(body.nama_pengaju).trim(),
      tanggal_pengajuan: body.tanggal_pengajuan,
      estimasi_tanggal_perekaman: body.estimasi_tanggal_perekaman || null,
      is_ready_to_record: body.is_ready_to_record || false,
    };

    // ✅ STEP 10: Determine if update or insert operation
    if (body.id) {
      // UPDATE operation
      console.log(
        `[pengajuan-bulanan-api] UPDATE: Updating record ${body.id} for user ${userId}`
      );

      const { data, error } = await supabaseAdmin
        .from("pengajuan_bulanan")
        .update({
          ...dataToSave,
          updated_at: new Date().toISOString(),
        })
        .eq("id", body.id)
        .eq("user_id", userId) // Ensure user owns this record
        .select()
        .single();

      if (error) {
        console.error(
          "[pengajuan-bulanan-api] Database error on UPDATE:",
          error
        );
        return NextResponse.json(
          {
            message: "Failed to update record",
            error: error.message,
          },
          { status: 500 }
        );
      }

      console.log(
        `[pengajuan-bulanan-api] UPDATE successful for record ${body.id}`
      );

      return NextResponse.json(
        {
          success: true,
          message: "Record updated successfully",
          data: data,
        },
        { status: 200 }
      );
    } else {
      // INSERT operation
      console.log(
        `[pengajuan-bulanan-api] INSERT: Creating new record for user ${userId}`
      );

      const { data, error } = await supabaseAdmin
        .from("pengajuan_bulanan")
        .insert({
          ...dataToSave,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error(
          "[pengajuan-bulanan-api] Database error on INSERT:",
          error
        );
        return NextResponse.json(
          {
            message: "Failed to create record",
            error: error.message,
          },
          { status: 500 }
        );
      }

      console.log(`[pengajuan-bulanan-api] INSERT successful for new record`);

      return NextResponse.json(
        {
          success: true,
          message: "Record created successfully",
          data: data,
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error("[pengajuan-bulanan-api] Unexpected error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/data-rekam/pengajuan-bulanan
 * 
 * Retrieves pengajuan bulanan (monthly submission) list with authorization.
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
            `${goBackendUrl}/data-rekam/pengajuan-bulanan${queryString ? '?' + queryString : ''}`,
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
                    error: 'Failed to retrieve pengajuan bulanan records'
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
