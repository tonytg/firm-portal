"use client";

import { useState } from "react";
import { Upload, Lock } from "lucide-react";
import type { QuestionnaireSection } from "@/lib/questionnaire";
import type { Role } from "@/lib/types";

/**
 * Shared questionnaire renderer for Pillar 1 Intake and Pillar 2 Diagnostic.
 *
 * Behaviour from the specs:
 *  - Question block = question text + (evidence required) + input field.
 *  - Buttons: Save · Submit Section · Edit · Submit Diagnostic.
 *  - Advisor may reopen sections (Edit) if needed.
 *  - Advisor-only questions are hidden from the client (handled upstream by
 *    filtering; this component renders whatever sections it is given).
 *
 * State is demo-local for now; submissions will call server actions later.
 */
type SectionStatus = "draft" | "submitted";

export function QuestionnaireForm({
  sections,
  role,
  submitAllLabel,
}: {
  sections: QuestionnaireSection[];
  role: Role;
  /** "Submit Intake" (P1) or "Submit Diagnostic" (P2). */
  submitAllLabel: string;
}) {
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>(
    Object.fromEntries(sections.map((s) => [s.key, "draft"])),
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});

  const allSubmitted = sections.every((s) => statuses[s.key] === "submitted");

  return (
    <div className="space-y-5">
      {sections.map((section) => {
        const status = statuses[section.key];
        const submitted = status === "submitted";
        return (
          <section
            key={section.key}
            className="overflow-hidden rounded-lg border bg-surface"
          >
            <div className="flex items-center justify-between gap-3 border-b bg-surface-muted px-5 py-3">
              <div className="min-w-0">
                <h3 className="font-display text-base font-semibold">
                  {section.title}
                </h3>
                {role === "advisor" && section.feeds && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Feeds: {section.feeds}
                  </p>
                )}
                {section.evidenceNote && (
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Evidence required: {section.evidenceNote}
                  </p>
                )}
              </div>
              <span
                className={
                  submitted
                    ? "rounded-full bg-status-completed/10 px-2.5 py-1 text-xs font-medium text-status-completed"
                    : "rounded-full bg-status-progress/15 px-2.5 py-1 text-xs font-medium text-status-progress"
                }
              >
                {submitted ? "Submitted" : "Draft"}
              </span>
            </div>

            <div className="space-y-5 p-5">
              {section.questions.map((q) => (
                <div key={q.id}>
                  <label className="block text-sm font-medium">
                    {q.ref && (
                      <span className="mr-2 font-mono text-xs text-muted-foreground">
                        {q.ref}
                      </span>
                    )}
                    {q.text}
                    {q.ifApplicable && (
                      <span className="ml-2 rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        If applicable
                      </span>
                    )}
                    {q.advisorOnly && role === "advisor" && (
                      <span className="ml-2 rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy">
                        Advisor only
                      </span>
                    )}
                    {q.placeholder && (
                      <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-normal uppercase tracking-wide text-accent">
                        placeholder
                      </span>
                    )}
                  </label>
                  {q.guidance && q.guidance.length > 0 && (
                    <ul className="mt-1.5 list-disc space-y-0.5 pl-5 text-xs text-muted-foreground">
                      {q.guidance.map((g, i) => (
                        <li key={i}>{g}</li>
                      ))}
                    </ul>
                  )}
                  <textarea
                    rows={2}
                    disabled={submitted && role === "client"}
                    value={answers[q.id] ?? ""}
                    onChange={(e) =>
                      setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                    }
                    placeholder="Your response…"
                    className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent disabled:opacity-60"
                  />
                  {q.evidenceRequired && (
                    <button
                      type="button"
                      disabled={submitted && role === "client"}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload evidence
                    </button>
                  )}
                </div>
              ))}

              {/* Section actions */}
              <div className="flex items-center gap-2 pt-1">
                {!submitted ? (
                  <>
                    <button
                      type="button"
                      className="rounded-md border px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setStatuses((s) => ({
                          ...s,
                          [section.key]: "submitted",
                        }))
                      }
                      className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white transition hover:bg-navy-700"
                    >
                      Submit Section
                    </button>
                  </>
                ) : (
                  // Edit: clients are locked after submit; advisor may reopen.
                  (role === "advisor" && (
                    <button
                      type="button"
                      onClick={() =>
                        setStatuses((s) => ({ ...s, [section.key]: "draft" }))
                      }
                      className="rounded-md border px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted"
                    >
                      Edit (reopen section)
                    </button>
                  )) || (
                    <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                      <Lock className="h-3.5 w-3.5" /> Locked after submission
                    </span>
                  )
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* Submit all */}
      <div className="flex items-center justify-between rounded-lg border border-dashed bg-surface p-5">
        <p className="text-sm text-muted-foreground">
          {allSubmitted
            ? "All sections submitted. Ready to submit."
            : "Submit every section before final submission."}
        </p>
        <button
          type="button"
          disabled={!allSubmitted}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitAllLabel}
        </button>
      </div>
    </div>
  );
}
