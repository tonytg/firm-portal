/**
 * Questionnaire definitions.
 *
 * NOTE: The specification documents define the MODULES / SECTIONS and the
 * sector-filtering logic, but not the individual questions. The questions
 * below are PLACEHOLDERS, clearly marked, so the screens are fully functional
 * and the real question list can be dropped in later without code changes.
 *
 *   - Pillar 1 intake modules: Pillar1_Portal_Wireframes_FINAL (Screen 2)
 *   - Pillar 2 governance sections: P2_Diagnostic_Interface_Screen2
 *
 * Sector tags mirror the docs: [HOSP] Hospital, [F&B], [CONST] Construction.
 */

export type SectorTag = "core" | "HOSP" | "F&B" | "CONST";

export interface Question {
  id: string;
  text: string;
  /** Whether supporting evidence upload is expected (Pillar 2 requires evidence). */
  evidenceRequired: boolean;
  sector: SectorTag;
  /** Placeholder flag — true until the real client question list is provided. */
  placeholder?: boolean;
}

export interface QuestionnaireSection {
  key: string;
  title: string;
  questions: Question[];
}

/** Helper to generate clearly-labelled placeholder questions for a section. */
function placeholders(
  sectionKey: string,
  count: number,
  opts: { evidenceRequired?: boolean } = {},
): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${sectionKey}-q${i + 1}`,
    text: `[Placeholder] ${sectionKey.replace(/-/g, " ")} — question ${i + 1}`,
    evidenceRequired: opts.evidenceRequired ?? false,
    sector: "core" as SectorTag,
    placeholder: true,
  }));
}

/* ──────────────────────────────────────────────────────────────────────────
 * PILLAR 1 — Intake (8 core modules, + conditional sector questionnaire)
 * ────────────────────────────────────────────────────────────────────────── */
export const PILLAR_1_INTAKE: QuestionnaireSection[] = [
  { key: "business-model", title: "1. Business Model & Value Creation", questions: placeholders("business-model", 3) },
  { key: "legal-governance", title: "2. Legal Structure & Governance", questions: placeholders("legal-governance", 3) },
  { key: "decision-authority", title: "3. Decision Authority & Escalation", questions: placeholders("decision-authority", 3) },
  { key: "risk-controls", title: "4. Risk Management & Controls", questions: placeholders("risk-controls", 3) },
  { key: "financial-exposure", title: "5. Financial Exposure & Liquidity", questions: placeholders("financial-exposure", 3) },
  { key: "workforce", title: "6. Workforce & Key Dependency", questions: placeholders("workforce", 3) },
  { key: "reputation", title: "7. Reputation & Incident History", questions: placeholders("reputation", 3) },
  { key: "technology", title: "8. Technology, Data & Continuity", questions: placeholders("technology", 3) },
];

/** Conditional sector questionnaires (loaded only when industry matches). */
export const PILLAR_1_SECTOR: Record<"Hospital" | "F&B", QuestionnaireSection[]> = {
  Hospital: [
    { key: "hosp-clinical", title: "Healthcare — Clinical Risk & Patient Safety", questions: placeholders("hosp-clinical", 3) },
    { key: "hosp-compliance", title: "Healthcare — Regulatory Compliance", questions: placeholders("hosp-compliance", 3) },
  ],
  "F&B": [
    { key: "fnb-food-safety", title: "F&B — Food Safety & Hygiene", questions: placeholders("fnb-food-safety", 3) },
    { key: "fnb-supply", title: "F&B — Supply Chain & Sourcing", questions: placeholders("fnb-supply", 3) },
  ],
};

/* ──────────────────────────────────────────────────────────────────────────
 * PILLAR 2 — Governance Diagnostic (12 sections, evidence required)
 * Section list from P2_Diagnostic_Interface_Screen2.
 * ────────────────────────────────────────────────────────────────────────── */
const P2_SECTION_TITLES: { key: string; title: string }[] = [
  { key: "governance-structure", title: "Governance Structure" },
  { key: "risk-appetite", title: "Risk Appetite" },
  { key: "risk-tolerance", title: "Risk Tolerance" },
  { key: "quantitative-limits", title: "Quantitative Limits" },
  { key: "kri-design", title: "KRI Design & Monitoring" },
  { key: "velocity-override", title: "Velocity & Override" },
  { key: "escalation-discipline", title: "Escalation Discipline" },
  { key: "three-lines", title: "Three Lines Accountability" },
  { key: "board-oversight", title: "Board Oversight" },
  { key: "regulatory-governance", title: "Regulatory Governance" },
  { key: "risk-integration", title: "Risk Integration" },
  { key: "monitoring-reporting", title: "Monitoring & Reporting" },
];

export const PILLAR_2_DIAGNOSTIC: QuestionnaireSection[] = P2_SECTION_TITLES.map(
  ({ key, title }) => ({
    key,
    title,
    questions: placeholders(key, 2, { evidenceRequired: true }),
  }),
);
