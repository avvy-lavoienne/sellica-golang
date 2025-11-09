import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug: Log environment variables on first import (but only first time)
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[PROFILE API] Missing Supabase configuration:")
  if (!supabaseUrl) console.warn("  - NEXT_PUBLIC_SUPABASE_URL is missing")
  if (!supabaseServiceKey) console.warn("  - SUPABASE_SERVICE_ROLE_KEY is missing")
}

const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
)

/**
 * PATCH /api/v1/profile
 * Update profile - uses service role key to bypass RLS
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - missing or invalid token" },
        { status: 401 }
      )
    }

    // Extract and verify JWT token
    const token = authHeader.substring(7)
    let userId: string

    try {
      // Basic JWT verification - check if token is valid format
      const parts = token.split(".")
      if (parts.length !== 3) {
        throw new Error("Invalid token format")
      }

      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString()
      )
      userId = payload.sub

      if (!userId) {
        throw new Error("No user ID in token")
      }
    } catch (error) {
      return NextResponse.json(
        { message: "Unauthorized - invalid token" },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { name, nip, position, nik } = body

    // Validate required fields
    if (!name || !position) {
      return NextResponse.json(
        { message: "Nama dan jabatan harus diisi" },
        { status: 400 }
      )
    }

    // Validate field values
    const errors: Record<string, string> = {}

    if (name && (typeof name !== "string" || name.trim().length < 2)) {
      errors.name = "Nama minimal 2 karakter"
    }

    if (position && (typeof position !== "string" || position.trim().length < 2)) {
      errors.position = "Jabatan minimal 2 karakter"
    }

    if (nik) {
      if (typeof nik !== "string" || nik.length !== 16 || !/^\d{16}$/.test(nik)) {
        errors.nik = "NIK harus 16 digit"
      }
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json(
        { message: "Validasi gagal", errors },
        { status: 400 }
      )
    }

    // Update profile using service role (bypasses RLS)
    const { data, error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        name: name.trim(),
        nip: nip ? nip.trim() : null,
        position: position.trim(),
        nik: nik ? nik.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single()

    if (updateError) {
      console.error("[PROFILE API] Update error:", {
        message: updateError.message,
        details: updateError,
      })
      return NextResponse.json(
        { message: "Gagal memperbarui profil", error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        message: "Profil berhasil diperbarui",
        profile: data 
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[PROFILE API] Unexpected error:", error)
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    )
  }
}
