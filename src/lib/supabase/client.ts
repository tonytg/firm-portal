import { createBrowserClient } from "@supabase/ssr";

/** Supabase client for Client Components (browser has a global WebSocket). */
export function createBrowserSupabase() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
