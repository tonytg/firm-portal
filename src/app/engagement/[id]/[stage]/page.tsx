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
import type { Role } from "@/lib/types";
import { ScreenShell } from "@/components/screen-shell";
import { ActivationPanel } from "@/components/activation-panel";
import { QuestionnaireForm } from "@/components/questionnaire-form";
import { MeetingPanel } from "@/components/meeting-panel";
import { DeliverablesPanel } from "@/components/deliverables-panel";
import {
  PILLAR_1_INTAKE,
  PILLAR_1_SECTOR,
  PILLAR_2_DIAGNOSTIC,
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

      {/* Pillar 1 — Intake (industry + core + conditional sector) */}
      {stage === "intake" && (
        <div className="space-y-6">
          <IndustryHeader
            industry={engagement.industry}
            sector={engagement.sector}
          />
          <QuestionnaireForm
            role={role}
            submitAllLabel="Submit Intake"
            sections={[
              ...PILLAR_1_INTAKE,
              ...(engagement.sector === "Hospital"
                ? PILLAR_1_SECTOR.Hospital
                : engagement.sector === "F&B"
                  ? PILLAR_1_SECTOR["F&B"]
                  : []),
            ]}
          />
        </div>
      )}

      {/* Pillar 2 — Governance Diagnostic */}
      {stage === "questionnaire" && (
        <div className="space-y-6">
          <IndustryHeader
            industry={engagement.industry}
            sector={engagement.sector}
          />
          <QuestionnaireForm
            role={role}
            submitAllLabel="Submit Diagnostic"
            sections={PILLAR_2_DIAGNOSTIC}
          />
        </div>
      )}

      {/* Meeting stages (Workshop / Calibration / Validation / Walkthrough / Board) */}
      {def.hasMeeting && meeting && (
        <div className="space-y-6">
          {/* Pillar 1 Risk Identification Workshop extras (Screen 3) */}
          {engagement.pillar === "pillar_1" && stage === "diagnosis" && (
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

          {/* Advisor-only Risk Capture — never rendered for clients */}
          {engagement.pillar === "pillar_1" &&
            stage === "diagnosis" &&
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
