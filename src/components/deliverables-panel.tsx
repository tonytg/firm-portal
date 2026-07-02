"use client";

import { Download, Lock, FileText, CheckCircle2 } from "lucide-react";
import type { Engagement, Role, Deliverable } from "@/lib/types";
import {
  canReleaseDeliverable,
  isDeliverableDownloadable,
} from "@/lib/engagement";

/**
 * Controlled Release / Output screen (Pillar 1 Output, Pillar 2 Screen 5).
 *
 * LOCKED rules enforced here:
 *  - Executive Brief / Summary is released first.
 *  - Final PDFs unlock only after the validation/walkthrough gate is satisfied.
 *  - Deliverables are PDF only — no editable formats are ever shared.
 *  - Download eligibility is computed via engagement.ts (server-truth);
 *    the advisor controls the `released` flag.
 */
const GATE_LABEL: Record<Deliverable["releaseGate"], string> = {
  executive_first: "Released first (via portal)",
  after_validation: "After Validation",
  after_walkthrough: "After Walkthrough",
};

export function DeliverablesPanel({
  engagement,
  role,
}: {
  engagement: Engagement;
  role: Role;
}) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border-l-4 border-l-accent bg-surface-muted p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Controlled release.</strong> The
        Executive Brief is released first via the portal. The full architecture
        is explained in a mandatory walkthrough meeting. Final deliverables
        unlock only afterwards — all in <strong>PDF only</strong>. No editable
        formats are ever shared.
      </div>

      <ul className="space-y-3">
        {engagement.deliverables.map((d) => {
          const gateOpen = canReleaseDeliverable(engagement, d);
          const downloadable = isDeliverableDownloadable(engagement, d);

          return (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium">{d.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.format} · {GATE_LABEL[d.releaseGate]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Advisor controls release; release only permitted when gate open */}
                {role === "advisor" && (
                  <button
                    disabled={!gateOpen}
                    title={
                      gateOpen
                        ? "Release this deliverable to the client"
                        : "Gate not satisfied yet (complete the required meeting first)"
                    }
                    className="rounded-md border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {d.released ? "Released ✓" : "Release"}
                  </button>
                )}

                {downloadable ? (
                  <a
                    href={d.fileUrl ?? "#"}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-accent-soft"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-md bg-surface-muted px-3 py-1.5 text-sm text-muted-foreground">
                    <Lock className="h-4 w-4" />
                    {role === "client" ? "Locked" : "Not released"}
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-status-completed" />
        Download links are gated server-side — a locked deliverable cannot be
        reached even with a direct URL.
      </p>
    </div>
  );
}
