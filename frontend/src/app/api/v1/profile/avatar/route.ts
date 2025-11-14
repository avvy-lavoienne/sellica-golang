import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key (server-side only)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Debug: Log environment variables on first import (but only first time)
if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("[AVATAR API] Missing Supabase configuration:")
  if (!supabaseUrl) console.warn("  - NEXT_PUBLIC_SUPABASE_URL is missing")
  if (!supabaseServiceKey) console.warn("  - SUPABASE_SERVICE_ROLE_KEY is missing")
}

const supabaseAdmin = createClient(
  supabaseUrl || "",
  supabaseServiceKey || ""
)

/**
 * POST /api/v1/profile/avatar
 * Upload avatar - uses service role key to bypass RLS
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - missing or invalid token" },
        { status: 401 }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.substring(7);
    let userId: string;

    try {
      // Basic JWT verification - check if token is valid format
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }
      
      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString()
      );
      userId = payload.sub;

      if (!userId) {
        throw new Error("No user ID in token");
      }
    } catch (error) {
      return NextResponse.json(
        { message: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File;

    if (!file) {
      return NextResponse.json(
        { message: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { message: "File must be an image" },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return NextResponse.json(
        { message: "File size must be less than 2MB" },
        { status: 400 }
      );
    }

    // Get file extension
    const fileExt = file.name.split(".").pop()?.toLowerCase();
    if (!fileExt || !["jpg", "jpeg", "png"].includes(fileExt)) {
      return NextResponse.json(
        { message: "Only JPG, JPEG, and PNG files are allowed" },
        { status: 400 }
      );
    }

    // Generate filename with timestamp
    const fileName = `${userId}-${Date.now()}.${fileExt}`;
    const buffer = await file.arrayBuffer();

    // Upload using service role (bypasses RLS)
    const { data, error: uploadError } = await supabaseAdmin.storage
      .from("avatars")
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error("[AVATAR API] Upload error:", {
        message: uploadError.message,
        status: (uploadError as any).status,
        statusCode: (uploadError as any).statusCode,
        details: uploadError,
      });
      return NextResponse.json(
        { message: "Failed to upload file", error: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("avatars").getPublicUrl(fileName);

    // Update profile in database with service role (bypasses RLS)
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { avatar_url: publicUrl },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/profile/avatar
 * Delete avatar - uses service role key to bypass RLS
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json(
        { message: "Unauthorized - missing or invalid token" },
        { status: 401 }
      );
    }

    // Extract and verify JWT token
    const token = authHeader.substring(7);
    let userId: string;

    try {
      // Basic JWT verification - check if token is valid format
      const parts = token.split(".");
      if (parts.length !== 3) {
        throw new Error("Invalid token format");
      }

      // Decode the payload (second part)
      const payload = JSON.parse(
        Buffer.from(parts[1], "base64").toString()
      );
      userId = payload.sub;

      if (!userId) {
        throw new Error("No user ID in token");
      }
    } catch (error) {
      return NextResponse.json(
        { message: "Unauthorized - invalid token" },
        { status: 401 }
      );
    }

    // Get current profile to find avatar URL
    const { data: profile, error: fetchError } = await supabaseAdmin
      .from("profiles")
      .select("avatar_url")
      .eq("id", userId)
      .single();

    if (fetchError || !profile?.avatar_url) {
      return NextResponse.json(
        { message: "Profile not found" },
        { status: 404 }
      );
    }

    // Extract filename from URL
    const fileName = profile.avatar_url.split("/").pop()?.split("?")[0];
    if (!fileName) {
      return NextResponse.json(
        { message: "Invalid avatar URL" },
        { status: 400 }
      );
    }

    // Delete file from storage using service role
    const { error: deleteError } = await supabaseAdmin.storage
      .from("avatars")
      .remove([fileName]);

    if (deleteError) {
      console.error("Delete error:", deleteError);
      return NextResponse.json(
        { message: "Failed to delete file" },
        { status: 500 }
      );
    }

    // Update profile to remove avatar_url using service role
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        avatar_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Update error:", updateError);
      return NextResponse.json(
        { message: "Failed to update profile" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Avatar deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}
