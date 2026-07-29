"use server";

import { revalidatePath } from "next/cache";
import { createServerSupabase } from "@/lib/supabase/server";
import { requireAdmin, requireUser } from "@/lib/auth";

/**
 * Write actions. Every action verifies the session; RLS enforces authorization
 * in the database (clients can only write their own org's rows; advisor-only
 * fields are admin-only). Admin-only actions also requireAdmin() for a clean
 * error and defense in depth.
 */

// ── Questionnaire (client or admin, own org via RLS) ───────────────────────
export async function saveResponses(
  engagementId: string,
  stage: string,
  answers: Record<string, string>,
): Promise<{ savedAt: string }> {
  await requireUser();
  const supabase = await createServerSupabase();
  const now = new Date().toISOString();
  const rows = Object.entries(answers).map(([question_id, answer]) => ({
    engagement_id: engagementId,
    stage,
    question_id,
    answer,
    updated_at: now,
  }));
  if (rows.length > 0) {
    const { error } = await supabase
      .from("questionnaire_responses")
      .upsert(rows, { onConflict: "engagement_id,stage,question_id" });
    if (error) throw new Error(error.message);
  }
  return { savedAt: now };
}

export async function submitQuestionnaire(
  engagementId: string,
  stage: string,
): Promise<{ submittedAt: string }> {
  await requireUser();
  const supabase = await createServerSupabase();
  const submittedAt = new Date().toISOString();
  const { error } = await supabase
    .from("questionnaire_submissions")
    .upsert(
      { engagement_id: engagementId, stage, submitted_at: submittedAt },
      { onConflict: "engagement_id,stage" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/${stage}`);
  return { submittedAt };
}

export async function reopenSubmission(engagementId: string, stage: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("questionnaire_submissions")
    .delete()
    .eq("engagement_id", engagementId)
    .eq("stage", stage);
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/${stage}`);
}

// ── Meetings ───────────────────────────────────────────────────────────────
export async function confirmAttendance(
  meetingId: string,
  confirmed: boolean,
  engagementId: string,
  stage: string,
) {
  await requireUser();
  const supabase = await createServerSupabase();
  const { error } = await supabase.rpc("confirm_attendance", {
    meeting_id: meetingId,
    confirmed,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/${stage}`);
}

export async function setMeetingSchedule(
  meetingId: string,
  scheduledAt: string | null,
  engagementId: string,
  stage: string,
) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("meetings")
    .update({ scheduled_at: scheduledAt })
    .eq("id", meetingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/${stage}`);
}

export async function setSignOff(
  meetingId: string,
  uploaded: boolean,
  engagementId: string,
  stage: string,
) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("meetings")
    .update({ sign_off_uploaded: uploaded })
    .eq("id", meetingId);
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/${stage}`);
}

// ── Advisor: engagement flags / stage status / deliverable release ─────────
export type EngagementFlag =
  | "loe_signed"
  | "phase1_payment_received"
  | "final_payment_received"
  | "activation_override";

export async function setEngagementFlag(
  engagementId: string,
  field: EngagementFlag,
  value: boolean,
) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const patch: Record<string, boolean | string | null> = { [field]: value };
  const { error } = await supabase
    .from("engagements")
    .update(patch)
    .eq("id", engagementId);
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/manage`);
  revalidatePath("/dashboard");
}

export async function setStageStatus(
  engagementId: string,
  key: string,
  status: string,
) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const completed_at = status === "completed" ? new Date().toISOString() : null;
  const { error } = await supabase
    .from("stage_states")
    .upsert(
      { engagement_id: engagementId, key, status, completed_at },
      { onConflict: "engagement_id,key" },
    );
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/manage`);
  revalidatePath("/dashboard");
}

export async function setDeliverableReleased(
  deliverableId: string,
  released: boolean,
  engagementId: string,
) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("deliverables")
    .update({ released })
    .eq("id", deliverableId);
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/manage`);
  revalidatePath(`/engagement/${engagementId}/output`);
  revalidatePath(`/engagement/${engagementId}/controlled_release`);
}
