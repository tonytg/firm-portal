import "server-only";
import { createClient } from "@supabase/supabase-js";
import { ensureNodeWebSocket } from "./node-ws";

/**
 * Service-role client: full access, bypasses RLS. Server-only. Used strictly
 * for admin operations (creating client accounts via the auth admin API).
 * Never import this into client code.
 */
export async function createAdminSupabase() {
  await ensureNodeWebSocket();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
