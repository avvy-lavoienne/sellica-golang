import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Using server-only supabase instance with service_role key to bypass RLS
// Note: In a real app, protect this key carefully in environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://yrssspoimsxpibcbeaca.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlyc3NzcG9pbXN4cGliY2JlYWNhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0NDQ1MDQ3MiwiZXhwIjoyMDYwMDI2NDcyfQ.HFlpna-uA5wyBRaZsCv1W1zTSH7buNz421KZ1NI4hW0'; // Replace with actual service role key

// Create a Supabase client with admin privileges
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

export async function POST(request: Request) {
  try {
    const { email, name, password, position, nip, nik } = await request.json();

    // Validate inputs
    if (!email || !name || !password) {
      return NextResponse.json(
        { error: 'Email, name, and password are required' },
        { status: 400 }
      );
    }

    // First, check if user already exists in pending_users
    const { data: existingUser, error: checkError } = await supabaseAdmin
      .from('pending_users')
      .select('email')
      .eq('email', email)
      .maybeSingle();

    if (checkError) {
      console.error('Error checking existing user:', checkError);
      return NextResponse.json(
        { error: 'Error during registration process' },
        { status: 500 }
      );
    }

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email sudah terdaftar dalam sistem' },
        { status: 409 }
      );
    }

    // Add the user to pending_users table with additional profile information
    const { data: pendingUserData, error: pendingUserError } = await supabaseAdmin
      .from('pending_users')
      .insert({
        email: email,
        name: name,
        password: password,
        requested_at: new Date().toISOString(),
        status: 'pending',
        user_metadata: {
          position: position || null,
          nip: nip || null,
          nik: nik || null
        }
      })
      .select();

    if (pendingUserError) {
      console.error('Error creating pending user:', pendingUserError);
      return NextResponse.json(
        { error: pendingUserError.message || 'Error during registration' },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json(
      { message: 'Registration request submitted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error during registration:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}