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

    const { user } = await request.json();

    if (!user || !user.email || !user.password || !user.name) {
      return NextResponse.json(
        { error: 'Data pengguna tidak lengkap' },
        { status: 400 }
      );
    }

    // 1. Create the actual user in Supabase Auth using the admin client
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        name: user.name,
        position: user.user_metadata?.position,
        nip: user.user_metadata?.nip,
        nik: user.user_metadata?.nik,
      },
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: `Gagal membuat akun: ${authError.message}` },
        { status: 400 }
      );
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Gagal membuat pengguna' },
        { status: 400 }
      );
    }

    // 2. Create a profile entry for the user
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        name: user.name,
        position: user.user_metadata?.position || null,
        nip: user.user_metadata?.nip || null,
        avatar_url: null,
        nik: user.user_metadata?.nik || null,
        role: "user", // Explicitly set as regular user
        email: user.email,
      })
      .select();

    if (profileError) {
      console.error('Profile error:', profileError);
      // If profile creation fails, we should clean up the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { error: `Gagal membuat profil: ${profileError.message}` },
        { status: 400 }
      );
    }

    // 3. Delete the pending user record
    const { error: deleteError } = await supabaseAdmin
      .from("pending_users")
      .delete()
      .eq("id", user.id);

    if (deleteError) {
      console.error('Delete pending user error:', deleteError);
      // Don't fail the whole operation if this fails
    }

    return NextResponse.json({
      success: true,
      message: 'Pengguna berhasil disetujui dan akun telah dibuat',
      user: {
        id: authData.user.id,
        email: authData.user.email,
        name: user.name
      }
    });

  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan internal server' },
      { status: 500 }
    );
  }
}
