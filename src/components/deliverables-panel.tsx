"use client";

import { useState } from "react";
import { Download, Lock, FileText, CheckCircle2, BadgeDollarSign } from "lucide-react";
import type { Engagement, Role, Deliverable } from "@/lib/types";
import {
  canReleaseDeliverable,
  isDeliverableDownloadable,
  isFinalPaymentDue,
} from "@/lib/engagement";

/**
 * Controlled Release / Output screen (Pillar 1 Output, Pillar 2 Screen 5).
 *
 * LOCKED rules enforced here:
 *  - Executive Brief / Summary is released first.
 *  - Final PDFs unlock only after the validation/walkthrough gate is satisfied.
 *  - Deliverables are PDF only - no editable formats are ever shared.
 *  - Download eligibility is computed via engagement.ts (server-truth);
 *    the advisor controls the `released` flag.
 */
const GATE_LABEL: Record<Deliverable["releaseGate"], string> = {
  executive_first: "Released first (via portal)",
  after_validation: "After Validation",
  after_walkthrough: "After Walkthrough & Final Payment",
};

export function DeliverablesPanel({
  engagement,
  role,
}: {
  engagement: Engagement;
  role: Role;
}) {
  // Final payment is advisor-controlled. Demo-local state so the advisor can
  // confirm it here (on the Output page) and see the final deliverables unlock.
  const [finalPaid, setFinalPaid] = useState(engagement.finalPaymentReceived);
  const eng: Engagement = { ...engagement, finalPaymentReceived: finalPaid };
  const finalPaymentDue = isFinalPaymentDue(eng);

  return (
    <div className="space-y-6">
      <div className="rounded-lg border-l-4 border-l-accent bg-surface-muted p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Controlled release.</strong> The
        Executive Brief is released first via the portal. The full architecture
        is explained in a mandatory walkthrough / delivery session. Final payment
        then falls due, and the final deliverables unlock only once it is
        received, all in <strong>PDF only</strong>. No editable formats are ever
        shared.
      </div>

      {/* Advisor: confirm final payment here (mirrors the Advisor Control Panel) */}
      {role === "advisor" && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-surface p-4">
          <div className="flex items-start gap-3">
            <BadgeDollarSign className="mt-0.5 h-5 w-5 text-accent" />
            <div>
              <p className="font-medium">Final payment</p>
              <p className="text-xs text-muted-foreground">
                Confirm final payment to release the final deliverables (after the
                walkthrough / delivery session). Also available in the Advisor
                Control Panel.
              </p>
            </div>
          </div>
          <button
            onClick={() => setFinalPaid((v) => !v)}
            className={
              finalPaid
                ? "rounded-md bg-status-completed px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-navy hover:text-white"
            }
          >
            {finalPaid ? "Final payment received ✓" : "Mark final payment received"}
          </button>
        </div>
      )}

      {finalPaymentDue && (
        <div className="rounded-lg border-l-4 border-l-status-locked bg-status-locked/5 p-4 text-sm">
          <strong className="text-status-locked">Final payment due.</strong> The
          walkthrough / delivery session is complete. Final deliverables release
          as soon as final payment is confirmed.
        </div>
      )}

      <ul className="space-y-3">
        {engagement.deliverables.map((d) => {
          const gateOpen = canReleaseDeliverable(eng, d);
          const downloadable = isDeliverableDownloadable(eng, d);

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
        Download links are gated server-side - a locked deliverable cannot be
        reached even with a direct URL.
      </p>
    </div>
  );
}
