/**
 * Stage definitions for both pillars, transcribed directly from the
 * specification documents. These are the canonical flows the portal renders.
 */

import type { StageDefinition, Pillar } from "./types";

/**
 * PILLAR 1 - Risk Assessment
 * Flow & progress weights from Pillar1_Portal_Wireframes_FINAL (Screen 1).
 * Activation 0% → Intake 20% → Diagnosis 40% → Build 60% → Calibration 80% → Output 100%.
 */
export const PILLAR_1_STAGES: StageDefinition[] = [
  {
    key: "activation",
    order: 0,
    title: "Activation",
    description: "LoE signature, Phase 1 payment, and portal access.",
    visibility: "interactive",
    hasMeeting: false,
    progressWeight: 0,
  },
  {
    key: "intake",
    order: 1,
    title: "Intake",
    description: "Information collection (core + sector questionnaire).",
    visibility: "interactive",
    hasMeeting: false,
    progressWeight: 20,
  },
  {
    key: "diagnosis",
    order: 2,
    title: "Diagnosis (Internal Analysis)",
    description: "Internal red-flag analysis of the intake responses.",
    visibility: "status_only", // internal analysis portion is status-only
    hasMeeting: false,
    progressWeight: 40,
  },
  {
    key: "risk_workshop",
    order: 3,
    title: "Risk Identification Workshop",
    description:
      "Client-facing risk identification session with the advisory team.",
    visibility: "interactive",
    hasMeeting: true,
  },
  {
    key: "build",
    order: 4,
    title: "Build",
    description: "Risk register and model construction (internal).",
    visibility: "status_only",
    hasMeeting: false,
    progressWeight: 60,
  },
  {
    key: "calibration",
    order: 5,
    title: "Calibration Session",
    description: "Executive calibration and validation (in person).",
    visibility: "interactive",
    hasMeeting: true,
    progressWeight: 80,
  },
  {
    key: "output",
    order: 6,
    title: "Output",
    description: "Executive Briefing Pack, the first controlled release.",
    visibility: "interactive",
    hasMeeting: false,
    progressWeight: 100,
  },
  {
    key: "walkthrough",
    order: 7,
    title: "Walkthrough / Delivery",
    description: "Final deliverables walkthrough and controlled release.",
    visibility: "interactive",
    hasMeeting: true,
  },
  {
    key: "board_delivery",
    order: 8,
    title: "Board Delivery",
    description: "Optional board presentation and support.",
    visibility: "interactive",
    hasMeeting: true,
  },
];

/**
 * PILLAR 2 - Governance Framework
 * Stage flow from P2_Simplified_Developer_Build_Spec (7 stages, 0–6).
 */
export const PILLAR_2_STAGES: StageDefinition[] = [
  {
    key: "setup",
    order: 0,
    title: "Engagement Setup & Architecture Read",
    description: "Advisor opens the engagement internally.",
    visibility: "internal",
    hasMeeting: false,
  },
  {
    key: "questionnaire",
    order: 1,
    title: "Governance Questionnaire & Evidence",
    description: "Client completes questionnaire and uploads evidence.",
    visibility: "interactive",
    hasMeeting: false,
  },
  {
    key: "workshop",
    order: 2,
    title: "Governance Alignment Workshop",
    description: "In-person governance workshop.",
    visibility: "interactive",
    hasMeeting: true,
  },
  {
    key: "diagnostic_exercise",
    order: 3,
    title: "Governance Diagnostic Exercise",
    description: "Advisor performs internal governance analysis.",
    visibility: "internal",
    hasMeeting: false,
  },
  {
    key: "architecture_build",
    order: 4,
    title: "Architecture Build",
    description: "Advisor drafts the governance architecture.",
    visibility: "internal",
    hasMeeting: false,
  },
  {
    key: "validation",
    order: 5,
    title: "Governance Validation",
    description: "In-person validation meeting (read-only pre-read in portal).",
    visibility: "pre_read",
    hasMeeting: true,
  },
  {
    key: "controlled_release",
    order: 6,
    title: "Controlled Release",
    description: "Executive Brief → walkthrough → final PDF unlock.",
    visibility: "interactive",
    hasMeeting: true,
  },
];

export function getStageDefinitions(pillar: Pillar): StageDefinition[] {
  return pillar === "pillar_1" ? PILLAR_1_STAGES : PILLAR_2_STAGES;
}

export function getStageDefinition(
  pillar: Pillar,
  key: string,
): StageDefinition | undefined {
  return getStageDefinitions(pillar).find((s) => s.key === key);
}

export const PILLAR_LABELS: Record<Pillar, string> = {
  pillar_1: "Pillar 1 - Risk Assessment",
  pillar_2: "Pillar 2 - Governance Framework",
};
