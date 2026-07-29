// Verify storage upload + signed URL. Run:
//   node --env-file=.env.local scripts/check-storage.mjs
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } },
);

// Deliverable PDF: upload -> file_path -> signed URL -> fetch
const path = "eng-p1-acme/d1.pdf";
const pdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]); // %PDF-1.4
const up = await admin.storage.from("deliverables").upload(path, pdf, { contentType: "application/pdf", upsert: true });
console.log("deliverable upload      :", up.error ? "FAIL " + up.error.message : "ok");
const signed = await admin.storage.from("deliverables").createSignedUrl(path, 60);
const res = signed.data ? await fetch(signed.data.signedUrl) : null;
console.log("deliverable signed URL  :", res?.ok ? `ok (HTTP ${res.status})` : "FAIL");
await admin.storage.from("deliverables").remove([path]);

// Evidence: needs the evidence_files table (migration 0002)
try {
  const epath = "eng-p1-acme/intake/__test__/x.txt";
  await admin.storage.from("evidence").upload(epath, new Uint8Array([104, 105]), { contentType: "text/plain", upsert: true });
  const ins = await admin.from("evidence_files").insert({ engagement_id: "eng-p1-acme", stage: "intake", question_id: "__test__", path: epath, filename: "x.txt" });
  if (ins.error) throw ins.error;
  console.log("evidence table + upload :", "ok");
  await admin.from("evidence_files").delete().eq("question_id", "__test__");
  await admin.storage.from("evidence").remove([epath]);
} catch (e) {
  console.log("evidence table + upload :", "NEEDS migration 0002 (" + e.message + ")");
}
