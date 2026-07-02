import Link from "next/link";
import type { Engagement, Role } from "@/lib/types";
import { isActivated } from "@/lib/types";
import { getStageDefinitions, PILLAR_LABELS } from "@/lib/pillars";
import {
  getProgressPercent,
  getStageState,
  clientFacingStatus,
  isStageVisibleToClient,
  canClientAccessStage,
} from "@/lib/engagement";
import { StatusBadge } from "./status-badge";
import { cn } from "@/lib/utils";

/**
 * Screen 1 — Dashboard engagement card.
 * Shared across both pillars; renders the engagement header, progress bar,
 * and the milestone table with status + per-row action, filtered by role.
 */
export function EngagementCard({
  engagement,
  role,
}: {
  engagement: Engagement;
  role: Role;
}) {
  const defs = getStageDefinitions(engagement.pillar);
  const progress = getProgressPercent(engagement);
  const active = isActivated(engagement);

  const visibleStages =
    role === "advisor"
      ? defs
      : defs.filter((d) => isStageVisibleToClient(d));

  return (
    <section className="overflow-hidden rounded-xl border bg-surface shadow-sm">
      {/* Header */}
      <div className="border-b bg-surface-muted px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-accent">
              {PILLAR_LABELS[engagement.pillar]}
            </p>
            <h2 className="mt-1 font-display text-xl font-semibold">
              {engagement.title}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Client: {engagement.clientName} · Advisor:{" "}
              {engagement.advisorName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                active
                  ? "bg-status-completed/10 text-status-completed"
                  : "bg-status-locked/10 text-status-locked",
              )}
            >
              {active ? "Active" : "Awaiting Activation"}
            </span>
            {role === "advisor" && (
              <Link
                href={`/engagement/${engagement.id}/manage?role=advisor`}
                className="rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white transition hover:bg-navy-700"
              >
                Manage
              </Link>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
            <span>Engagement progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-border">
            <div
              className="h-full rounded-full bg-accent transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Timelines are indicative and may vary with client responsiveness,
            scheduling, and engagement requirements.
          </p>
        </div>
      </div>

      {/* Milestone table */}
      <div className="divide-y">
        {visibleStages.map((def) => {
          const state = getStageState(engagement, def.key);
          const status =
            role === "advisor"
              ? state.status
              : clientFacingStatus(def, state);
          const accessible =
            role === "advisor" || canClientAccessStage(engagement, def);

          return (
            <div
              key={def.key}
              className="flex flex-wrap items-center justify-between gap-3 px-6 py-4"
            >
              <div className="min-w-0">
                <p className="font-medium">{def.title}</p>
                <p className="text-sm text-muted-foreground">
                  {def.description}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={status} />
                <StageAction
                  engagementId={engagement.id}
                  stageKey={def.key}
                  accessible={accessible}
                  hasMeeting={def.hasMeeting}
                  status={status}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function StageAction({
  engagementId,
  stageKey,
  accessible,
  hasMeeting,
  status,
}: {
  engagementId: string;
  stageKey: string;
  accessible: boolean;
  hasMeeting: boolean;
  status: string;
}) {
  if (!accessible) {
    return <span className="w-20 text-right text-sm text-muted-foreground">—</span>;
  }
  const label = hasMeeting && status === "scheduled" ? "Schedule" : "Open";
  return (
    <Link
      href={`/engagement/${engagementId}/${stageKey}`}
      className="w-20 rounded-md border border-navy/15 px-3 py-1.5 text-center text-sm font-medium text-navy transition hover:bg-navy hover:text-white"
    >
      {label}
    </Link>
  );
}
