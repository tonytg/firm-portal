"use client";

import { useFormStatus } from "react-dom";

/** Submit button with a pending state (uses the enclosing form's status). */
export function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-navy px-4 py-2 text-sm font-medium text-white transition hover:bg-navy-700 disabled:opacity-70"
    >
      {pending && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
      )}
      {pending ? "Signing in…" : "Sign in"}
    </button>
  );
}
