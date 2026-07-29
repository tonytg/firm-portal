import "server-only";
import { createServerSupabase } from "./supabase/server";
import type {
  Engagement,
  StageStatus,
  MeetingSession,
  Deliverable,
} from "./types";

/**
 * Data-access layer. Reads flow through the signed-in user's Supabase client,
 * so RLS scopes results automatically: a client sees only their own org's
 * engagements (and never advisor-only risk_items); an admin sees everything.
 */
const ENGAGEMENT_SELECT = `
  id, pillar, title, advisor_name, industry, sector,
  loe_signed, phase1_payment_received, final_payment_received,
  activation_override, activated_at,
  clients ( name ),
  stage_states ( key, status, internal_note, completed_at ),
  meetings ( id, stage_key, title, session_type, scheduled_at, location, duration_minutes, participants, agenda, attendance_confirmed, sign_off_uploaded ),
  deliverables ( id, title, format, release_gate, released, file_path ),
  risk_items ( id, cause, event, impact )
`;

interface RawEngagement {
  id: string;
  pillar: Engagement["pillar"];
  title: string;
  advisor_name: string | null;
  industry: string | null;
  sector: string | null;
  loe_signed: boolean;
  phase1_payment_received: boolean;
  final_payment_received: boolean;
  activation_override: boolean;
  activated_at: string | null;
  clients: { name: string } | null;
  stage_states: {
    key: string;
    status: string;
    internal_note: string | null;
    completed_at: string | null;
  }[];
  meetings: {
    id: string;
    stage_key: string;
    title: string;
    session_type: string;
    scheduled_at: string | null;
    location: string | null;
    duration_minutes: number | null;
    participants: MeetingSession["participants"];
    agenda: string[];
    attendance_confirmed: boolean;
    sign_off_uploaded: boolean;
  }[];
  deliverables: {
    id: string;
    title: string;
    format: string;
    release_gate: string;
    released: boolean;
    file_path: string | null;
  }[];
  risk_items: { id: string; cause: string | null; event: string | null; impact: string | null }[];
}

function mapEngagement(r: RawEngagement): Engagement {
  return {
    id: r.id,
    pillar: r.pillar,
    title: r.title,
    clientName: r.clients?.name ?? "",
    advisorName: r.advisor_name ?? "",
    industry: r.industry ?? undefined,
    sector: (r.sector as Engagement["sector"]) ?? undefined,
    loeSigned: r.loe_signed,
    phase1PaymentReceived: r.phase1_payment_received,
    finalPaymentReceived: r.final_payment_received,
    activationOverride: r.activation_override,
    activatedAt: r.activated_at ?? undefined,
    stages: r.stage_states.map((s) => ({
      key: s.key,
      status: s.status as StageStatus,
      internalNote: s.internal_note ?? undefined,
      completedAt: s.completed_at ?? undefined,
    })),
    meetings: r.meetings.map((m) => ({
      id: m.id,
      stageKey: m.stage_key,
      title: m.title,
      sessionType: m.session_type as MeetingSession["sessionType"],
      scheduledAt: m.scheduled_at ?? undefined,
      location: m.location ?? undefined,
      durationMinutes: m.duration_minutes ?? undefined,
      participants: m.participants ?? [],
      agenda: m.agenda ?? [],
      attendanceConfirmed: m.attendance_confirmed,
      signOffUploaded: m.sign_off_uploaded,
    })),
    deliverables: r.deliverables
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((d) => ({
        id: d.id,
        title: d.title,
        format: d.format as Deliverable["format"],
        releaseGate: d.release_gate as Deliverable["releaseGate"],
        released: d.released,
        fileUrl: d.file_path ?? undefined,
      })),
    risks: r.risk_items.map((ri) => ({
      id: ri.id,
      cause: ri.cause ?? "",
      event: ri.event ?? "",
      impact: ri.impact ?? "",
    })),
  };
}

export async function listEngagements(): Promise<Engagement[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .order("created_at", { ascending: true });
  if (error) throw new Error(`listEngagements: ${error.message}`);
  return (data as unknown as RawEngagement[]).map(mapEngagement);
}

export async function getEngagementById(
  id: string,
): Promise<Engagement | undefined> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("engagements")
    .select(ENGAGEMENT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getEngagementById: ${error.message}`);
  return data ? mapEngagement(data as unknown as RawEngagement) : undefined;
}

export interface QuestionnaireState {
  answers: Record<string, string>;
  submittedAt: string | null;
}

/** Saved responses + submission for one engagement stage (RLS-scoped). */
export async function getQuestionnaireState(
  engagementId: string,
  stage: string,
): Promise<QuestionnaireState> {
  const supabase = await createServerSupabase();
  const [responsesRes, submissionRes] = await Promise.all([
    supabase
      .from("questionnaire_responses")
      .select("question_id, answer")
      .eq("engagement_id", engagementId)
      .eq("stage", stage),
    supabase
      .from("questionnaire_submissions")
      .select("submitted_at")
      .eq("engagement_id", engagementId)
      .eq("stage", stage)
      .maybeSingle(),
  ]);
  const answers: Record<string, string> = {};
  for (const r of responsesRes.data ?? []) {
    if (r.answer != null) answers[r.question_id] = r.answer;
  }
  return { answers, submittedAt: submissionRes.data?.submitted_at ?? null };
}
