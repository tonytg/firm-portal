import { notFound } from "next/navigation";
import { Lock, EyeOff } from "lucide-react";
import { getEngagement } from "@/lib/mock-data";
import { getStageDefinition, PILLAR_LABELS } from "@/lib/pillars";
import {
  getStageState,
  canClientAccessStage,
  isStageVisibleToClient,
} from "@/lib/engagement";
import { isActivated } from "@/lib/types";
import type { Role, Engagement } from "@/lib/types";
import { ScreenShell } from "@/components/screen-shell";
import { ActivationPanel } from "@/components/activation-panel";
import { QuestionnaireForm } from "@/components/questionnaire-form";
import { MeetingPanel } from "@/components/meeting-panel";
import { DeliverablesPanel } from "@/components/deliverables-panel";
import {
  PILLAR_1_INTAKE,
  PILLAR_2_CORE,
  getSectorSections,
  getP2SectorSections,
  sectionsForRole,
} from "@/lib/questionnaire";
import {
  RiskCapturePanel,
  IntakeSummaryExtract,
} from "@/components/risk-capture-panel";

export default async function StagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; stage: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { id, stage } = await params;
  const { role: roleParam } = await searchParams;
  const role: Role = roleParam === "advisor" ? "advisor" : "client";

  const engagement = getEngagement(id);
  if (!engagement) notFound();

  const def = getStageDefinition(engagement.pillar, stage);
  if (!def) notFound();

  const state = getStageState(engagement, stage);
  const eyebrow = PILLAR_LABELS[engagement.pillar];

  // ── Server-side access enforcement ──────────────────────────────────────
  // A client must never reach internal or status-only content, even by URL.
  if (role === "client") {
    if (!isStageVisibleToClient(def)) {
      return (
        <Blocked
          role={role}
          eyebrow={eyebrow}
          title={def.title}
          icon="hidden"
          message="This is an internal stage performed by the advisor. It is not accessible."
        />
      );
    }
    if (
      stage !== "activation" &&
      !isActivated(engagement)
    ) {
      return (
        <Blocked
          role={role}
          eyebrow={eyebrow}
          title={def.title}
          icon="lock"
          message="This stage becomes accessible once the engagement is activated (LoE signature + Phase 1 payment)."
        />
      );
    }
    if (!canClientAccessStage(engagement, def)) {
      return (
        <Blocked
          role={role}
          eyebrow={eyebrow}
          title={def.title}
          icon="hidden"
          message="This stage is visible as progress only. The advisor is performing this work internally."
        />
      );
    }
  }

  // ── Render the appropriate screen ────────────────────────────────────────
  const meeting = engagement.meetings.find((m) => m.stageKey === stage);
  const meetingStatus = (
    ["not_started", "in_progress", "scheduled", "completed"].includes(
      state.status,
    )
      ? state.status
      : "not_started"
  ) as "not_started" | "in_progress" | "scheduled" | "completed";

  return (
    <ScreenShell role={role} eyebrow={eyebrow} title={def.title} subtitle={def.description}>
      {/* Activation */}
      {stage === "activation" && (
        <ActivationPanel engagement={engagement} role={role} />
      )}

      {/* Pillar 1 - Intake (cover + industry + core + conditional sector) */}
      {stage === "intake" && (
        <div className="space-y-6">
          <IntakeCover engagement={engagement} />
          <IndustryHeader
            industry={engagement.industry}
            sector={engagement.sector}
          />
          <QuestionnaireForm
            role={role}
            submitAllLabel="Submit Intake"
            sections={sectionsForRole(
              [...PILLAR_1_INTAKE, ...getSectorSections(engagement.sector)],
              role,
            )}
          />
        </div>
      )}

      {/* Pillar 2 - Governance Diagnostic (12 core governance sections plus the
          governance module for the engagement's sector) */}
      {stage === "questionnaire" && (
        <div className="space-y-6">
          <IndustryHeader
            industry={engagement.industry}
            sector={engagement.sector}
          />
          <QuestionnaireForm
            role={role}
            submitAllLabel="Submit Diagnostic"
            sections={sectionsForRole(
              [...PILLAR_2_CORE, ...getP2SectorSections(engagement.sector)],
              role,
            )}
          />
        </div>
      )}

      {/* Meeting stages (Workshop / Calibration / Validation / Walkthrough / Board) */}
      {def.hasMeeting && meeting && (
        <div className="space-y-6">
          {/* Pillar 1 Risk Identification Workshop extras (Screen 3) */}
          {engagement.pillar === "pillar_1" && stage === "risk_workshop" && (
            <IntakeSummaryExtract />
          )}

          <MeetingPanel
            meeting={meeting}
            role={role}
            stageStatus={meetingStatus}
            preRead={
              def.visibility === "pre_read"
                ? {
                    title: "Governance Pre-Read",
                    items: [
                      "Risk Appetite overview",
                      "Key tolerance thresholds",
                      "Escalation triggers and authority",
                      "Governance structure summary",
                    ],
                  }
                : undefined
            }
          />

          {/* Advisor-only Risk Capture - never rendered for clients */}
          {engagement.pillar === "pillar_1" &&
            stage === "risk_workshop" &&
            role === "advisor" && (
              <RiskCapturePanel initial={engagement.risks ?? []} />
            )}
        </div>
      )}
      {def.hasMeeting && !meeting && (
        <p className="rounded-lg border border-dashed bg-surface p-5 text-sm text-muted-foreground">
          No session scheduled yet.{" "}
          {role === "advisor"
            ? "Schedule a session to populate this stage."
            : "The advisor will schedule this session."}
        </p>
      )}

      {/* Output / Controlled Release */}
      {(stage === "output" || stage === "controlled_release") && (
        <DeliverablesPanel engagement={engagement} role={role} />
      )}
    </ScreenShell>
  );
}

function IntakeCover({ engagement }: { engagement: Engagement }) {
  const fields: { label: string; value: string; known: boolean }[] = [
    { label: "Client Entity", value: engagement.clientName, known: true },
    { label: "Engagement Reference", value: engagement.id, known: true },
    { label: "Primary Regulatory Authority", value: "To be confirmed", known: false },
    { label: "Most Recent Gross Revenue (pre-VAT)", value: "To be confirmed", known: false },
    { label: "Questionnaire Completed By", value: "To be provided", known: false },
    { label: "Date Submitted", value: "On submission", known: false },
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-3">
        {fields.map((f) => (
          <div key={f.label} className="bg-surface px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {f.label}
            </p>
            <p
              className={`mt-0.5 text-sm font-medium ${f.known ? "" : "text-muted-foreground"}`}
            >
              {f.value}
            </p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border-l-4 border-l-accent bg-surface-muted p-4 text-xs text-muted-foreground">
        <strong className="text-foreground">Instructions.</strong> Answer each
        question with specific facts, numbers, and dates. Where a question does
        not apply, write N/A and state why. Where actual practice differs from
        documented policy, describe the actual practice. Attach supporting
        documents where referenced. Answer group-wide by default; where a
        question applies to one entity only, identify that entity.
      </div>
    </div>
  );
}

function IndustryHeader({
  industry,
  sector,
}: {
  industry?: string;
  sector?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-surface-muted px-5 py-3 text-sm">
      <span className="font-medium">Industry:</span>
      <span className="rounded-full bg-navy px-2.5 py-1 text-xs font-medium text-white">
        {industry ?? "Not selected"}
      </span>
      {sector && sector !== "Other" && (
        <>
          <span className="text-muted-foreground">·</span>
          <span className="text-muted-foreground">
            Sector questionnaire: <strong className="text-foreground">{sector}</strong>
          </span>
        </>
      )}
    </div>
  );
}

function Blocked({
  role,
  eyebrow,
  title,
  message,
  icon,
}: {
  role: Role;
  eyebrow: string;
  title: string;
  message: string;
  icon: "lock" | "hidden";
}) {
  return (
    <ScreenShell role={role} eyebrow={eyebrow} title={title}>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-surface py-16 text-center">
        {icon === "lock" ? (
          <Lock className="h-8 w-8 text-muted-foreground" />
        ) : (
          <EyeOff className="h-8 w-8 text-muted-foreground" />
        )}
        <p className="mt-4 max-w-md text-sm text-muted-foreground">{message}</p>
      </div>
    </ScreenShell>
  );
}
