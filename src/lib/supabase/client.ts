import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Return a mock or handle missing keys during build
    console.warn('[Supabase Client] Missing environment variables. This is expected during build time if not provided.');
    return {} as any;
  }

  return createBrowserClient(
    supabaseUrl,
    supabaseAnonKey
  );
}
