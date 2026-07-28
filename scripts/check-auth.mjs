// Verify real logins + RLS isolation. Run:
//   node --env-file=.env.local scripts/check-auth.mjs
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
import { readFileSync } from "node:fs";
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const creds = readFileSync(".seed-credentials.txt", "utf8");
const pw = (frag) => {
  const line = creds
    .split("\n")
    .find((l) => l.includes(frag) && l.includes(">: ") && !l.includes("already exists"));
  return line ? line.split(": ").pop().trim() : null;
};

async function test(label, email, password) {
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { data: auth, error } = await sb.auth.signInWithPassword({ email, password });
  if (error) {
    console.log(`  x ${label}: sign-in failed - ${error.message}`);
    return;
  }
  const { data: prof } = await sb.from("profiles").select("role").eq("id", auth.user.id).single();
  const { count: eng } = await sb.from("engagements").select("*", { count: "exact", head: true });
  const { count: risk } = await sb.from("risk_items").select("*", { count: "exact", head: true });
  console.log(`  ok ${label}: role=${prof?.role}  engagements_visible=${eng}  risk_items_visible=${risk}`);
}

console.log("Login + RLS isolation:");
await test("admin ", process.env.ADMIN_EMAIL || "anthony@elhachemlaw.com", pw("anthony@elhachemlaw.com"));
await test("client", "cedar.demo@example.com", pw("cedar.demo@example.com"));
console.log("\nExpected: admin sees 2 engagements + 2 risk_items; client sees 2 engagements + 0 risk_items.");
