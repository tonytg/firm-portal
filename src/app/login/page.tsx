import { signIn } from "@/app/auth/actions";
import { SubmitButton } from "./submit-button";

export const metadata = { title: "Sign in - IMPACT Portal" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-navy px-6 py-16">
      <div className="w-full max-w-sm rounded-xl border bg-surface p-8 shadow-sm">
        <div className="mb-6 text-center">
          <span className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-md bg-accent font-display text-xl font-bold text-navy">
            I
          </span>
          <h1 className="font-display text-xl font-semibold">IMPACT Portal</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            Risk, Governance &amp; Crisis Advisory
          </p>
        </div>
        <form action={signIn} className="space-y-4">
          <label className="block text-sm font-medium">
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          <label className="block text-sm font-medium">
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm outline-none focus:border-accent"
            />
          </label>
          {error && (
            <p className="rounded-md bg-status-locked/10 px-3 py-2 text-sm text-status-locked">
              {error}
            </p>
          )}
          <SubmitButton />
        </form>
        <p className="mt-6 text-center text-[11px] text-muted-foreground">
          Accounts are created by your advisor. Contact IMPACT if you need access.
        </p>
      </div>
    </div>
  );
}
