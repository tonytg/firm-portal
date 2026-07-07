import type { QuestionnaireSection } from "@/lib/questionnaire";

/**
 * Read-only review of every questionnaire section and question implemented in
 * the portal. Lets the client verify completeness against the approved
 * specification without needing an active engagement or edit access.
 */
export interface ReviewGroup {
  label: string;
  note?: string;
  sections: QuestionnaireSection[];
}

export function QuestionnaireReview({ groups }: { groups: ReviewGroup[] }) {
  const totalSections = groups.reduce((n, g) => n + g.sections.length, 0);
  const totalQuestions = groups.reduce(
    (n, g) => n + g.sections.reduce((m, s) => m + s.questions.length, 0),
    0,
  );

  return (
    <div className="space-y-8">
      <div className="rounded-lg border-l-4 border-l-accent bg-surface-muted p-4 text-sm text-muted-foreground">
        <strong className="text-foreground">Read-only review.</strong> Every
        questionnaire section and question currently implemented in the portal is
        listed below for verification against the approved specification. Wording
        marked <em>placeholder</em> is pending final copy; the section structure
        is what will ship.
        <span className="mt-1 block text-xs font-medium text-foreground">
          {groups.length} sets · {totalSections} sections · {totalQuestions} questions
        </span>
      </div>

      {groups.map((group) => {
        const qCount = group.sections.reduce(
          (m, s) => m + s.questions.length,
          0,
        );
        return (
          <section key={group.label} className="space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b pb-2">
              <h2 className="font-display text-lg font-semibold">
                {group.label}
              </h2>
              <span className="text-xs text-muted-foreground">
                {group.sections.length} sections · {qCount} questions
              </span>
            </div>
            {group.note && (
              <p className="text-sm text-muted-foreground">{group.note}</p>
            )}
            <div className="space-y-4">
              {group.sections.map((section) => (
                <div
                  key={section.key}
                  className="overflow-hidden rounded-lg border bg-surface"
                >
                  <div className="border-b bg-surface-muted px-5 py-3">
                    <h3 className="font-display text-base font-semibold">
                      {section.title}
                    </h3>
                  </div>
                  <ol className="divide-y">
                    {section.questions.map((q, i) => (
                      <li
                        key={q.id}
                        className="flex items-start gap-3 px-5 py-3 text-sm"
                      >
                        <span className="mt-0.5 shrink-0 font-mono text-xs text-muted-foreground">
                          {i + 1}.
                        </span>
                        <span className="flex-1">
                          {q.text}
                          <span className="ml-2 inline-flex gap-1 align-middle">
                            {q.evidenceRequired && (
                              <span className="rounded bg-navy/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-navy">
                                evidence
                              </span>
                            )}
                            {q.placeholder && (
                              <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent">
                                placeholder
                              </span>
                            )}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
