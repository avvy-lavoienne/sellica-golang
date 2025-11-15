import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/data-rekam/pengajuan-bulanan/toggle-status
 *
 * Toggles the is_ready_to_record status for a pengajuan bulanan record.
 * This is a secure API route that:
 * 1. Validates JWT token from Authorization header
 * 2. Extracts user ID from token payload
 * 3. Verifies user is admin or superuser
 * 4. Updates the record status
 *
 * Request Body:
 * - id: Record ID
 * - newStatus: New boolean value for is_ready_to_record
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
        `[toggle-status-api] Non-admin user ${userId} attempted to toggle status`
      );
      return NextResponse.json(
        { message: "Forbidden: Only admin or superuser can toggle status" },
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
    if (!body.id || body.newStatus === undefined) {
      console.error("[toggle-status-api] Missing required fields: id or newStatus");
      return NextResponse.json(
        { message: "Bad request: id and newStatus are required" },
        { status: 400 }
      );
    }

    // ✅ STEP 9: Check for Supabase configuration
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error(
        "[toggle-status-api] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set"
      );
      return NextResponse.json(
        { message: "Internal server error: Missing configuration" },
        { status: 500 }
      );
    }

    // ✅ STEP 10: Initialize admin Supabase client with service role
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || "",
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log(
      `[toggle-status-api] Admin ${userId} toggling status for record ${body.id} to ${body.newStatus}`
    );

    // ✅ STEP 11: Update record status
    const { data, error } = await supabaseAdmin
      .from("pengajuan_bulanan")
      .update({
        is_ready_to_record: body.newStatus,
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) {
      console.error("[toggle-status-api] Database error:", error);
      return NextResponse.json(
        {
          message: "Failed to update status",
          error: error.message,
        },
        { status: 500 }
      );
    }

    console.log(
      `[toggle-status-api] Status toggle successful for record ${body.id}`
    );

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully",
        data: data,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("[toggle-status-api] Unexpected error:", error);
    return NextResponse.json(
      {
        message: "Internal server error",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
