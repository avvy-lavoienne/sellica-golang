import { createBrowserClient } from '@supabase/ssr';

// Use environment variables for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

// Create browser client with proper cookie handling for SSR
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);