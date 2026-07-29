// Verify admin account creation + multi-tenant isolation. Run:
//   node --env-file=.env.local scripts/check-admin.mjs
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const admin = createClient(url, service, { auth: { persistSession: false } });

// 1. admin creates a new org + client account (what createClientAccount does)
const { data: org } = await admin.from("clients").insert({ name: "__TEST ORG__", sector: "Other" }).select("id").single();
const email = `test-${Date.now()}@example.com`;
const password = "Impact-Test-123456";
const { data: created, error: cErr } = await admin.auth.admin.createUser({ email, password, email_confirm: true });
if (cErr) { console.log("createUser FAILED:", cErr.message); process.exit(1); }
await admin.from("profiles").insert({ id: created.user.id, role: "client", client_id: org.id, full_name: "Test Client", email });
console.log("admin created account:", email, "-> org", org.id);

// 2. new client logs in and must see ONLY their own (empty) org, not Cedar's data
const c = createClient(url, anon, { auth: { persistSession: false } });
const { error: loginErr } = await c.auth.signInWithPassword({ email, password });
console.log("new client can log in :", loginErr ? "FAIL " + loginErr.message : "ok");
const { count: eng } = await c.from("engagements").select("*", { count: "exact", head: true });
const { count: cli } = await c.from("clients").select("*", { count: "exact", head: true });
console.log("engagements visible   :", eng, eng === 0 ? "ok (isolated)" : "SECURITY FAIL - sees another org");
console.log("clients visible       :", cli, cli === 1 ? "ok (own org only)" : "SECURITY FAIL");

// 3. cleanup
await admin.from("profiles").delete().eq("id", created.user.id);
await admin.auth.admin.deleteUser(created.user.id);
await admin.from("clients").delete().eq("id", org.id);
console.log("cleaned up test account + org");
