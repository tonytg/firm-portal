"use client";

import { useState, useTransition } from "react";
import { CheckCircle2, Circle, ShieldCheck } from "lucide-react";
import type { Engagement, Role } from "@/lib/types";
import { setEngagementFlag } from "@/app/engagement/actions";

/**
 * Activation screen. Active only after LoE signature AND Phase 1 payment
 * (advisor may override). Advisor controls persist to the database.
 */
export function ActivationPanel({
  engagement,
  role,
}: {
  engagement: Engagement;
  role: Role;
}) {
  const [loeSigned, setLoe] = useState(engagement.loeSigned);
  const [phase1, setPhase1] = useState(engagement.phase1PaymentReceived);
  const [override, setOverride] = useState(engagement.activationOverride);
  const [pending, startTransition] = useTransition();

  const active = override || (loeSigned && phase1);
  const run = (fn: () => Promise<void>) => startTransition(() => void fn());

  const checks = [
    { label: "Letter of Engagement (LoE) signed", done: loeSigned },
    { label: "Phase 1 payment received", done: phase1 },
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
            ? "Engagement activated - portal access granted."
            : "Awaiting activation - no stage is accessible yet."}
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
        {override && (
          <p className="mt-3 text-xs text-accent">
            Advisor override applied - activation granted outside standard
            requirements.
          </p>
        )}
      </section>

      {role === "advisor" && (
        <section className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed bg-surface p-5">
          <button
            disabled={pending}
            onClick={() => {
              const n = !loeSigned;
              setLoe(n);
              run(() => setEngagementFlag(engagement.id, "loe_signed", n));
            }}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
          >
            {loeSigned ? "LoE Signed ✓" : "Mark LoE Signed"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              const n = !phase1;
              setPhase1(n);
              run(() =>
                setEngagementFlag(engagement.id, "phase1_payment_received", n),
              );
            }}
            className="rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
          >
            {phase1 ? "Phase 1 Paid ✓" : "Mark Phase 1 Paid"}
          </button>
          <button
            disabled={pending}
            onClick={() => {
              const n = !override;
              setOverride(n);
              run(() =>
                setEngagementFlag(engagement.id, "activation_override", n),
              );
            }}
            className="rounded-md border border-accent px-4 py-2 text-sm font-medium text-accent transition hover:bg-accent hover:text-navy disabled:opacity-50"
          >
            {override ? "Override On ✓" : "Override & Activate"}
          </button>
          <p className="w-full text-xs text-muted-foreground">
            Advisor controls activation and user permissions.
          </p>
        </section>
      )}
    </div>
  );
}
