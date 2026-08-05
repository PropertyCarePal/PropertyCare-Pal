import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. Add it to your .env.local file.",
    );
  }

  if (!anonKey) {
    throw new Error(
      "Missing environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY. Add it to your .env.local file.",
    );
  }

  return { url, anonKey };
}

let supabaseClient: SupabaseClient | undefined;

/**
 * Returns a singleton Supabase client configured with the public anon key.
 * Safe to import from Client Components, Server Components, and Route Handlers.
 */
export function getSupabaseClient(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = getSupabaseConfig();

  const isBrowser = typeof window !== "undefined";

  supabaseClient = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: isBrowser,
      persistSession: isBrowser,
      detectSessionInUrl: isBrowser,
    },
  });

  return supabaseClient;
}

/** Shared Supabase client instance. */
export const supabase = getSupabaseClient();
