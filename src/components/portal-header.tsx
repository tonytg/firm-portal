import Link from "next/link";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Portal shell header. Includes a DEMO role switch (advisor / client) so both
 * perspectives can be reviewed before real authentication is wired in.
 * In production this is replaced by the authenticated user's role.
 */
export function PortalHeader({ role }: { role: Role }) {
  return (
    <header className="bg-navy text-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/dashboard" className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-accent font-display text-lg font-bold text-navy">
            I
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg font-semibold">
              IMPACT Portal
            </span>
            <span className="block text-[11px] tracking-wide text-white/60">
              Risk, Governance &amp; Crisis Advisory
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-4">
          <RoleSwitch current={role} />
        </div>
      </div>
    </header>
  );
}

function RoleSwitch({ current }: { current: Role }) {
  const roles: { value: Role; label: string }[] = [
    { value: "client", label: "Client view" },
    { value: "advisor", label: "Advisor view" },
  ];
  return (
    <div className="flex items-center gap-1 rounded-full bg-white/10 p-1 text-xs">
      {roles.map((r) => (
        <Link
          key={r.value}
          href={`/dashboard?role=${r.value}`}
          className={cn(
            "rounded-full px-3 py-1.5 font-medium transition",
            current === r.value
              ? "bg-accent text-navy"
              : "text-white/70 hover:text-white",
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
