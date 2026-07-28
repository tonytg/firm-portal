import Link from "next/link";
import { signOut } from "@/app/auth/actions";
import type { Role } from "@/lib/types";

/**
 * Portal shell header. Shows the signed-in user and a sign-out control.
 * (The demo role switch is gone; role now comes from the authenticated session.)
 */
export function PortalHeader({
  role,
  userName,
}: {
  role: Role;
  userName?: string;
}) {
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

        <div className="flex items-center gap-4 text-sm">
          {userName && (
            <span className="hidden items-center gap-2 text-white/70 sm:inline-flex">
              {userName}
              {role === "advisor" && (
                <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  Advisor
                </span>
              )}
            </span>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20 hover:text-white"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
