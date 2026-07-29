"use client";

import { useState, useTransition } from "react";
import { Download, Lock, FileText, CheckCircle2, Upload } from "lucide-react";
import type { Engagement, Role, Deliverable } from "@/lib/types";
import {
  canReleaseDeliverable,
  isDeliverableDownloadable,
  isFinalPaymentDue,
} from "@/lib/engagement";
import { setDeliverableReleased } from "@/app/engagement/actions";
import { uploadDeliverable, getDeliverableUrl } from "@/app/engagement/storage-actions";

/**
 * Controlled Release / Output screen. The advisor uploads the PDF and toggles
 * release (gated); the client downloads via a short-lived signed URL only once
 * the deliverable is released and its gate (walkthrough + final payment) is met.
 * File presence is read from props so it reflects uploads after revalidation;
 * the release flag is optimistic.
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
  const [releasedMap, setReleasedMap] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(engagement.deliverables.map((d) => [d.id, d.released])),
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const eng: Engagement = {
    ...engagement,
    deliverables: engagement.deliverables.map((d) => ({
      ...d,
      released: releasedMap[d.id] ?? d.released,
    })),
  };
  const finalPaymentDue = isFinalPaymentDue(eng);

  function toggleRelease(id: string, current: boolean) {
    const next = !current;
    setReleasedMap((m) => ({ ...m, [id]: next }));
    startTransition(() => void setDeliverableReleased(id, next, engagement.id));
  }

  function download(id: string) {
    setError(null);
    getDeliverableUrl(id, engagement.id)
      .then((url) => window.open(url, "_blank"))
      .catch((e) => setError(e instanceof Error ? e.message : "Download failed."));
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

      {error && (
        <p className="rounded-md bg-status-locked/10 px-3 py-2 text-sm text-status-locked">
          {error}
        </p>
      )}

      <ul className="space-y-3">
        {engagement.deliverables.map((d) => {
          const released = releasedMap[d.id] ?? d.released;
          const merged = { ...d, released };
          const gateOpen = canReleaseDeliverable(eng, merged);
          const downloadable = isDeliverableDownloadable(eng, merged);
          const hasFile = Boolean(d.fileUrl);

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
                    {role === "advisor" && (hasFile ? " · PDF attached" : " · no PDF")}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {role === "advisor" && (
                  <>
                    <form action={uploadDeliverable} className="flex items-center gap-1">
                      <input type="hidden" name="deliverableId" value={d.id} />
                      <input type="hidden" name="engagementId" value={engagement.id} />
                      <input
                        type="file"
                        name="file"
                        accept="application/pdf"
                        required
                        className="w-40 text-xs file:mr-1 file:rounded file:border-0 file:bg-surface-muted file:px-2 file:py-1"
                      />
                      <button
                        type="submit"
                        className="inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs font-medium transition hover:bg-surface-muted"
                      >
                        <Upload className="h-3.5 w-3.5" /> PDF
                      </button>
                    </form>
                    <button
                      disabled={!gateOpen || pending}
                      onClick={() => toggleRelease(d.id, released)}
                      className="rounded-md border border-navy/20 px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-navy hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {released ? "Released ✓" : "Release"}
                    </button>
                  </>
                )}

                {downloadable ? (
                  <button
                    onClick={() => download(d.id)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-navy transition hover:bg-accent-soft"
                  >
                    <Download className="h-4 w-4" />
                    Download
                  </button>
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
        Downloads are gated server-side and served via short-lived signed links -
        a locked deliverable cannot be reached even with a direct URL.
      </p>
    </div>
  );
}
