/**
 * Questionnaire definitions.
 *
 * Pillar 1 Core + sector modules (Hospital, F&B) are transcribed from the
 * approved questionnaire documents (docs/p1/*.docx):
 *   - Core:     P1_Questionnaire_Core_20260709_Final
 *   - Hospital: P1_Questionnaire_Module_Hospital_20260709_Final
 *   - F&B:      P1_Questionnaire_Module_FB_20260413_ClaudeFix
 * Construction (P1_Questionnaire_Module_Construction) is not yet wired in.
 *
 * Each question carries its reference code, the guidance sub-bullets from the
 * document, and flags for advisor-only (never shown to the client) and
 * "if applicable" questions.
 *
 * Pillar 2 governance sections remain placeholders (P2_Diagnostic_Interface_Screen2)
 * until that content is provided.
 */

import type { Role } from "./types";

export type SectorTag = "core" | "HOSP" | "F&B" | "CONST";

export interface Question {
  id: string;
  /** Reference code from the document, e.g. "1.1", "H2.3". */
  ref?: string;
  text: string;
  /** Guidance sub-bullets that accompany the question in the document. */
  guidance?: string[];
  /** Whether supporting evidence upload is expected (Pillar 2 requires evidence). */
  evidenceRequired: boolean;
  /** "Advisor - not for client": never rendered to the client. */
  advisorOnly?: boolean;
  /** "If applicable": answer only where the stated condition applies. */
  ifApplicable?: boolean;
  sector: SectorTag;
  /** Placeholder flag - true until the real question list is provided. */
  placeholder?: boolean;
}

export interface QuestionnaireSection {
  key: string;
  title: string;
  /** Which risk categories this section feeds (advisor context). */
  feeds?: string;
  questions: Question[];
}

/** Compact constructor for a real (non-placeholder) question. */
function q(
  ref: string,
  text: string,
  guidance: string[] = [],
  opts: {
    sector?: SectorTag;
    advisorOnly?: boolean;
    ifApplicable?: boolean;
    evidenceRequired?: boolean;
  } = {},
): Question {
  return {
    id: ref.toLowerCase().replace(/[.\s]+/g, "-"),
    ref,
    text,
    guidance,
    evidenceRequired: opts.evidenceRequired ?? false,
    sector: opts.sector ?? "core",
    ...(opts.advisorOnly ? { advisorOnly: true } : {}),
    ...(opts.ifApplicable ? { ifApplicable: true } : {}),
  };
}

/** Helper to generate clearly-labelled placeholder questions for a section. */
function placeholders(
  sectionKey: string,
  count: number,
  opts: { evidenceRequired?: boolean } = {},
): Question[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${sectionKey}-q${i + 1}`,
    text: `[Placeholder] ${sectionKey.replace(/-/g, " ")} - question ${i + 1}`,
    evidenceRequired: opts.evidenceRequired ?? false,
    sector: "core" as SectorTag,
    placeholder: true,
  }));
}

/** Hide advisor-only questions from the client; empty sections drop out. */
export function sectionsForRole(
  sections: QuestionnaireSection[],
  role: Role,
): QuestionnaireSection[] {
  if (role === "advisor") return sections;
  return sections
    .map((s) => ({ ...s, questions: s.questions.filter((qn) => !qn.advisorOnly) }))
    .filter((s) => s.questions.length > 0);
}

/* ──────────────────────────────────────────────────────────────────────────
 * PILLAR 1 - Core Intake (8 modules, 37 questions)
 * Source: P1_Questionnaire_Core_20260709_Final
 * ────────────────────────────────────────────────────────────────────────── */
export const PILLAR_1_INTAKE: QuestionnaireSection[] = [
  {
    key: "business-model",
    title: "1. Business Model & Value Creation",
    feeds: "Operational, Strategic, Third-Party & Dependency, Financial Risk",
    questions: [
      q("1.1", "State the business, its core activities, and how it generates revenue.", [
        "Products or services delivered (specific, not categorical).",
        "Operating geographies and physical sites.",
        "Who pays, for what, and how often.",
        "Primary revenue model: contractual / transactional / subscription / project-based.",
        "Exposure of the business model to structural disruption: technology substitution, regulatory change to the model itself, new entrants, or channel shift and disintermediation. This is distinct from cyclical volatility.",
      ]),
      q("1.2", "State revenue concentration by client and by line of business.", [
        "Top 5 clients by revenue contribution (% of total). If regulated, top 10.",
        "Revenue contribution per line of business (% of total).",
        "Whether any single client or line exceeds 25% of total revenue.",
        "Whether any revenue stream is non-recurring or project-dependent.",
        "Whether concentration is measured at group or entity level. Flag any concentration that is severe at a single entity even if diluted on consolidation.",
      ]),
      q("1.3", "Identify the failure-sensitive points in your operations.", [
        "Which single stage, if disrupted, would stop or materially reduce revenue.",
        "Which stage is subject to licensing or regulatory approval that could suspend operations.",
        "Which stage affects product or service quality, delivery reliability, or safety.",
        "Whether any failure point depends on a single supplier, system, person, or facility.",
        "For each critical dependency, what further functions, revenue streams, or entities fail if it fails. Identify any single point whose failure would propagate across multiple functions or entities.",
      ]),
      q("1.4", "State critical supplier and system dependencies.", [
        "Suppliers or systems without which operations cannot continue (name each).",
        "Dependency ratio: % of input or volume attributable to each critical dependency.",
        "Whether a backup or alternative exists and time required to activate it.",
        "Operational impact if disruption exceeds 24 hours, 72 hours, and 7 days.",
        "Critical external dependencies by class: suppliers, outsourced critical functions, cloud and SaaS and technology vendors (including vendor concentration), utilities and infrastructure where material (power, fuel, water, telecoms, transport), and key external relationships (banking concentration, concession or licence authorities, major landlords, sole agencies or distributorships) whose loss or non-renewal would materially impair the business.",
        "Services and systems shared across entities (treasury, IT, HR, procurement, insurance placement) that function as enterprise-wide single points of failure.",
      ]),
    ],
  },
  {
    key: "legal-governance",
    title: "2. Legal Structure & Governance",
    feeds: "Legal & Regulatory, Governance & Culture, Financial Risk",
    questions: [
      q("2.1", "State the full legal structure.", [
        "All legal entities: name, legal form, jurisdiction of incorporation.",
        "Which entities are revenue-generating versus holding or administrative.",
        "Whether any entity is regulated and by which authority.",
        "Jurisdictions of operation, distinct from jurisdictions of incorporation, and the regulatory regime applicable in each.",
        "If single entity, state so.",
      ]),
      q("2.2", "State ownership and control structure.", [
        "Ownership percentage per shareholder per entity.",
        "Whether any shareholder holds more than 25%, 50%, or 75%.",
        "Distinction between economic ownership and voting or control rights.",
        "Whether any shareholder agreement restricts disposal, transfer, or decision rights.",
        "Where ownership is family or individual: personal guarantees given by owners, commingling of personal and business assets, and related-party or family employment arrangements.",
      ]),
      q("2.3", "State IP, brand, and intercompany arrangements.", [
        "Ownership of brand, trademarks, patents, proprietary systems, or know-how.",
        "Licensing arrangements between entities (if any).",
        "Intercompany service, financing, or guarantee agreements (if any).",
        "For intercompany financing and cross-guarantees: which entity guarantees which, and whether a subsidiary default would trigger parent or group liability.",
      ], { ifApplicable: true }),
      q("2.4", "State active legal and regulatory exposure.", [
        "Ongoing litigation: type, estimated financial exposure, current stage.",
        "Regulatory investigations or formal notices received.",
        "Penalties or sanctions imposed in the last three years: amount and cause.",
        "Contingent liabilities: nature, estimated exposure, probability.",
      ]),
      q("2.5", "State legal function structure.", [
        "Whether in-house legal counsel exists (Yes / No).",
        "External law firms engaged: number, areas of instruction, annual spend.",
        "How legal responsibility is allocated across management.",
        "Whether compliance monitoring is centralized or fragmented.",
      ]),
    ],
  },
  {
    key: "decision-authority",
    title: "3. Decision Authority & Escalation",
    feeds: "Governance & Culture, Strategic Risk (informs escalation tier mapping)",
    questions: [
      q("3.1", "State ownership concentration and ultimate decision authority.", [
        "Percentage held by each major shareholder.",
        "Whether any individual holds more than 50% and also holds an executive role.",
        "Which decisions require shareholder approval, board approval, or are delegated to management.",
        "Monetary thresholds attached to each delegation tier (if defined).",
        "Who holds final authority in case of disagreement. If no formal documentation exists, state so.",
      ]),
      q("3.2", "Describe how key decisions are made in practice.", [
        "Whether the formal delegation of authority document reflects actual practice (Yes / No).",
        "Categories of decisions routinely taken outside the formal hierarchy.",
        "Who exercises override authority in practice and whether overrides are documented.",
        "Whether escalation follows formal structure or informal influence.",
      ]),
      q("3.3", "State the escalation framework.", [
        "Whether formal escalation rules exist (Yes / No).",
        "Trigger events requiring escalation: financial threshold, operational disruption, regulatory notice, reputational event, legal exposure.",
        "Defined escalation timelines: immediate, within 24 hours, within 72 hours.",
        "Decision authority at each escalation level.",
        "Whether delayed escalation has occurred in practice (Yes / No). If yes, describe.",
      ]),
      q("3.4", "State board and oversight structure.", [
        "Whether a formal board of directors exists (Yes / No).",
        "Board composition: number of members, executive versus non-executive, independent members.",
        "Committees in place: audit, risk, investment, or other.",
        "Whether board decisions are binding in practice or overridden by a controlling individual.",
        "For groups: whether the group or parent board sets risk policy, budgets, and escalation authority over subsidiaries, or whether subsidiary boards act autonomously.",
        "Where ultimate group authority sits, and whether subsidiary boards are substantive or nominal.",
      ]),
      q("3.5", "Self-assessment integrity check.", [
        "Identify the single governance weakness most likely to have been omitted or understated by the client in this questionnaire.",
        "Confirm whether any control rated as effective lacks documented evidence.",
        "Confirm whether any escalation failure has occurred in the last 12 months that was not formally reported.",
      ], { advisorOnly: true }),
    ],
  },
  {
    key: "risk-controls",
    title: "4. Risk Management & Controls",
    feeds: "Control effectiveness scoring across all risk categories",
    questions: [
      q("4.1", "State risk governance function and ownership.", [
        "Whether a formal risk management function exists (Yes / No).",
        "Named individual responsible for enterprise risk (name and title).",
        "Whether risk oversight is independent from operational management.",
        "Capability level: none / informal / documented / structured / integrated.",
        "Whether risk governance is applied consistently across all entities or varies by entity.",
      ]),
      q("4.2", "State risk framework and policy infrastructure.", [
        "Framework adopted: ISO 31000, COSO ERM, internal policy, or none.",
        "Whether a documented risk appetite statement exists and is board-approved.",
        "Whether risk tolerance thresholds are formally defined and communicated.",
        "Frequency of policy review. If no framework exists, state so.",
      ]),
      q("4.3", "State the control environment and operational standards.", [
        "Standards in place: quality, safety, IT, financial controls.",
        "Whether standards are documented and version-controlled.",
        "Enforcement mechanism: inspection, supervision, system controls.",
        "Documented evidence of compliance: audit reports, certifications, internal checks.",
        "Whether control standards are applied uniformly across all entities. Identify the entity with the weakest control environment.",
        "Fraud exposure and controls: segregation of duties, payment authorisation, and vendor and payment verification. State any fraud incidents, internal or external, in the last three years.",
      ]),
      q("4.4", "State open control and audit findings.", [
        "Total number of open findings from the most recent internal or external review.",
        "Age of the oldest unresolved finding (state in months).",
        "Whether remediation is formally tracked with assigned owners and due dates.",
        "Whether any finding has been open for more than 6 months without resolution.",
      ]),
      q("4.5", "State compliance monitoring and incident logging.", [
        "Whether a compliance monitoring program exists.",
        "Whether internal or external audits are conducted and at what frequency.",
        "Whether an incident logging system exists and incidents are severity-rated.",
        "Whether escalation is formally tracked and documented.",
      ]),
    ],
  },
  {
    key: "financial-exposure",
    title: "5. Financial Exposure & Liquidity",
    feeds: "Financial, Strategic Risk (audited revenue base for impact calibration)",
    questions: [
      q("5.1", "State the audited financial position.", [
        "Total gross revenue, most recent full year before VAT.",
        "Net profit margin (%).",
        "Total assets and total liabilities.",
        "If audited financials unavailable: attach management accounts or state estimated revenue and cost structure.",
      ]),
      q("5.2", "State liquidity position and survival horizon.", [
        "Available cash and liquid reserves.",
        "Average monthly fixed cost base.",
        "Number of months operations can sustain under: (a) normal conditions; (b) 30% revenue drop; (c) full shutdown.",
        "Cash fungibility across the group: trapped cash, upstreaming or dividend restrictions, exchange controls, and cash pooling. State the survival horizon at group level and at the most cash-dependent entity.",
      ]),
      q("5.3", "State financing structure and debt exposure.", [
        "Total outstanding debt by facility.",
        "Repayment schedule: short-term versus long-term obligations.",
        "Financial covenants and performance conditions.",
        "Refinancing or rollover dependency within the next 12 months. If no external financing, state so.",
        "Cross-collateralisation and joint-and-several liability across facilities, cross-guarantee exposure magnitude, and intercompany loan balances.",
      ]),
      q("5.4", "State revenue concentration and volatility.", [
        "Concentration by client and line of business is captured in 1.2 and is not repeated here. Focus this section on revenue volatility and sensitivity.",
        "Seasonal revenue patterns: peak and trough months.",
        "Historical revenue range over the last three years: highest and lowest.",
        "Sensitivity to external factors: currency, commodity pricing, regulation, economic downturn.",
      ]),
      q("5.5", "State legal and regulatory financial exposure.", [
        "Financial provisioning for active litigation or regulatory penalties.",
        "Contingent liabilities that may materially affect financial position.",
        "Whether any receivables are at risk due to disputes or investigations.",
      ]),
      q("5.6", "State insurance coverage.", [
        "Types of coverage: property, business interruption, public liability, product liability, cyber, professional indemnity.",
        "Coverage limits relative to maximum operational exposure.",
        "Claims made in the last three years: type, amount, and outcome.",
        "Whether insurance notification procedures are formally documented.",
        "Whether cover is placed centrally as a group or master policy with aggregate limits shared across entities, or per entity, and whether a single large claim would erode cover group-wide.",
        "Adequacy of Professional Indemnity and Cyber cover relative to plausible maximum loss, and any material uninsured or underinsured exposures, including significant policy exclusions and self-insured retentions.",
      ]),
      q("5.7", "State financial reporting discipline.", [
        "Frequency of internal financial reporting: monthly, quarterly, or ad hoc.",
        "Whether management accounts are produced and distributed to decision-makers.",
        "Whether the organization can produce a current P&L, cash flow, and balance sheet within 5 business days on request.",
        "Whether financial KPIs are tracked and reported at board or executive level.",
      ]),
    ],
  },
  {
    key: "workforce",
    title: "6. Workforce & Key Dependency",
    feeds: "Governance & Culture, Operational, Crisis & Continuity Risk",
    questions: [
      q("6.1", "State workforce size and structure.", [
        "Total headcount by category: executive, management, operational, technical, administrative, contractual.",
        "Ratio of direct employees to contracted or outsourced labor.",
        "Roles critical to business continuity.",
        "Whether any critical role is currently single-person dependent.",
      ]),
      q("6.2", "State key-person dependency and succession.", [
        "Whether any individual's absence would materially impair operations (Yes / No). Name the function.",
        "Whether designated deputies exist for CEO, CFO, and key operational heads.",
        "Whether succession planning is documented or informal.",
        "Whether temporary authority transfer procedures exist.",
      ]),
      q("6.3", "State workforce risk and HR governance.", [
        "Annual attrition rate (if tracked).",
        "Active or pending employment disputes or labor claims.",
        "Whether a formal HR function exists and its reporting line.",
        "Whether a code of conduct or misconduct reporting mechanism exists.",
        "Compliance with applicable labor law requirements.",
      ]),
    ],
  },
  {
    key: "reputation",
    title: "7. Reputation & Incident History",
    feeds: "Reputational, Crisis & Continuity, Governance & Culture Risk",
    questions: [
      q("7.1", "State public exposure profile.", [
        "Primary stakeholder groups: customers, regulators, investors, public.",
        "Geographic visibility: local, national, regional, international.",
        "Degree to which revenue depends on brand trust.",
        "Whether the business operates in a reputation-sensitive sector.",
        "Whether entities share a common brand such that an incident in one entity would contaminate the group.",
      ]),
      q("7.2", "State material reputational and regulatory incidents in the last five years.", [
        "Description of each incident.",
        "Financial or operational impact.",
        "Time taken to escalate internally and communicate externally.",
        "Whether a formal post-incident review was conducted. If none, state clearly.",
      ]),
      q("7.3", "State crisis authority and communication protocol.", [
        "Whether a formal crisis response protocol exists (Yes / No).",
        "Whether the crisis response and communications protocol has been exercised or tested, as distinct from existing only as a document.",
        "Designated crisis decision authority.",
        "External communication approval process.",
        "Whether pre-approved holding statements or templates exist.",
      ]),
      q("7.4", "Advisor independent verification note.", [
        "Independently verify material incidents via media search, regulatory databases, and public records before the workshop.",
        "Cross-reference stated litigation exposure (5.5) against financial provisioning. Flag inconsistencies.",
        "Where any control is rated as effective but lacks documentary evidence, flag as assumption-dependent.",
      ], { advisorOnly: true }),
    ],
  },
  {
    key: "technology",
    title: "8. Technology & Continuity",
    feeds: "Technology & Data, Crisis & Continuity Risk",
    questions: [
      q("8.1", "State critical technology systems.", [
        "Core systems required for operations: ERP, POS, CRM, financial, other.",
        "Whether any system is a single point of failure.",
        "Age and vendor support status of critical systems.",
        "Time to restore operations if a core system is unavailable for 24 hours, 72 hours.",
        "Whether the organisation maintains a current inventory of its critical technology assets and digital services.",
      ]),
      q("8.2", "State cybersecurity and data governance posture.", [
        "Whether a cybersecurity policy exists (Yes / No).",
        "Whether data is classified and access-controlled.",
        "Whether the business holds regulated personal data: customer, employee, or other.",
        "Whether cyber insurance exists.",
        "Whether a documented data breach response plan exists.",
        "Critical data assets the business cannot operate or decide without, the controls over data quality and integrity, and the dependence of key decisions on data reliability.",
        "Whether artificial intelligence, advanced automation, or other material digital technologies influence operations or decisions (for example pricing, credit, hiring, quality, or safety), and whether such systems are governed through human oversight, validation, and accountability, or operate ungoverned.",
      ]),
      q("8.3", "State business continuity and disaster recovery posture.", [
        "Whether a Business Continuity Plan exists (Yes / No).",
        "Whether the plan has been exercised through tabletop or live simulation, as distinct from existing only on paper.",
        "Date of last BCP test and key findings.",
        "Recovery Time Objective for critical operations.",
        "Recovery Point Objective for critical systems.",
        "Whether IT disaster recovery is documented separately from the BCP.",
        "For critical cloud and SaaS services: exit and portability, data recoverability, and the ability to restore operations if the provider fails or terminates service.",
      ]),
      q("8.4", "State technology incident history.", [
        "Material IT incidents or system outages in the last three years.",
        "Duration, financial impact, and operational impact of each.",
        "Whether incidents triggered regulatory notification obligations.",
        "Cyber attacks, data breaches, and privacy incidents in the last three years, recorded as distinct events where material, with impact and any regulatory or data-protection notification made.",
        "If none, state clearly.",
      ]),
    ],
  },
];

/* ──────────────────────────────────────────────────────────────────────────
 * PILLAR 1 - Sector Supplements (loaded only when the sector matches)
 * ────────────────────────────────────────────────────────────────────────── */
const hq = (ref: string, text: string, guidance: string[]) =>
  q(ref, text, guidance, { sector: "HOSP" });
const fq = (ref: string, text: string, guidance: string[]) =>
  q(ref, text, guidance, { sector: "F&B" });
const cq = (ref: string, text: string, evidenceDoc: string) =>
  q(ref, text, [`Supporting evidence: ${evidenceDoc}`], { sector: "CONST" });

export const PILLAR_1_SECTOR: Record<
  "Hospital" | "F&B" | "Construction",
  QuestionnaireSection[]
> = {
  Hospital: [
    {
      key: "hosp-clinical-governance",
      title: "H1. Clinical Governance & Medical Oversight",
      feeds: "Governance & Culture, Quality, Regulatory Risk",
      questions: [
        hq("H1.1", "State the clinical governance structure.", [
          "Whether a formal Clinical Governance Committee or equivalent exists (Yes / No).",
          "Composition: clinical leadership, medical board representation, executive management.",
          "Meeting frequency and whether minutes are formally recorded.",
          "Whether clinical governance reports to the Board or only to executive management.",
        ]),
        hq("H1.2", "State medical board and department head oversight.", [
          "Whether a Medical Board or Medical Advisory Committee exists (Yes / No).",
          "Authority of the Medical Board: advisory versus decision-making.",
          "Whether department heads have defined accountability for clinical quality and safety.",
          "Whether clinical credentialing and privileging is formally governed.",
        ]),
        hq("H1.3", "State clinical incident reporting discipline.", [
          "Whether a formal clinical incident reporting system exists (Yes / No).",
          "Whether incidents are classified by severity: near miss, adverse event, sentinel event.",
          "Reporting rate per 1,000 patient-days (if tracked).",
          "Whether incident reports are reviewed at governance level and findings actioned.",
          "Whether there is a culture of non-punitive reporting (Yes / No).",
        ]),
        hq("H1.4", "State infection prevention and control posture.", [
          "Whether a formal Infection Prevention and Control (IPC) program exists.",
          "Whether healthcare-associated infection (HAI) rates are tracked and reported.",
          "Whether IPC compliance is audited and findings addressed.",
          "Whether any outbreak or IPC failure has occurred in the last three years.",
        ]),
      ],
    },
    {
      key: "hosp-licensing",
      title: "H2. Licensing, Accreditation & Regulatory Compliance",
      feeds: "Regulatory, Quality, Reputational Risk",
      questions: [
        hq("H2.1", "State licensing and MoH compliance status.", [
          "Operating license: issuing authority, expiry date, renewal conditions.",
          "Most recent MoH inspection: date, findings, corrective actions required.",
          "Whether any conditional licensing, warning notice, or formal penalty has been received in the last three years.",
          "Whether pending regulatory changes affect license conditions or operational scope.",
        ]),
        hq("H2.2", "State international accreditation status.", [
          "Whether JCI, ACHS, or equivalent international accreditation is held (Yes / No).",
          "Accreditation body, scope, and expiry date.",
          "Most recent accreditation survey: date, score, areas of concern.",
          "Whether accreditation drives payer relationships, insurance reimbursement, or patient referrals.",
          "Whether loss of accreditation would materially affect revenue.",
        ]),
        hq("H2.3", "State regulatory reporting and correspondence governance.", [
          "Whether a defined process exists for managing regulatory correspondence (Yes / No).",
          "Named individual responsible for regulatory submissions and responses.",
          "Whether all regulatory deadlines are tracked and met.",
          "Whether any regulatory correspondence is currently outstanding or overdue.",
        ]),
      ],
    },
    {
      key: "hosp-malpractice",
      title: "H3. Malpractice, Insurance & Legal Exposure",
      feeds: "Financial, Legal & Regulatory, Reputational Risk",
      questions: [
        hq("H3.1", "State malpractice and clinical negligence exposure.", [
          "Number of active malpractice or clinical negligence claims.",
          "Total estimated financial exposure across active claims.",
          "Whether claims are individually reserved and by whom.",
          "Number of claims settled in the last three years and total settlement cost.",
        ]),
        hq("H3.2", "State clinical insurance coverage.", [
          "Whether professional indemnity or clinical negligence insurance is in place (Yes / No).",
          "Coverage limits per claim and in aggregate.",
          "Whether coverage is occurrence-based or claims-made.",
          "Whether the policy covers all clinical staff, including contracted consultants.",
          "Claims notification discipline: whether insurer is notified as required.",
        ]),
        hq("H3.3", "State financial provisioning for clinical liabilities.", [
          "Whether provisions for outstanding claims are recorded in the financial statements.",
          "Adequacy of provisions relative to estimated total exposure.",
          "Whether an actuarial assessment of clinical liability has been conducted.",
          "Whether any uninsured or underinsured exposure exists.",
        ]),
      ],
    },
    {
      key: "hosp-clinical-ops",
      title: "H4. Clinical Operations & Critical Unit Exposure",
      feeds: "Operational, Quality, Crisis & Continuity Risk",
      questions: [
        hq("H4.1", "State ICU and critical care capacity and risk.", [
          "Licensed ICU bed count versus operational capacity.",
          "Whether ICU occupancy regularly exceeds 85% (Yes / No).",
          "Whether a surge capacity plan exists for mass casualty or outbreak scenarios.",
          "Whether critical care staffing meets regulatory minimum ratios at all times.",
        ]),
        hq("H4.2", "State clinical staffing dependency.", [
          "Licensed clinical headcount by specialty: physicians, nurses, allied health.",
          "Whether any specialty is single-physician dependent.",
          "Whether locum or contracted clinical staff cover critical roles.",
          "Whether clinical credentialing is current for all practicing staff.",
        ]),
        hq("H4.3", "State EMR and clinical IT dependency.", [
          "EMR system in use and vendor support status.",
          "Whether EMR is a single point of failure for clinical operations.",
          "Whether a downtime procedure exists and is tested.",
          "Maximum acceptable EMR downtime before patient safety is materially at risk.",
          "Whether EMR holds data subject to health data protection regulation.",
          "Whether networked or connected medical devices (for example infusion pumps, imaging systems, patient monitors) form part of the critical clinical estate, their exposure to cyber compromise or failure, and whether device security and the associated patient-safety risk are actively governed.",
        ]),
        hq("H4.4", "State medical supply chain and import dependency.", [
          "Whether any critical medical supplies are single-sourced or import-dependent.",
          "Inventory buffer for critical consumables: days of supply on hand.",
          "Whether supply chain disruption has affected clinical operations in the last three years.",
          "Whether alternative supply arrangements exist for critical items.",
        ]),
      ],
    },
  ],
  "F&B": [
    {
      key: "fnb-operational-structure",
      title: "F1. Multi-Branch Operational Structure",
      feeds: "Operational, Strategic, Third-Party & Dependency Risk",
      questions: [
        fq("F1.1", "State the branch and outlet structure.", [
          "Total number of operational branches or outlets.",
          "Owned versus franchised breakdown (number and %).",
          "Geographic distribution: city, region, country.",
          "Whether any single branch accounts for more than 30% of total revenue.",
        ]),
        fq("F1.2", "State central kitchen dependency.", [
          "Whether a central kitchen or commissary exists (Yes / No).",
          "Percentage of menu items produced centrally versus branch-level.",
          "Number of branches dependent on the central kitchen.",
          "Maximum downtime the business can absorb if the central kitchen is unavailable.",
          "Whether a backup production facility exists.",
        ]),
        fq("F1.3", "State franchise governance and control.", [
          "Whether franchise agreements define operational standards, quality controls, and compliance obligations.",
          "How standards compliance is monitored across franchised outlets.",
          "Whether franchisees are subject to the same food safety and regulatory obligations as owned outlets.",
          "Whether any franchise agreement is at renewal risk within the next 12 months.",
        ]),
        fq("F1.4", "State utility and infrastructure dependency.", [
          "Dependency on continuous power supply for refrigeration, cooking, and POS operations.",
          "Whether backup power (generator) exists at branch level or central kitchen.",
          "Water supply dependency and risk of interruption.",
          "Operational impact if power or water is unavailable for 4 hours, 24 hours, 72 hours.",
        ]),
      ],
    },
    {
      key: "fnb-supply-chain",
      title: "F2. Supply Chain & Ingredient Concentration",
      feeds: "Operational, Financial, Third-Party & Dependency Risk",
      questions: [
        fq("F2.1", "State ingredient and raw material supplier concentration.", [
          "Top 5 ingredient suppliers by annual spend (% of total procurement).",
          "Whether any single supplier accounts for more than 40% of a critical ingredient category.",
          "Contractual protection: long-term agreements, SLAs, penalty clauses.",
          "Whether alternative suppliers exist and time required to switch.",
        ]),
        fq("F2.2", "State cold chain and logistics dependency.", [
          "Logistics providers responsible for temperature-controlled delivery.",
          "Whether cold chain is owned, contracted, or third-party.",
          "Maximum acceptable delivery delay before product integrity is compromised.",
          "Incident history: cold chain failures in the last three years.",
        ]),
        fq("F2.3", "State menu concentration and substitution risk.", [
          "Whether the menu is heavily dependent on a small number of ingredients (identify top 3).",
          "Whether any core ingredient is subject to price volatility, import restriction, or seasonal shortage.",
          "Whether menu engineering allows substitution without brand or quality impact.",
          "Whether a menu change requires regulatory re-approval.",
        ]),
      ],
    },
    {
      key: "fnb-food-safety",
      title: "F3. Food Safety, Quality & Regulatory Compliance",
      feeds: "Regulatory, Quality, Reputational Risk",
      questions: [
        fq("F3.1", "State food safety governance and certification.", [
          "Whether HACCP certification is in place (Yes / No). State scope and expiry.",
          "Whether ISO 22000 or equivalent food safety management system is adopted.",
          "Frequency of internal food safety audits.",
          "Who conducts audits: internal quality team, third-party auditor, or regulator.",
        ]),
        fq("F3.2", "State health authority inspection record.", [
          "Regulatory authority responsible for food safety inspection in each jurisdiction.",
          "Inspection frequency per outlet or kitchen.",
          "Findings from the most recent inspection: ratings, violations, corrective actions required.",
          "Whether any outlet has received a warning, closure notice, or formal penalty in the last three years.",
        ]),
        fq("F3.3", "State food safety incident history.", [
          "Material food safety incidents in the last five years: contamination, illness complaint, allergen failure.",
          "Financial impact and operational response for each.",
          "Whether incidents resulted in regulatory action, media coverage, or brand damage.",
          "Whether post-incident corrective action was formally documented and implemented.",
        ]),
        fq("F3.4", "State labeling, allergen, and regulatory compliance posture.", [
          "Whether allergen labeling complies with applicable jurisdiction requirements.",
          "Whether calorie or nutritional labeling is required and in place.",
          "Whether pending regulatory changes to food labeling or safety standards are tracked.",
          "Named compliance officer or function responsible for regulatory monitoring.",
        ]),
      ],
    },
    {
      key: "fnb-brand-realestate",
      title: "F4. Brand Vulnerability & Real Estate Exposure",
      feeds: "Reputational, Strategic, Financial Risk",
      questions: [
        fq("F4.1", "State brand vulnerability exposure.", [
          "Whether the brand has experienced a viral negative event in the last three years (social media, media, review platforms).",
          "Whether a food safety or hygiene incident has resulted in public or media attention.",
          "Whether the brand is consumer-facing to the extent that a single incident could affect multiple outlets.",
          "Whether a crisis communications protocol exists and is tested.",
        ]),
        fq("F4.2", "State real estate and lease exposure.", [
          "Total number of leased premises.",
          "Lease expiry profile: number of leases expiring within 12 months, 24 months, and 36 months.",
          "Whether any lease is in a location critical to brand visibility or revenue contribution.",
          "Whether early termination clauses or landlord break rights create operational risk.",
          "Total lease liability as a proportion of annual revenue.",
        ]),
      ],
    },
  ],
  Construction: [
    {
      key: "const-project-delivery",
      title: "C1. Project Delivery & Schedule Discipline",
      feeds: "Operational, Strategic, Financial Risk",
      questions: [
        cq("C1.1", "State the active project portfolio: total number of projects, aggregate contract value, and average project duration. Identify the largest single project as a percentage of total backlog.", "Project register + backlog schedule."),
        cq("C1.2", "State the schedule performance of the last five completed projects: planned vs actual completion date, days of slippage, and primary cause of delay.", "Project closeout reports."),
        cq("C1.3", "Confirm whether stage-gate reviews are mandated at defined milestones (tender approval, mobilization, 50% completion, handover) and whether sign-off is documented and retained.", "Stage-gate review records."),
        cq("C1.4", "State the liquidated damages exposure across the active portfolio: aggregate LD ceiling per active contract and LDs incurred or accrued in the last 24 months.", "Contract register + LD log."),
        cq("C1.5", "Confirm whether a documented Extension of Time (EOT) and variation order protocol exists, identifying the authority empowered to issue, approve, and certify each.", "EOT and VO procedure document."),
      ],
    },
    {
      key: "const-cost-bonding",
      title: "C2. Cost, Financial Exposure & Bonding",
      feeds: "Financial, Operational, Strategic Risk",
      questions: [
        cq("C2.1", "State the cost performance of the last five completed projects: budgeted vs actual cost, % overrun or underrun, and primary driver of variance.", "Project cost reconciliations."),
        cq("C2.2", "State the aggregate value of bonds and guarantees outstanding (performance, advance payment, retention, parent company) and confirm whether this aggregate is monitored against a Board-approved ceiling.", "Bond schedule + Board minutes."),
        cq("C2.3", "State the certified-but-unpaid receivables position: total value, ageing profile, and concentration by owner or client. Identify any single owner exceeding 30% of receivables.", "Aged receivables report."),
        cq("C2.4", "Confirm whether project-level cash flow forecasting is performed at defined cadence and whether it integrates retention balances, certified receivables, and committed subcontractor liabilities.", "Cash flow forecasting protocol."),
        cq("C2.5", "State whether any active project is currently forecast to complete at a loss, and identify the projected loss against contract value.", "Forecast-at-completion (FAC) report."),
        cq("C2.6", "State whether any active project is delivered through a joint venture or consortium, and where so, confirm the liability basis (joint and several, or several) and the exposure the business would carry if a partner defaulted or became insolvent mid-project.", "Joint venture or consortium agreement."),
      ],
    },
    {
      key: "const-subcontractor",
      title: "C3. Contractor, Subcontractor & Supply Chain Dependency",
      feeds: "Third-Party & Dependency, Operational, Quality Risk",
      questions: [
        cq("C3.1", "Confirm whether a documented prequalification protocol exists for subcontractors and suppliers, covering financial standing, HSE record, prior performance, and sanctions or PEP screening.", "Prequalification procedure + vendor master file."),
        cq("C3.2", "State the subcontractor concentration profile: identify any single subcontractor accounting for more than 25% of subcontracted value across the active portfolio.", "Subcontract register."),
        cq("C3.3", "Confirm whether back-to-back contractual provisions (pay-when-paid, liability flow-down, indemnities, LD pass-through) are reviewed and approved by Legal before subcontract execution.", "Subcontract approval workflow."),
        cq("C3.4", "State the supply chain concentration for critical materials: identify any single material category dependent on a single supplier or single country of origin exceeding 50% of volume.", "Procurement records + material category analysis."),
        cq("C3.5", "State the history of subcontractor default or replacement events in the last 36 months: number of events, financial impact, and schedule impact.", "Subcontractor default log."),
      ],
    },
    {
      key: "const-hse-permitting",
      title: "C4. HSE, Regulatory & Permitting",
      feeds: "Quality, Legal & Regulatory, Reputational, Crisis & Continuity Risk",
      questions: [
        cq("C4.1", "State HSE performance over the last 36 months: TRIR, LTIR, fatalities, and number of major or life-altering incidents across owned and contractor workforce.", "HSE statistics dashboard + incident register."),
        cq("C4.2", "Confirm whether stop-work authority is documented, extends across the contractor chain, and has been exercised in the last 12 months. State the number of exercises.", "Stop-work authority procedure + exercise log."),
        cq("C4.3", "State the permit and license inventory across active projects: total permits required, permits in force, permits pending, and any permit that has been delayed, suspended, or revoked in the last 24 months.", "Permit register."),
        cq("C4.4", "State the environmental compliance position: confirm whether any enforcement notice, fine, or remediation order has been issued in the last 36 months and disclose the financial and operational impact.", "Regulatory correspondence file."),
        cq("C4.5", "Confirm whether a documented incident escalation protocol exists requiring notification to executive leadership within defined hours of a fatal incident, regulatory notice, or owner termination notice.", "Incident escalation protocol."),
        cq("C4.6", "State whether any active project is currently subject to a regulatory investigation, owner-issued notice of default, or formal claim exceeding 5% of contract value.", "Regulatory and contractual notices register."),
      ],
    },
  ],
};

/** Pillar 1 sector supplement for a given engagement sector (empty if none). */
export function getSectorSections(sector?: string): QuestionnaireSection[] {
  if (sector && sector in PILLAR_1_SECTOR) {
    return PILLAR_1_SECTOR[sector as keyof typeof PILLAR_1_SECTOR];
  }
  return [];
}

/* ──────────────────────────────────────────────────────────────────────────
 * PILLAR 2 - Governance Diagnostic (12 sections, evidence required)
 * Section list from P2_Diagnostic_Interface_Screen2. Questions are placeholders.
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
