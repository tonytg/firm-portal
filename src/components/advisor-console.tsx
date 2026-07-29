"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Engagement, StageStatus } from "@/lib/types";
import { isActivated } from "@/lib/types";
import { getStageDefinitions } from "@/lib/pillars";
import { canReleaseDeliverable } from "@/lib/engagement";
import { StatusBadge } from "./status-badge";
import {
  setEngagementFlag,
  setStageStatus,
  setDeliverableReleased,
  type EngagementFlag,
} from "@/app/engagement/actions";

/**
 * Advisor Control Panel for one engagement. Every control persists to the
 * database via server actions (admin-only, enforced by RLS). Local state is
 * updated optimistically for immediate feedback.
 */
const STATUS_OPTIONS: StageStatus[] = [
  "not_started",
  "in_progress",
  "under_analysis",
  "scheduled",
  "completed",
];

export function AdvisorConsole({ engagement: initial }: { engagement: Engagement }) {
  const [engagement, setEngagement] = useState<Engagement>(initial);
  const [pending, startTransition] = useTransition();
  const defs = getStageDefinitions(engagement.pillar);
  const active = isActivated(engagement);

  const run = (fn: () => Promise<void>) => startTransition(() => void fn());

  function toggleFlag(
    uiField: "loeSigned" | "phase1PaymentReceived" | "finalPaymentReceived" | "activationOverride",
    dbField: EngagementFlag,
  ) {
    const next = !engagement[uiField];
    setEngagement((e) => ({ ...e, [uiField]: next }));
    run(() => setEngagementFlag(engagement.id, dbField, next));
  }

  function changeStage(key: string, status: StageStatus) {
    setEngagement((e) => ({
      ...e,
      stages: e.stages.some((s) => s.key === key)
        ? e.stages.map((s) => (s.key === key ? { ...s, status } : s))
        : [...e.stages, { key, status }],
    }));
    run(() => setStageStatus(engagement.id, key, status));
  }

  function toggleRelease(id: string, current: boolean) {
    const next = !current;
    setEngagement((e) => ({
      ...e,
      deliverables: e.deliverables.map((d) =>
        d.id === id ? { ...d, released: next } : d,
      ),
    }));
    run(() => setDeliverableReleased(id, next, engagement.id));
  }

  return (
    <div className="space-y-8">
      <section className="rounded-lg border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Activation</h2>
          <span
            className={
              active
                ? "rounded-full bg-status-completed/10 px-3 py-1 text-xs font-semibold text-status-completed"
                : "rounded-full bg-status-locked/10 px-3 py-1 text-xs font-semibold text-status-locked"
            }
          >
            {active ? "Active" : "Inactive"}
          </span>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <Toggle label="LoE signed" on={engagement.loeSigned} disabled={pending} onClick={() => toggleFlag("loeSigned", "loe_signed")} />
          <Toggle label="Phase 1 paid" on={engagement.phase1PaymentReceived} disabled={pending} onClick={() => toggleFlag("phase1PaymentReceived", "phase1_payment_received")} />
          <Toggle label="Override activation" on={engagement.activationOverride} disabled={pending} onClick={() => toggleFlag("activationOverride", "activation_override")} accent />
        </div>
      </section>

      <section className="rounded-lg border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Stage Control</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Stages do not auto-advance. Set status manually; completion is advisor-controlled.
        </p>
        <div className="mt-4 divide-y">
          {defs.map((def) => {
            const current =
              engagement.stages.find((s) => s.key === def.key)?.status ??
              "not_started";
            return (
              <div
                key={def.key}
                className="flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{def.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {def.visibility === "internal"
                      ? "Internal only"
                      : def.visibility === "status_only"
                        ? "Visible as status only"
                        : def.visibility === "pre_read"
                          ? "Pre-read only"
                          : "Client-facing"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={current} />
                  <select
                    value={current}
                    disabled={pending}
                    onChange={(e) =>
                      changeStage(def.key, e.target.value as StageStatus)
                    }
                    className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent disabled:opacity-60"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/engagement/${engagement.id}/${def.key}`}
                    className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-sm text-navy transition hover:bg-surface-muted"
                  >
                    Open <ExternalLink className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-lg border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Commercial</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Final deliverables are held until final payment is received (after the
          walkthrough / delivery session).
        </p>
        <div className="mt-4">
          <Toggle
            label="Final payment received"
            on={engagement.finalPaymentReceived}
            disabled={pending}
            onClick={() => toggleFlag("finalPaymentReceived", "final_payment_received")}
            accent
          />
        </div>
      </section>

      <section className="rounded-lg border bg-surface p-5">
        <h2 className="font-display text-lg font-semibold">Deliverable Releases</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          PDF only. Release is permitted only once the gate (validation /
          walkthrough) is satisfied.
        </p>
        <ul className="mt-4 space-y-2">
          {engagement.deliverables.map((d) => {
            const gateOpen = canReleaseDeliverable(engagement, d);
            return (
              <li
                key={d.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-4 py-3"
              >
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.format} · gate: {d.releaseGate.replace(/_/g, " ")}
                    {!gateOpen && " · gate not satisfied"}
                  </p>
                </div>
                <button
                  disabled={!gateOpen || pending}
                  onClick={() => toggleRelease(d.id, d.released)}
                  className="rounded-md border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {d.released ? "Released ✓ (unrelease)" : "Release"}
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function Toggle({
  label,
  on,
  onClick,
  accent,
  disabled,
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  accent?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        (on
          ? accent
            ? "rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy"
            : "rounded-md bg-status-completed px-4 py-2 text-sm font-medium text-white"
          : "rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted") +
        " disabled:opacity-50"
      }
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}
