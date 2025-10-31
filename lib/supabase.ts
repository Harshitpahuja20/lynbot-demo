import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

// Client instances (lazy initialization)
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn('Supabase environment variables not found. Please configure Supabase integration.');
      // Return a mock client that won't cause errors
      return {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
        })
      } as any;
    }

    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  
  return _supabase;
}

export function getSupabaseAdminClient(): SupabaseClient {
  if (!_supabaseAdmin) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceRoleKey) {
      console.warn('Supabase admin environment variables not found. Please configure Supabase integration.');
      // Return a mock client that won't cause errors
      return {
        from: () => ({
          select: () => Promise.resolve({ data: [], error: null }),
          insert: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          update: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
          delete: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
        })
      } as any;
    }

    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  
  return _supabaseAdmin;
}

// Export lazy getters for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseClient()[prop as keyof SupabaseClient];
  }
});

export const supabaseAdmin = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseAdminClient()[prop as keyof SupabaseClient];
  }
});

// Export the client directly for compatibility with utils/supabase.ts
export { getSupabaseClient as createClient };