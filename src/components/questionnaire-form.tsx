"use client";

import { useState, useTransition } from "react";
import { Upload, Lock, CheckCircle2 } from "lucide-react";
import type { QuestionnaireSection } from "@/lib/questionnaire";
import type { Role } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import {
  saveResponses,
  submitQuestionnaire,
  reopenSubmission,
} from "@/app/engagement/actions";

/**
 * Shared questionnaire renderer for Pillar 1 Intake and Pillar 2 Diagnostic.
 * Save persists answers; Submit records the submission; both go to the database
 * through server actions (RLS scopes writes to the user's own engagement).
 * The advisor may reopen a submission. Stages stay advisor-controlled.
 */
type SectionStatus = "draft" | "submitted";

export function QuestionnaireForm({
  sections,
  role,
  submitAllLabel,
  engagementId,
  stage,
  initialAnswers,
  initialSubmittedAt,
}: {
  sections: QuestionnaireSection[];
  role: Role;
  submitAllLabel: string;
  engagementId: string;
  stage: string;
  initialAnswers: Record<string, string>;
  initialSubmittedAt: string | null;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>(initialAnswers);
  const [statuses, setStatuses] = useState<Record<string, SectionStatus>>(
    Object.fromEntries(sections.map((s) => [s.key, "draft"])),
  );
  const [submittedAt, setSubmittedAt] = useState<string | null>(initialSubmittedAt);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const isSubmitted = submittedAt !== null;
  const allSubmitted = sections.every((s) => statuses[s.key] === "submitted");

  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      }
    });
  };

  const save = () =>
    run(async () => {
      const { savedAt } = await saveResponses(engagementId, stage, answers);
      setSavedAt(savedAt);
    });

  const submitAll = () =>
    run(async () => {
      await saveResponses(engagementId, stage, answers);
      const { submittedAt } = await submitQuestionnaire(engagementId, stage);
      setSubmittedAt(submittedAt);
    });

  const reopen = () =>
    run(async () => {
      await reopenSubmission(engagementId, stage);
      setSubmittedAt(null);
    });

  return (
    <div className="space-y-5">
      {isSubmitted && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border-l-4 border-l-status-completed bg-status-completed/5 p-4 text-sm">
          <p className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-status-completed" />
            <span>
              <strong className="text-foreground">Submitted</strong> on{" "}
              {formatDate(submittedAt)}. Your responses have been recorded and
              sent to your advisor for review.
            </span>
          </p>
          {role === "advisor" && (
            <button
              type="button"
              onClick={reopen}
              disabled={pending}
              className="rounded-md border px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-50"
            >
              Reopen submission
            </button>
          )}
        </div>
      )}

      {sections.map((section) => {
        const submitted = statuses[section.key] === "submitted";
        const locked = role === "client" && (submitted || isSubmitted);
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
                    disabled={locked}
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
                      disabled={locked}
                      className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-1.5 text-xs text-muted-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      Upload evidence
                    </button>
                  )}
                </div>
              ))}

              <div className="flex flex-wrap items-center gap-2 pt-1">
                {!submitted ? (
                  <>
                    <button
                      type="button"
                      onClick={save}
                      disabled={pending || (role === "client" && isSubmitted)}
                      className="rounded-md border px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={isSubmitted}
                      onClick={() =>
                        setStatuses((s) => ({ ...s, [section.key]: "submitted" }))
                      }
                      className="rounded-md bg-navy px-3 py-1.5 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-50"
                    >
                      Submit Section
                    </button>
                  </>
                ) : role === "advisor" || !isSubmitted ? (
                  <button
                    type="button"
                    onClick={() =>
                      setStatuses((s) => ({ ...s, [section.key]: "draft" }))
                    }
                    className="rounded-md border px-3 py-1.5 text-sm font-medium transition hover:bg-surface-muted"
                  >
                    Edit (reopen section)
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Lock className="h-3.5 w-3.5" /> Locked after submission
                  </span>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {error && (
        <p className="rounded-md bg-status-locked/10 px-3 py-2 text-sm text-status-locked">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-dashed bg-surface p-5">
        <div className="text-sm text-muted-foreground">
          {isSubmitted ? (
            <span>This questionnaire has been submitted.</span>
          ) : allSubmitted ? (
            <span>All sections submitted. Ready to submit the questionnaire.</span>
          ) : (
            <span>Submit every section before final submission.</span>
          )}
          {savedAt && (
            <span className="mt-1 block text-xs">
              Draft saved at {formatDate(savedAt)}.
            </span>
          )}
        </div>
        <button
          type="button"
          disabled={!allSubmitted || isSubmitted || pending}
          onClick={submitAll}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-navy transition hover:bg-accent-soft disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitted ? "Submitted ✓" : pending ? "Working…" : submitAllLabel}
        </button>
      </div>
    </div>
  );
}
