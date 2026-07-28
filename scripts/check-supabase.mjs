// Safe connection + schema check. Run:
//   node --env-file=.env.local scripts/check-supabase.mjs
// Prints only masked env info and table checks; never secret values.
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
// Node 20 has no global WebSocket; supabase-js initializes a realtime client
// eagerly. We never use realtime in scripts, so a shim satisfies the check.
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const adminEmail = process.env.ADMIN_EMAIL;

const mask = (v) => (v ? `set (${v.length} chars)` : "MISSING");

console.log("Environment:");
console.log("  NEXT_PUBLIC_SUPABASE_URL      :", url || "MISSING");
console.log("  NEXT_PUBLIC_SUPABASE_ANON_KEY :", mask(anon));
console.log("  SUPABASE_SERVICE_ROLE_KEY     :", mask(service));
console.log("  ADMIN_EMAIL                   :", adminEmail || "MISSING");
console.log("");

if (!url || !anon || !service) {
  console.error("Missing required env vars. Fix the names/values in .env.local and re-run.");
  process.exit(1);
}

const admin = createClient(url, service, { auth: { persistSession: false } });

const tables = [
  "clients", "profiles", "engagements", "stage_states", "meetings",
  "deliverables", "risk_items", "questionnaire_responses", "questionnaire_submissions",
];

let ok = true;
console.log("Schema (via service role):");
for (const t of tables) {
  const { count, error } = await admin.from(t).select("*", { count: "exact", head: true });
  if (error) {
    console.log(`  x ${t}: ${error.message}`);
    ok = false;
  } else {
    console.log(`  ok ${t}: ${count ?? 0} rows`);
  }
}

console.log("");
const { data: users, error: uerr } = await admin.auth.admin.listUsers();
if (uerr) {
  console.log("  x auth admin API:", uerr.message, "(is SUPABASE_SERVICE_ROLE_KEY the service_role/secret key?)");
  ok = false;
} else {
  console.log(`  ok auth admin API: ${users.users.length} existing user(s)`);
}

console.log(ok ? "\nOK: connection + schema verified." : "\nPROBLEM: see the x lines above.");
process.exit(ok ? 0 : 1);
