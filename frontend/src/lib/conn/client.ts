import { createBrowserClient } from '@supabase/ssr';

// Use environment variables for security
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required Supabase environment variables');
}

/**
 * Create a Supabase client for browser/client-side operations
 * This is compatible with the expected createClient() interface
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseKey);
}

// Export the default browser client for backward compatibility
export const supabase = createBrowserClient(supabaseUrl, supabaseKey);
