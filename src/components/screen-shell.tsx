import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Role } from "@/lib/types";
import { PortalHeader } from "./portal-header";

/**
 * Shared chrome for every stage detail screen: portal header, a back link to
 * the dashboard (role-preserving), a title block, and the main content slot.
 */
export function ScreenShell({
  role,
  eyebrow,
  title,
  subtitle,
  children,
}: {
  role: Role;
  eyebrow: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader role={role} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Link
          href={`/dashboard?role=${role}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to dashboard
        </Link>

        <div className="mb-6 border-b pb-5">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-2xl font-semibold">{title}</h1>
          {subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {children}
      </main>
      <footer className="border-t bg-surface py-4 text-center text-xs text-muted-foreground">
        Confidential - IMPACT Advisory. Controlled delivery portal.
      </footer>
    </div>
  );
}

/** A simple status bar row used across meeting / output screens. */
export function StatusBar({
  items,
}: {
  items: { label: string; value: React.ReactNode }[];
}) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="bg-surface px-4 py-3">
          <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
            {it.label}
          </p>
          <p className="mt-0.5 text-sm font-medium">{it.value}</p>
        </div>
      ))}
    </div>
  );
}
