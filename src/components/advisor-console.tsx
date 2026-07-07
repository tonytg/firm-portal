"use client";

import { useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import type { Engagement, StageStatus } from "@/lib/types";
import { isActivated } from "@/lib/types";
import { getStageDefinitions } from "@/lib/pillars";
import { canReleaseDeliverable } from "@/lib/engagement";
import { StatusBadge } from "./status-badge";

/**
 * Dedicated Advisor Control Panel for one engagement.
 *
 * Consolidates the advisor's manual controls in one surface, reflecting the
 * LOCKED workflow: stages do not auto-advance, the advisor marks completion,
 * and releases are gated. Actions are demo-local until server actions land.
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
  const defs = getStageDefinitions(engagement.pillar);
  const active = isActivated(engagement);

  function setStageStatus(key: string, status: StageStatus) {
    setEngagement((e) => ({
      ...e,
      stages: e.stages.some((s) => s.key === key)
        ? e.stages.map((s) => (s.key === key ? { ...s, status } : s))
        : [...e.stages, { key, status }],
    }));
  }

  function toggleActivation(
    field:
      | "loeSigned"
      | "phase1PaymentReceived"
      | "activationOverride"
      | "finalPaymentReceived",
  ) {
    setEngagement((e) => ({ ...e, [field]: !e[field] }));
  }

  function toggleRelease(id: string) {
    setEngagement((e) => ({
      ...e,
      deliverables: e.deliverables.map((d) =>
        d.id === id ? { ...d, released: !d.released } : d,
      ),
    }));
  }

  return (
    <div className="space-y-8">
      {/* Activation */}
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
          <Toggle label="LoE signed" on={engagement.loeSigned} onClick={() => toggleActivation("loeSigned")} />
          <Toggle label="Phase 1 paid" on={engagement.phase1PaymentReceived} onClick={() => toggleActivation("phase1PaymentReceived")} />
          <Toggle label="Override activation" on={engagement.activationOverride} onClick={() => toggleActivation("activationOverride")} accent />
        </div>
      </section>

      {/* Stage control */}
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
                    onChange={(e) =>
                      setStageStatus(def.key, e.target.value as StageStatus)
                    }
                    className="rounded-md border bg-background px-2 py-1.5 text-sm outline-none focus:border-accent"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                  <Link
                    href={`/engagement/${engagement.id}/${def.key}?role=advisor`}
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

      {/* Commercial hold */}
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
            onClick={() => toggleActivation("finalPaymentReceived")}
            accent
          />
        </div>
      </section>

      {/* Deliverable releases */}
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
                  disabled={!gateOpen}
                  onClick={() => toggleRelease(d.id)}
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
}: {
  label: string;
  on: boolean;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={
        on
          ? accent
            ? "rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy"
            : "rounded-md bg-status-completed px-4 py-2 text-sm font-medium text-white"
          : "rounded-md border px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-surface-muted"
      }
    >
      {on ? "✓ " : ""}
      {label}
    </button>
  );
}
