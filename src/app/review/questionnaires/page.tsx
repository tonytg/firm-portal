import { PortalHeader } from "@/components/portal-header";
import {
  QuestionnaireReview,
  type ReviewGroup,
} from "@/components/questionnaire-review";
import {
  PILLAR_1_INTAKE,
  PILLAR_1_SECTOR,
  PILLAR_2_DIAGNOSTIC,
  sectionsForRole,
} from "@/lib/questionnaire";
import type { Role } from "@/lib/types";

/**
 * Questionnaire Review: a read-only library of every questionnaire section and
 * question in the portal, so the client can verify completeness against the
 * approved specification independent of any engagement's state.
 */
export default async function QuestionnaireReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const role: Role = roleParam === "advisor" ? "advisor" : "client";

  const groups: ReviewGroup[] = [
    {
      label: "Pillar 1 : Core Intake",
      sections: sectionsForRole(PILLAR_1_INTAKE, role),
    },
    {
      label: "Pillar 1 : Sector Supplement : Hospital / Healthcare",
      sections: sectionsForRole(PILLAR_1_SECTOR.Hospital, role),
    },
    {
      label: "Pillar 1 : Sector Supplement : F&B",
      sections: sectionsForRole(PILLAR_1_SECTOR["F&B"], role),
    },
    {
      label: "Pillar 1 : Sector Supplement : Construction (ready to activate)",
      sections: sectionsForRole(PILLAR_1_SECTOR.Construction, role),
    },
    {
      label: "Pillar 2 : Governance Diagnostic",
      sections: sectionsForRole(PILLAR_2_DIAGNOSTIC, role),
    },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader role={role} />
      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            Verification
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">
            Questionnaire Review
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            A read-only list of every questionnaire section and question in the
            portal, for review against the approved specification.
          </p>
        </div>
        <QuestionnaireReview groups={groups} />
      </main>
      <footer className="border-t bg-surface py-4 text-center text-xs text-muted-foreground">
        Confidential, IMPACT Advisory. Controlled delivery portal.
      </footer>
    </div>
  );
}
