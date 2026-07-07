import Link from "next/link";
import { PortalHeader } from "@/components/portal-header";
import { EngagementCard } from "@/components/engagement-card";
import { MOCK_ENGAGEMENTS } from "@/lib/mock-data";
import type { Role } from "@/lib/types";

/**
 * Screen 1 - Shared Dashboard.
 * One dashboard across both pillars; a client sees all their engagements with
 * shared visibility, while the advisor sees the full internal view.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleParam } = await searchParams;
  const role: Role = roleParam === "advisor" ? "advisor" : "client";

  // Demo: a single client's engagements. Real version filters by auth identity.
  const engagements = MOCK_ENGAGEMENTS;

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader role={role} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "advisor"
              ? "Advisor control view - full engagement visibility, including internal stages."
              : "Your engagements with IMPACT. Progress updates as each stage is completed."}
          </p>
          <Link
            href={`/review/questionnaires?role=${role}`}
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy underline-offset-2 hover:underline"
          >
            Review the full approved questionnaires (read-only)
          </Link>
        </div>

        <div className="space-y-8">
          {engagements.map((e) => (
            <EngagementCard key={e.id} engagement={e} role={role} />
          ))}
        </div>
      </main>
      <footer className="border-t bg-surface py-4 text-center text-xs text-muted-foreground">
        Confidential - IMPACT Advisory. Controlled delivery portal.
      </footer>
    </div>
  );
}
