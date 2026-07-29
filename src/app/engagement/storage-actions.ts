"use server";

import { revalidatePath } from "next/cache";
import { requireUser, requireAdmin } from "@/lib/auth";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { getEngagementById } from "@/lib/data";
import { isDeliverableDownloadable } from "@/lib/engagement";

/**
 * File storage. Buckets are private; all access goes through these actions,
 * which authorize the caller (RLS via the user's client) and then use the
 * service-role client to read/write storage and return short-lived signed URLs.
 */
const SIGNED_URL_TTL = 120; // seconds

function fileFrom(formData: FormData): File | null {
  const f = formData.get("file");
  return f instanceof File && f.size > 0 ? f : null;
}

export async function uploadEvidence(formData: FormData) {
  await requireUser();
  const engagementId = String(formData.get("engagementId") ?? "");
  const stage = String(formData.get("stage") ?? "");
  const questionId = String(formData.get("questionId") ?? "");
  const file = fileFrom(formData);
  if (!file) return;

  const supabase = await createServerSupabase();
  const eng = await getEngagementById(engagementId); // RLS: undefined if no access
  if (!eng) throw new Error("Engagement not found.");

  const admin = await createAdminSupabase();
  const safe = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${engagementId}/${stage}/${questionId}/${Date.now()}-${safe}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const up = await admin.storage
    .from("evidence")
    .upload(path, bytes, { contentType: file.type || "application/octet-stream" });
  if (up.error) throw new Error(up.error.message);

  const { error } = await supabase.from("evidence_files").insert({
    engagement_id: engagementId,
    stage,
    question_id: questionId,
    path,
    filename: file.name,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/${stage}`);
}

export async function getEvidenceUrl(fileId: string): Promise<string> {
  await requireUser();
  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from("evidence_files")
    .select("path")
    .eq("id", fileId)
    .maybeSingle();
  if (!row) throw new Error("File not found.");
  const admin = await createAdminSupabase();
  const { data, error } = await admin.storage
    .from("evidence")
    .createSignedUrl(row.path, SIGNED_URL_TTL);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}

export async function uploadDeliverable(formData: FormData) {
  await requireAdmin();
  const deliverableId = String(formData.get("deliverableId") ?? "");
  const engagementId = String(formData.get("engagementId") ?? "");
  const file = fileFrom(formData);
  if (!file) return;

  const admin = await createAdminSupabase();
  const path = `${engagementId}/${deliverableId}.pdf`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  const up = await admin.storage
    .from("deliverables")
    .upload(path, bytes, { contentType: "application/pdf", upsert: true });
  if (up.error) throw new Error(up.error.message);

  const supabase = await createServerSupabase();
  const { error } = await supabase
    .from("deliverables")
    .update({ file_path: path })
    .eq("id", deliverableId);
  if (error) throw new Error(error.message);
  revalidatePath(`/engagement/${engagementId}/output`);
  revalidatePath(`/engagement/${engagementId}/controlled_release`);
  revalidatePath(`/engagement/${engagementId}/manage`);
}

export async function getDeliverableUrl(
  deliverableId: string,
  engagementId: string,
): Promise<string> {
  await requireUser();
  const eng = await getEngagementById(engagementId);
  if (!eng) throw new Error("Engagement not found.");
  const d = eng.deliverables.find((x) => x.id === deliverableId);
  if (!d) throw new Error("Deliverable not found.");
  if (!isDeliverableDownloadable(eng, d)) {
    throw new Error("This deliverable is not available yet.");
  }
  if (!d.fileUrl) throw new Error("No file has been uploaded for this deliverable yet.");

  const admin = await createAdminSupabase();
  const { data, error } = await admin.storage
    .from("deliverables")
    .createSignedUrl(d.fileUrl, SIGNED_URL_TTL);
  if (error) throw new Error(error.message);
  return data.signedUrl;
}
