/**
 * Mock data for development before Supabase is wired in.
 * Replace these reads with database queries in the data layer later.
 */

import type { Engagement } from "./types";

export const MOCK_ENGAGEMENTS: Engagement[] = [
  {
    id: "eng-p1-acme",
    pillar: "pillar_1",
    title: "Risk Assessment - Pillar 1",
    clientName: "Cedar Hospitality Group",
    advisorName: "IMPACT - Anthony El Hachem",
    industry: "Hospitality",
    sector: "F&B",
    loeSigned: true,
    phase1PaymentReceived: true,
    finalPaymentReceived: false,
    activationOverride: false,
    activatedAt: "2026-05-02T09:00:00Z",
    stages: [
      { key: "activation", status: "completed", completedAt: "2026-05-02T09:00:00Z" },
      { key: "intake", status: "completed", completedAt: "2026-05-10T12:00:00Z" },
      { key: "diagnosis", status: "in_progress", internalNote: "Red-flag mapping underway" },
      { key: "risk_workshop", status: "scheduled" },
      { key: "build", status: "not_started" },
      { key: "calibration", status: "not_started" },
      { key: "output", status: "not_started" },
      { key: "walkthrough", status: "not_started" },
      { key: "board_delivery", status: "not_started" },
    ],
    meetings: [
      {
        stageKey: "risk_workshop",
        title: "Risk Identification Workshop",
        sessionType: "In-person",
        scheduledAt: "2026-06-20T10:00:00Z",
        location: "Client HQ, Beirut",
        durationMinutes: 180,
        participants: [{ name: "Cedar CEO", role: "CEO / Executive" }],
        agenda: ["Review Intake", "Identify risks", "Challenge controls", "Confirm exposures"],
        attendanceConfirmed: false,
        signOffUploaded: false,
      },
      {
        stageKey: "calibration",
        title: "Executive Calibration Session",
        sessionType: "In-person",
        scheduledAt: "2026-07-05T10:00:00Z",
        location: "Client HQ, Beirut",
        durationMinutes: 120,
        participants: [{ name: "Cedar CEO", role: "CEO" }],
        agenda: ["Executive calibration", "Validate findings"],
        attendanceConfirmed: false,
        signOffUploaded: false,
      },
    ],
    deliverables: [
      { id: "d1", title: "Executive Briefing Pack (dashboard + heat map)", format: "PDF", releaseGate: "executive_first", released: false },
      { id: "d2", title: "Enterprise Risk Assessment Report", format: "PDF", releaseGate: "after_walkthrough", released: false },
      { id: "d3", title: "Appendix A - Escalation & Stabilisation", format: "PDF", releaseGate: "after_walkthrough", released: false },
      { id: "d4", title: "Risk Register - Client Copy", format: "PDF", releaseGate: "after_walkthrough", released: false },
    ],
    risks: [
      {
        id: "r1",
        cause: "Single supplier for core perishables",
        event: "Supplier insolvency / delivery failure",
        impact: "Service disruption across all venues; revenue loss",
      },
      {
        id: "r2",
        cause: "No documented escalation authority above GM level",
        event: "Major incident requires board-level decision",
        impact: "Delayed response; reputational and regulatory exposure",
      },
    ],
  },
  {
    id: "eng-p2-acme",
    pillar: "pillar_2",
    title: "Governance Framework - Pillar 2",
    clientName: "Cedar Hospitality Group",
    advisorName: "IMPACT - Anthony El Hachem",
    industry: "Hospitality",
    sector: "F&B",
    loeSigned: true,
    phase1PaymentReceived: false,
    finalPaymentReceived: false,
    activationOverride: false,
    stages: [
      { key: "setup", status: "completed" },
      { key: "questionnaire", status: "not_started" },
      { key: "workshop", status: "not_started" },
      { key: "diagnostic_exercise", status: "not_started" },
      { key: "architecture_build", status: "not_started" },
      { key: "validation", status: "not_started" },
      { key: "controlled_release", status: "not_started" },
    ],
    meetings: [],
    deliverables: [
      { id: "g1", title: "Governance Executive Brief", format: "PDF", releaseGate: "after_validation", released: false },
      { id: "g2", title: "Governance Architecture Pack", format: "PDF", releaseGate: "after_walkthrough", released: false },
      { id: "g3", title: "KRI Framework", format: "PDF", releaseGate: "after_walkthrough", released: false },
      { id: "g4", title: "Escalation Protocol", format: "PDF", releaseGate: "after_walkthrough", released: false },
    ],
  },
];

export function getEngagement(id: string): Engagement | undefined {
  return MOCK_ENGAGEMENTS.find((e) => e.id === id);
}
