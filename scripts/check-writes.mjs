// Verify write paths + RLS enforcement. Run:
//   node --env-file=.env.local scripts/check-writes.mjs
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
import { readFileSync } from "node:fs";
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const creds = readFileSync(".seed-credentials.txt", "utf8");
const pw = (frag) => {
  const line = creds.split("\n").find((l) => l.includes(frag) && l.includes(">: "));
  return line ? line.split(": ").pop().trim() : null;
};
const login = async (email, password) => {
  const sb = createClient(url, anon, { auth: { persistSession: false } });
  const { error } = await sb.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`${email}: ${error.message}`);
  return sb;
};
const ENG = "eng-p1-acme";

const client = await login("cedar.demo@example.com", pw("cedar.demo@example.com"));
const admin = await login(process.env.ADMIN_EMAIL || "anthony@elhachemlaw.com", pw("anthony@elhachemlaw.com"));

console.log("Client writes (own org):");
// 1. save a response
await client.from("questionnaire_responses").upsert(
  { engagement_id: ENG, stage: "intake", question_id: "__test__", answer: "hello", updated_at: new Date().toISOString() },
  { onConflict: "engagement_id,stage,question_id" },
);
const saved = (await client.from("questionnaire_responses").select("answer").eq("engagement_id", ENG).eq("stage", "intake").eq("question_id", "__test__").maybeSingle()).data;
console.log("  save response          :", saved?.answer === "hello" ? "ok (persisted)" : "FAIL");

// 2. confirm attendance via RPC
const mtg = (await client.from("meetings").select("id").eq("engagement_id", ENG).limit(1).single()).data;
await client.rpc("confirm_attendance", { meeting_id: mtg.id, confirmed: true });
const att = (await client.from("meetings").select("attendance_confirmed").eq("id", mtg.id).single()).data;
console.log("  confirm attendance RPC :", att?.attendance_confirmed === true ? "ok (persisted)" : "FAIL");

console.log("\nClient must NOT write advisor-controlled fields (RLS):");
// 3. try to flip activation_override (admin-only)
const before = (await client.from("engagements").select("activation_override").eq("id", ENG).single()).data.activation_override;
await client.from("engagements").update({ activation_override: !before }).eq("id", ENG);
const after = (await client.from("engagements").select("activation_override").eq("id", ENG).single()).data.activation_override;
console.log("  change activation flag :", before === after ? "ok (blocked, unchanged)" : "SECURITY FAIL (changed!)");
// 4. try to schedule a meeting (admin-only)
await client.from("meetings").update({ scheduled_at: new Date().toISOString() }).eq("id", mtg.id);

console.log("\nAdmin writes:");
const r = await admin.from("stage_states").upsert({ engagement_id: ENG, key: "build", status: "in_progress", completed_at: null }, { onConflict: "engagement_id,key" });
console.log("  set stage status       :", r.error ? "FAIL " + r.error.message : "ok");

// cleanup
await client.from("questionnaire_responses").delete().eq("engagement_id", ENG).eq("stage", "intake").eq("question_id", "__test__");
await client.rpc("confirm_attendance", { meeting_id: mtg.id, confirmed: false });
await admin.from("stage_states").upsert({ engagement_id: ENG, key: "build", status: "not_started", completed_at: null }, { onConflict: "engagement_id,key" });
console.log("\n(cleaned up test rows)");
