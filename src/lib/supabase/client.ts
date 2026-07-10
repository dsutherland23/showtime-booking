import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Only create a real client if credentials are real (non-placeholder)
export const isSupabaseReady = !!(
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('your-project-ref') &&
  !supabaseAnonKey.includes('your-anon-key')
);

// Singleton — one client per browser context
let browserClient: SupabaseClient | null = null;

/**
 * Returns the shared Supabase browser client, or null if credentials are not configured.
 * Always check isSupabaseReady before calling this in server/build contexts.
 */
export function createClient(): SupabaseClient | null {
  if (!isSupabaseReady) return null;
  if (browserClient) return browserClient;
  browserClient = createBrowserClient(supabaseUrl, supabaseAnonKey);
  return browserClient;
}
