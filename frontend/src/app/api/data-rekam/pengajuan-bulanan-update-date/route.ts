import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/data-rekam/pengajuan-bulanan/update-date
 *
 * Updates the estimasi_tanggal_perekaman (estimated recording date) for a pengajuan bulanan record.
 * This is a secure API route that:
 * 1. Validates JWT token from Authorization header
 * 2. Extracts user ID from token payload
 * 3. Verifies user is admin or superuser
 * 4. Updates the record with new date
 *
 * Request Body:
 * - id: Record ID
 * - newDate: New date string (YYYY-MM-DD format)
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

    // ✅ STEP 5: Extract user role from token
    const userRole = payload.role || "user";
    const normalizedRole = userRole.toLowerCase().trim();

    // ✅ STEP 6: Verify user is admin or superuser
    if (!["admin", "superuser"].includes(normalizedRole)) {
      console.warn(
        `[update-date-api] Non-admin user ${userId} attempted to update date`
      );
      return NextResponse.json(
        { message: "Forbidden: Only admin or superuser can update date" },
        { status: 403 }
      );
    }

    // ✅ STEP 7: Parse and validate request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json(
        { message: "Bad request: Invalid JSON" },
        { status: 400 }
      );
    }

    // ✅ STEP 8: Validate required fields
    if (!body.id || !body.newDate) {
      console.error("[update-date-api] Missing required fields: id or newDate");
      return NextResponse.json(
        { message: "Bad request: id and newDate are required" },
        { status: 400 }
      );
    }

    // ✅ STEP 9: Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(body.newDate)) {
      console.error(
        `[update-date-api] Invalid date format: ${body.newDate}. Expected YYYY-MM-DD`
      );
      return NextResponse.json(
        { message: "Bad request: Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    // Validate that it's a valid date
    const dateObj = new Date(body.newDate);
    if (isNaN(dateObj.getTime())) {
      console.error(`[update-date-api] Invalid date value: ${body.newDate}`);
      return NextResponse.json(
        { message: "Bad request: Invalid date value" },
        { status: 400 }
      );
    }

    // ✅ STEP 10: Check for Supabase configuration
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[update-date-api] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set"
      );
      return NextResponse.json(
        { message: "Internal server error: Missing configuration" },
        { status: 500 }
      );
    }

    // ✅ STEP 11: Initialize admin Supabase client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(
      `[update-date-api] Admin ${userId} updating date for record ${body.id} to ${body.newDate}`
    );

    // ✅ STEP 12: Update record date
    const { data, error } = await supabaseAdmin
      .from("pengajuan_bulanan")
      .update({
        estimasi_tanggal_perekaman: body.newDate,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("[update-date-api] Database error:", error);
      return NextResponse.json(
        {
          message: "Failed to update date",
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `[update-date-api] Date update successful for record ${body.id}`
    );

    // ✅ STEP 13: Emit event for cross-component updates
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("pengajuan-bulanan-date-updated", {
          detail: {
            id: body.id,
            newDate: body.newDate,
            timestamp: new Date().toISOString(),
          },
        })
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Date updated successfully",
        data: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[update-date-api] Unexpected error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
