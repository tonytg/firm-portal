"use client";

import { useState } from "react";
import { Plus, Trash2, EyeOff } from "lucide-react";
import type { RiskItem } from "@/lib/types";

/**
 * Pillar 1 Workshop — Risk Capture (Screen 3).
 *
 * ADVISOR ONLY. The client cannot see or edit this section. The advisor
 * structures risks during the in-person session using Cause → Event → Impact.
 * "Risks Captured" is an auto count shown in the session confirmation.
 *
 * This component is only ever rendered for role === "advisor"; it is also
 * gated server-side so a client can never reach it.
 */
export function RiskCapturePanel({ initial }: { initial: RiskItem[] }) {
  const [risks, setRisks] = useState<RiskItem[]>(initial);
  const [draft, setDraft] = useState({ cause: "", event: "", impact: "" });

  function addRisk() {
    if (!draft.cause && !draft.event && !draft.impact) return;
    setRisks((r) => [...r, { id: crypto.randomUUID(), ...draft }]);
    setDraft({ cause: "", event: "", impact: "" });
  }

  return (
    <section className="rounded-lg border border-accent/40 bg-surface">
      <div className="flex items-center justify-between border-b bg-accent/5 px-5 py-3">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          Risk Capture
          <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[11px] font-medium text-accent">
            <EyeOff className="h-3 w-3" /> Advisor only
          </span>
        </h3>
        <span className="text-sm text-muted-foreground">
          Risks Captured:{" "}
          <strong className="text-foreground">{risks.length}</strong>
        </span>
      </div>

      <div className="p-5">
        <p className="mb-3 text-xs text-muted-foreground">
          Structured as Cause → Event → Impact. Not visible to the client.
        </p>

        {/* Existing risks */}
        <div className="overflow-hidden rounded-md border">
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px bg-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
            <div className="bg-surface-muted px-3 py-2">Cause</div>
            <div className="bg-surface-muted px-3 py-2">Event</div>
            <div className="bg-surface-muted px-3 py-2">Impact</div>
            <div className="bg-surface-muted px-3 py-2" />
          </div>
          {risks.length === 0 && (
            <p className="px-3 py-4 text-sm text-muted-foreground">
              No risks captured yet.
            </p>
          )}
          {risks.map((r) => (
            <div
              key={r.id}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-px border-t bg-border text-sm"
            >
              <div className="bg-surface px-3 py-2">{r.cause}</div>
              <div className="bg-surface px-3 py-2">{r.event}</div>
              <div className="bg-surface px-3 py-2">{r.impact}</div>
              <button
                onClick={() => setRisks((rs) => rs.filter((x) => x.id !== r.id))}
                className="bg-surface px-3 py-2 text-muted-foreground transition hover:text-status-locked"
                aria-label="Remove risk"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add new */}
        <div className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
          <input
            value={draft.cause}
            onChange={(e) => setDraft((d) => ({ ...d, cause: e.target.value }))}
            placeholder="Cause"
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={draft.event}
            onChange={(e) => setDraft((d) => ({ ...d, event: e.target.value }))}
            placeholder="Event"
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <input
            value={draft.impact}
            onChange={(e) => setDraft((d) => ({ ...d, impact: e.target.value }))}
            placeholder="Impact"
            className="rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <button
            onClick={addRisk}
            className="inline-flex items-center gap-1 rounded-md bg-navy px-3 py-2 text-sm font-medium text-white transition hover:bg-navy-700"
          >
            <Plus className="h-4 w-4" /> Add
          </button>
        </div>
      </div>
    </section>
  );
}

/** Read-only intake extract shown at the top of the workshop (visible to both). */
export function IntakeSummaryExtract() {
  const items = [
    "Business Model",
    "Key Dependencies",
    "Governance Structure",
    "Financial Snapshot",
  ];
  return (
    <section className="rounded-lg border bg-surface-muted p-5">
      <h3 className="font-display text-base font-semibold">
        Intake Summary{" "}
        <span className="text-xs font-normal text-muted-foreground">
          (read-only extract)
        </span>
      </h3>
      <ul className="mt-3 grid gap-1 text-sm text-muted-foreground sm:grid-cols-2">
        {items.map((i) => (
          <li key={i}>• {i}</li>
        ))}
      </ul>
    </section>
  );
}
