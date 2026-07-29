"use client";

import { useState, useTransition } from "react";
import { Download, Lock, FileText, CheckCircle2 } from "lucide-react";
import type { Engagement, Role, Deliverable } from "@/lib/types";
import {
  canReleaseDeliverable,
  isDeliverableDownloadable,
  isFinalPaymentDue,
} from "@/lib/engagement";
import { setDeliverableReleased } from "@/app/engagement/actions";

/**
 * Controlled Release / Output screen. Locked rules:
 *  - Executive Brief releases first; final PDFs unlock after the
 *    walkthrough/validation gate AND final payment; PDF only.
 *  - Release eligibility is computed from engagement state; the advisor toggles
 *    the released flag, which persists to the database.
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
  const [deliverables, setDeliverables] = useState(engagement.deliverables);
  const [pending, startTransition] = useTransition();
  const eng: Engagement = { ...engagement, deliverables };
  const finalPaymentDue = isFinalPaymentDue(eng);

  function toggleRelease(id: string, current: boolean) {
    const next = !current;
    setDeliverables((list) =>
      list.map((d) => (d.id === id ? { ...d, released: next } : d)),
    );
    startTransition(() =>
      void setDeliverableReleased(id, next, engagement.id),
    );
  }

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

      {finalPaymentDue && (
        <div className="rounded-lg border-l-4 border-l-status-locked bg-status-locked/5 p-4 text-sm">
          <strong className="text-status-locked">Final payment due.</strong> The
          walkthrough / delivery session is complete. Final deliverables release
          as soon as final payment is confirmed.
        </div>
      )}

      <ul className="space-y-3">
        {deliverables.map((d) => {
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
                {role === "advisor" && (
                  <button
                    disabled={!gateOpen || pending}
                    onClick={() => toggleRelease(d.id, d.released)}
                    title={
                      gateOpen
                        ? "Release this deliverable to the client"
                        : "Gate not satisfied yet (complete the required meeting / final payment first)"
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
