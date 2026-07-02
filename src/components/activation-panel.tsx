"use client";

import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import type { Engagement, Role } from "@/lib/types";
import { isActivated } from "@/lib/types";

/**
 * Activation screen. The engagement is active only after LoE signature AND
 * Phase 1 payment (advisor may override). No subsequent stage is accessible
 * before activation, and the advisor controls activation and user access.
 */
export function ActivationPanel({
  engagement,
  role,
}: {
  engagement: Engagement;
  role: Role;
}) {
  const active = isActivated(engagement);

  const checks = [
    { label: "Letter of Engagement (LoE) signed", done: engagement.loeSigned },
    {
      label: "Phase 1 payment received",
      done: engagement.phase1PaymentReceived,
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className={`flex items-center gap-3 rounded-lg p-4 ${
          active
            ? "bg-status-completed/10 text-status-completed"
            : "bg-status-locked/10 text-status-locked"
        }`}
      >
        <ShieldCheck className="h-5 w-5" />
        <span className="font-medium">
          {active
            ? "Engagement activated — portal access granted."
            : "Awaiting activation — no stage is accessible yet."}
        </span>
      </div>

      <section className="rounded-lg border bg-surface p-5">
        <h3 className="font-display text-base font-semibold">
          Activation Requirements
        </h3>
        <ul className="mt-3 space-y-2">
          {checks.map((c) => (
            <li key={c.label} className="flex items-center gap-2 text-sm">
              {c.done ? (
                <CheckCircle2 className="h-4 w-4 text-status-completed" />
              ) : (
                <Circle className="h-4 w-4 text-muted-foreground" />
              )}
              {c.label}
            </li>
          ))}
        </ul>
        {engagement.activationOverride && (
          <p className="mt-3 text-xs text-accent">
            Advisor override applied — activation granted outside standard
            requirements.
          </p>
        )}
      </section>

      {role === "advisor" && (
        <section className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-surface p-5">
          <button className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700">
            Mark LoE Signed
          </button>
          <button className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700">
            Mark Phase 1 Paid
          </button>
          <button className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-navy">
            Override &amp; Activate
          </button>
          <p className="w-full text-xs text-muted-foreground">
            Advisor controls activation and user permissions.
          </p>
        </section>
      )}
    </div>
  );
}
