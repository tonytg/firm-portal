// Seed the admin account, a demo client login, and the Cedar demo data.
// Idempotent: safe to re-run. Run:
//   ADMIN_EMAIL=anthony@elhachemlaw.com node --env-file=.env.local scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";
import WebSocketImpl from "ws";
import crypto from "node:crypto";
import { writeFileSync } from "node:fs";

if (!globalThis.WebSocket) globalThis.WebSocket = WebSocketImpl;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const service = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "anthony@elhachemlaw.com";
const CLIENT_EMAIL = process.env.CLIENT_EMAIL || "cedar.demo@example.com";

if (!url || !service) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const db = createClient(url, service, { auth: { persistSession: false } });
const CEDAR_ID = "11111111-1111-1111-1111-111111111111";
const tempPassword = () => "Impact-" + crypto.randomBytes(9).toString("base64url");
const credentials = [];

function die(label, error) {
  if (error) {
    console.error(`FAILED at ${label}:`, error.message ?? error);
    process.exit(1);
  }
}

async function ensureUser(email, fullName) {
  const { data: list, error } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  die("listUsers", error);
  const existing = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    credentials.push(`${fullName} <${email}>: already exists (password unchanged)`);
    return existing.id;
  }
  const password = tempPassword();
  const { data, error: cErr } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  die(`createUser ${email}`, cErr);
  credentials.push(`${fullName} <${email}>: ${password}`);
  return data.user.id;
}

// ── Auth users + profiles ──────────────────────────────────────────────────
const adminId = await ensureUser(ADMIN_EMAIL, "Admin (Anthony El Hachem)");
const clientId = await ensureUser(CLIENT_EMAIL, "Cedar Hospitality (demo client)");

die("clients upsert", (await db.from("clients").upsert(
  { id: CEDAR_ID, name: "Cedar Hospitality Group", industry: "Hospitality", sector: "F&B" },
  { onConflict: "id" },
)).error);

die("profiles upsert", (await db.from("profiles").upsert([
  { id: adminId, role: "admin", client_id: null, full_name: "Anthony El Hachem", email: ADMIN_EMAIL },
  { id: clientId, role: "client", client_id: CEDAR_ID, full_name: "Cedar Hospitality Group", email: CLIENT_EMAIL },
], { onConflict: "id" })).error);

// ── Engagements ────────────────────────────────────────────────────────────
die("engagements upsert", (await db.from("engagements").upsert([
  {
    id: "eng-p1-acme", client_id: CEDAR_ID, pillar: "pillar_1",
    title: "Risk Assessment - Pillar 1", advisor_name: "IMPACT - Anthony El Hachem",
    industry: "Hospitality", sector: "F&B",
    loe_signed: true, phase1_payment_received: true, final_payment_received: false,
    activation_override: false, activated_at: "2026-05-02T09:00:00Z",
  },
  {
    id: "eng-p2-acme", client_id: CEDAR_ID, pillar: "pillar_2",
    title: "Governance Framework - Pillar 2", advisor_name: "IMPACT - Anthony El Hachem",
    industry: "Hospitality", sector: "F&B",
    loe_signed: true, phase1_payment_received: true, final_payment_received: false,
    activation_override: false, activated_at: null,
  },
], { onConflict: "id" })).error);

// ── Stage states ───────────────────────────────────────────────────────────
const stageRows = [
  ["eng-p1-acme", "activation", "completed", null, "2026-05-02T09:00:00Z"],
  ["eng-p1-acme", "intake", "completed", null, "2026-05-10T12:00:00Z"],
  ["eng-p1-acme", "diagnosis", "in_progress", "Red-flag mapping underway", null],
  ["eng-p1-acme", "risk_workshop", "scheduled", null, null],
  ["eng-p1-acme", "build", "not_started", null, null],
  ["eng-p1-acme", "calibration", "not_started", null, null],
  ["eng-p1-acme", "output", "not_started", null, null],
  ["eng-p1-acme", "walkthrough", "not_started", null, null],
  ["eng-p1-acme", "board_delivery", "not_started", null, null],
  ["eng-p2-acme", "setup", "completed", null, null],
  ["eng-p2-acme", "questionnaire", "not_started", null, null],
  ["eng-p2-acme", "workshop", "not_started", null, null],
  ["eng-p2-acme", "diagnostic_exercise", "not_started", null, null],
  ["eng-p2-acme", "architecture_build", "not_started", null, null],
  ["eng-p2-acme", "validation", "not_started", null, null],
  ["eng-p2-acme", "controlled_release", "not_started", null, null],
].map(([engagement_id, key, status, internal_note, completed_at]) => ({
  engagement_id, key, status, internal_note, completed_at,
}));
die("stage_states upsert", (await db.from("stage_states").upsert(stageRows, { onConflict: "engagement_id,key" })).error);

// ── Meetings (no stable id: replace) ───────────────────────────────────────
die("meetings delete", (await db.from("meetings").delete().in("engagement_id", ["eng-p1-acme", "eng-p2-acme"])).error);
die("meetings insert", (await db.from("meetings").insert([
  {
    engagement_id: "eng-p1-acme", stage_key: "risk_workshop", title: "Risk Identification Workshop",
    session_type: "In-person", scheduled_at: "2026-06-20T10:00:00Z", location: "Client HQ, Beirut",
    duration_minutes: 180, participants: [{ name: "Cedar CEO", role: "CEO / Executive" }],
    agenda: ["Review Intake", "Identify risks", "Challenge controls", "Confirm exposures"],
    attendance_confirmed: false, sign_off_uploaded: false,
  },
  {
    engagement_id: "eng-p1-acme", stage_key: "calibration", title: "Executive Calibration Session",
    session_type: "In-person", scheduled_at: "2026-07-05T10:00:00Z", location: "Client HQ, Beirut",
    duration_minutes: 120, participants: [{ name: "Cedar CEO", role: "CEO" }],
    agenda: ["Executive calibration", "Validate findings"],
    attendance_confirmed: false, sign_off_uploaded: false,
  },
])).error);

// ── Deliverables ───────────────────────────────────────────────────────────
die("deliverables upsert", (await db.from("deliverables").upsert([
  { id: "d1", engagement_id: "eng-p1-acme", title: "Executive Briefing Pack (dashboard + heat map)", format: "PDF", release_gate: "executive_first", released: false },
  { id: "d2", engagement_id: "eng-p1-acme", title: "Enterprise Risk Assessment Report", format: "PDF", release_gate: "after_walkthrough", released: false },
  { id: "d3", engagement_id: "eng-p1-acme", title: "Appendix A - Escalation & Stabilisation", format: "PDF", release_gate: "after_walkthrough", released: false },
  { id: "d4", engagement_id: "eng-p1-acme", title: "Risk Register - Client Copy", format: "PDF", release_gate: "after_walkthrough", released: false },
  { id: "g1", engagement_id: "eng-p2-acme", title: "Governance Executive Brief", format: "PDF", release_gate: "after_validation", released: false },
  { id: "g2", engagement_id: "eng-p2-acme", title: "Governance Architecture Pack", format: "PDF", release_gate: "after_walkthrough", released: false },
  { id: "g3", engagement_id: "eng-p2-acme", title: "KRI Framework", format: "PDF", release_gate: "after_walkthrough", released: false },
  { id: "g4", engagement_id: "eng-p2-acme", title: "Escalation Protocol", format: "PDF", release_gate: "after_walkthrough", released: false },
], { onConflict: "id" })).error);

// ── Risk items (advisor-only; no stable id: replace) ───────────────────────
die("risk_items delete", (await db.from("risk_items").delete().eq("engagement_id", "eng-p1-acme")).error);
die("risk_items insert", (await db.from("risk_items").insert([
  { engagement_id: "eng-p1-acme", cause: "Single supplier for core perishables", event: "Supplier insolvency / delivery failure", impact: "Service disruption across all venues; revenue loss" },
  { engagement_id: "eng-p1-acme", cause: "No documented escalation authority above GM level", event: "Major incident requires board-level decision", impact: "Delayed response; reputational and regulatory exposure" },
])).error);

// ── Write credentials to a gitignored file ─────────────────────────────────
const out = [
  "IMPACT Portal - seed credentials",
  "Generated: " + new Date().toISOString(),
  "Change these after first login. This file is gitignored.",
  "",
  ...credentials,
  "",
].join("\n");
writeFileSync(".seed-credentials.txt", out);

console.log("Seed complete.");
console.log("  Admin:  " + ADMIN_EMAIL);
console.log("  Client: " + CLIENT_EMAIL + " (demo)");
console.log("  Credentials written to .seed-credentials.txt (gitignored).");
