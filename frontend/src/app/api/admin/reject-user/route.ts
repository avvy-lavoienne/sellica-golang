import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create admin client for server-side operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: 'ID pengguna tidak ditemukan' },
        { status: 400 }
      );
    }

    // Delete the pending user record
    const { error: deleteError } = await supabaseAdmin
      .from("pending_users")
      .delete()
      .eq("id", userId);

    if (deleteError) {
      console.error('Delete pending user error:', deleteError);
      return NextResponse.json(
        { error: `Gagal menolak pengguna: ${deleteError.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil ditolak'
    });

  } catch (error) {
    console.error('Reject user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
