import { notFound } from "next/navigation";
import { EyeOff } from "lucide-react";
import { getEngagement } from "@/lib/mock-data";
import { PILLAR_LABELS } from "@/lib/pillars";
import type { Role } from "@/lib/types";
import { ScreenShell } from "@/components/screen-shell";
import { AdvisorConsole } from "@/components/advisor-console";

/**
 * Advisor Control Panel route - advisor only. A client reaching this URL is
 * blocked server-side.
 */
export default async function ManagePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ role?: string }>;
}) {
  const { id } = await params;
  const { role: roleParam } = await searchParams;
  const role: Role = roleParam === "advisor" ? "advisor" : "client";

  const engagement = getEngagement(id);
  if (!engagement) notFound();

  if (role !== "advisor") {
    return (
      <ScreenShell
        role={role}
        eyebrow={PILLAR_LABELS[engagement.pillar]}
        title="Advisor Control Panel"
      >
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-surface py-16 text-center">
          <EyeOff className="h-8 w-8 text-muted-foreground" />
          <p className="mt-4 max-w-md text-sm text-muted-foreground">
            This control panel is restricted to the advisor.
          </p>
        </div>
      </ScreenShell>
    );
  }

  return (
    <ScreenShell
      role={role}
      eyebrow={PILLAR_LABELS[engagement.pillar]}
      title="Advisor Control Panel"
      subtitle={`${engagement.title} · ${engagement.clientName}`}
    >
      <AdvisorConsole engagement={engagement} />
    </ScreenShell>
  );
}
