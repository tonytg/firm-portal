/**
 * IMPACT Portal - Domain Model
 *
 * This file encodes the engagement workflow defined in the client
 * specification documents (docs/). The portal is an advisor-controlled
 * state machine: stages do not auto-advance, internal stages are visible
 * as status only, and deliverables release in a strict, locked sequence.
 *
 * Source of truth for business rules:
 *   - Pillar 1: Pillar1_Portal_Interface_Mapping_FINAL, Pillar1_Portal_Wireframes_FINAL,
 *               P1_Developer_Final_Clarification_Pack
 *   - Pillar 2: P2_Simplified_Developer_Build_Spec + Screen specs 2–5
 */

export type Role = "advisor" | "client";

export type Pillar = "pillar_1" | "pillar_2";

/**
 * Status vocabulary shared across the portal. Maps directly to the
 * icon system used in the wireframes.
 */
export type StageStatus =
  | "not_started" // ⚪
  | "in_progress" // 🟡
  | "under_analysis" // 👁️ internal advisor work, visible as status only
  | "scheduled" // 🔵
  | "completed" // 🟢
  | "locked"; // 🔒 gated by release rules / activation

/**
 * Visibility controls how a stage appears to the CLIENT.
 *  - interactive: client can open and act
 *  - status_only: client sees progress label but cannot access content (internal work)
 *  - pre_read:    client sees read-only pre-read material, no editing
 *  - internal:    not shown to client at all (Pillar 2 stage 0/3/4 are "internal only")
 */
export type StageVisibility =
  | "interactive"
  | "status_only"
  | "pre_read"
  | "internal";

export interface StageDefinition {
  key: string;
  /** Order in the flow. */
  order: number;
  title: string;
  description: string;
  visibility: StageVisibility;
  /** Whether this stage centres on an in-person meeting. */
  hasMeeting: boolean;
  /** Contribution to the engagement progress bar (Pillar 1 wireframe). */
  progressWeight?: number;
}

export interface StageState {
  key: string;
  status: StageStatus;
  /** Advisor-only notes / internal status text. */
  internalNote?: string;
  completedAt?: string;
}

export interface MeetingSession {
  stageKey: string;
  title: string;
  sessionType: "In-person" | "Remote";
  scheduledAt?: string;
  location?: string;
  durationMinutes?: number;
  participants: { name: string; role: string }[];
  agenda: string[];
  /** Client confirms attendance - but this NEVER completes the stage. */
  attendanceConfirmed: boolean;
  /** Advisor uploads sign-off after the session. */
  signOffUploaded: boolean;
}

export type DeliverableFormat = "PDF";

export interface Deliverable {
  id: string;
  title: string;
  format: DeliverableFormat; // LOCKED: PDF only, ever.
  /** Which gate unlocks this download. */
  releaseGate: "after_validation" | "after_walkthrough" | "executive_first";
  released: boolean; // advisor-controlled flag
  fileUrl?: string;
}

/**
 * Risk Capture (Pillar 1 Workshop, Screen 3). Advisor-only working data,
 * structured as Cause → Event → Impact. NEVER visible to the client.
 */
export interface RiskItem {
  id: string;
  cause: string;
  event: string;
  impact: string;
}

export interface Engagement {
  id: string;
  pillar: Pillar;
  title: string;
  clientName: string;
  advisorName: string;
  industry?: string;
  sector?: "Hospital" | "F&B" | "Construction" | "Other";
  /**
   * Activation gate: an engagement is only active after LoE signature
   * AND Phase 1 payment (advisor may override). No stage is accessible
   * before activation.
   */
  loeSigned: boolean;
  phase1PaymentReceived: boolean;
  activationOverride: boolean;
  activatedAt?: string;
  /** Commercial hold: final PDFs release only after the walkthrough AND final payment. */
  finalPaymentReceived: boolean;
  stages: StageState[];
  meetings: MeetingSession[];
  deliverables: Deliverable[];
  /** Advisor-only risk capture (Pillar 1). */
  risks?: RiskItem[];
}

export function isActivated(e: Engagement): boolean {
  if (e.activationOverride) return true;
  return e.loeSigned && e.phase1PaymentReceived;
}
