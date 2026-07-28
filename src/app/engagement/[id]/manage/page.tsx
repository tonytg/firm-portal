import { notFound } from "next/navigation";
import { getEngagementById } from "@/lib/data";
import { PILLAR_LABELS } from "@/lib/pillars";
import { ScreenShell } from "@/components/screen-shell";
import { AdvisorConsole } from "@/components/advisor-console";
import { requireAdmin } from "@/lib/auth";

/**
 * Advisor Control Panel route - admin only. requireAdmin redirects clients.
 */
export default async function ManagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireAdmin();

  const engagement = await getEngagementById(id);
  if (!engagement) notFound();

  return (
    <ScreenShell
      role="advisor"
      userName={session.profile.full_name ?? session.profile.email ?? undefined}
      eyebrow={PILLAR_LABELS[engagement.pillar]}
      title="Advisor Control Panel"
      subtitle={`${engagement.title} · ${engagement.clientName}`}
    >
      <AdvisorConsole engagement={engagement} />
    </ScreenShell>
  );
}
