import Link from "next/link";
import { PortalHeader } from "@/components/portal-header";
import { EngagementCard } from "@/components/engagement-card";
import { listEngagements } from "@/lib/data";
import { requireUser } from "@/lib/auth";

/**
 * Screen 1 - Shared Dashboard.
 * A client sees their own engagements (RLS-scoped); the advisor/admin sees all.
 */
export default async function DashboardPage() {
  const { profile, uiRole: role } = await requireUser();
  const engagements = await listEngagements();

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader
        role={role}
        userName={profile.full_name ?? profile.email ?? undefined}
      />
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
        <div className="mb-6">
          <h1 className="font-display text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {role === "advisor"
              ? "Advisor control view - full engagement visibility, including internal stages."
              : "Your engagements with IMPACT. Progress updates as each stage is completed."}
          </p>
          <Link
            href="/review/questionnaires"
            className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-navy underline-offset-2 hover:underline"
          >
            Review the full approved questionnaires (read-only)
          </Link>
        </div>

        <div className="space-y-8">
          {engagements.length === 0 ? (
            <p className="rounded-lg border border-dashed bg-surface p-8 text-center text-sm text-muted-foreground">
              {role === "advisor"
                ? "No engagements yet."
                : "You have no engagements yet. Your advisor will set these up."}
            </p>
          ) : (
            engagements.map((e) => (
              <EngagementCard key={e.id} engagement={e} role={role} />
            ))
          )}
        </div>
      </main>
      <footer className="border-t bg-surface py-4 text-center text-xs text-muted-foreground">
        Confidential - IMPACT Advisory. Controlled delivery portal.
      </footer>
    </div>
  );
}
