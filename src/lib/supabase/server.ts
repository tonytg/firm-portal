import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { ensureNodeWebSocket } from "./node-ws";

/**
 * Supabase client for Server Components, Server Actions, and Route Handlers.
 * Reads/writes the session from the request cookies. In a Server Component
 * cookies are read-only, so setAll is a no-op there (the browser client keeps
 * the session fresh); in Server Actions / Route Handlers the writes take.
 */
export async function createServerSupabase() {
  await ensureNodeWebSocket();
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component (read-only cookies) - safe to ignore.
          }
        },
      },
    },
  );
}
