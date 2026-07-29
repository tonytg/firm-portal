"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";

const tempPassword = () => "Impact-" + crypto.randomBytes(9).toString("base64url");
const back = (q: string) => redirect("/admin/users?" + q);

/** Create a client login (admin only). No public signup exists. */
export async function createClientAccount(formData: FormData) {
  await requireAdmin();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") ?? "").trim();
  const existingClientId = String(formData.get("clientId") ?? "").trim();
  const orgName = String(formData.get("orgName") ?? "").trim();

  if (!email || (!existingClientId && !orgName)) {
    back("error=" + encodeURIComponent("Email and an organization are required."));
  }

  const admin = await createAdminSupabase();

  let clientId = existingClientId;
  if (!clientId) {
    const { data: org, error } = await admin
      .from("clients")
      .insert({ name: orgName })
      .select("id")
      .single();
    if (error) back("error=" + encodeURIComponent(error.message));
    clientId = org!.id;
  }

  const password = tempPassword();
  const { data: created, error: userErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (userErr || !created?.user) {
    back("error=" + encodeURIComponent(userErr?.message ?? "Could not create the user."));
  }

  const { error: profErr } = await admin.from("profiles").insert({
    id: created!.user!.id,
    role: "client",
    client_id: clientId,
    full_name: fullName || orgName,
    email,
  });
  if (profErr) back("error=" + encodeURIComponent(profErr.message));

  revalidatePath("/admin/users");
  back("created=" + encodeURIComponent(`${email}|${password}`));
}

const P1_DELIVERABLES = [
  ["Executive Briefing Pack (dashboard + heat map)", "executive_first"],
  ["Enterprise Risk Assessment Report", "after_walkthrough"],
  ["Appendix A - Escalation & Stabilisation", "after_walkthrough"],
  ["Risk Register - Client Copy", "after_walkthrough"],
] as const;
const P2_DELIVERABLES = [
  ["Governance Executive Brief", "after_validation"],
  ["Governance Architecture Pack", "after_walkthrough"],
  ["KRI Framework", "after_walkthrough"],
  ["Escalation Protocol", "after_walkthrough"],
] as const;

/** Create an engagement for a client (admin only), with default deliverables. */
export async function createEngagement(formData: FormData) {
  await requireAdmin();
  const clientId = String(formData.get("clientId") ?? "").trim();
  const pillar = String(formData.get("pillar") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const industry = String(formData.get("industry") ?? "").trim() || null;
  const sector = String(formData.get("sector") ?? "").trim() || null;

  if (!clientId || (pillar !== "pillar_1" && pillar !== "pillar_2") || !title) {
    back("error=" + encodeURIComponent("Client, pillar, and title are required."));
  }

  const admin = await createAdminSupabase();
  const id = "eng-" + crypto.randomBytes(4).toString("hex");

  const { error } = await admin.from("engagements").insert({
    id,
    client_id: clientId,
    pillar,
    title,
    advisor_name: "IMPACT - Anthony El Hachem",
    industry,
    sector,
    loe_signed: false,
    phase1_payment_received: false,
    final_payment_received: false,
    activation_override: false,
  });
  if (error) back("error=" + encodeURIComponent(error.message));

  const defs = pillar === "pillar_1" ? P1_DELIVERABLES : P2_DELIVERABLES;
  await admin.from("deliverables").insert(
    defs.map(([dtitle, gate], i) => ({
      id: `${id}-d${i + 1}`,
      engagement_id: id,
      title: dtitle,
      format: "PDF",
      release_gate: gate,
      released: false,
    })),
  );

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
  back("ok=" + encodeURIComponent("Engagement created."));
}
