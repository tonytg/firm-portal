import Link from "next/link";
import { PortalHeader } from "@/components/portal-header";
import { requireAdmin } from "@/lib/auth";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { createClientAccount, createEngagement } from "@/app/admin/actions";

export const metadata = { title: "Admin - Users & Engagements" };

const field =
  "mt-1 w-full rounded-md border bg-background px-3 py-2 outline-none focus:border-accent";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string; ok?: string }>;
}) {
  const session = await requireAdmin();
  const { created, error, ok } = await searchParams;
  const admin = await createAdminSupabase();

  const [clientsRes, profilesRes, engagementsRes] = await Promise.all([
    admin.from("clients").select("id, name, sector").order("name"),
    admin.from("profiles").select("id, role, client_id, email").order("created_at"),
    admin.from("engagements").select("id, title, client_id").order("created_at"),
  ]);
  const clients = clientsRes.data ?? [];
  const profiles = profilesRes.data ?? [];
  const engagements = engagementsRes.data ?? [];
  const [createdEmail, createdPw] = (created ?? "").split("|");

  return (
    <div className="flex flex-1 flex-col">
      <PortalHeader
        role="advisor"
        userName={session.profile.full_name ?? session.profile.email ?? undefined}
      />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-block text-sm text-muted-foreground transition hover:text-foreground"
        >
          &larr; Back to dashboard
        </Link>
        <h1 className="font-display text-2xl font-semibold">
          Admin · Users &amp; Engagements
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Create client logins and engagements. Only the admin can create
          accounts; there is no public sign-up.
        </p>

        {created && (
          <div className="mt-4 rounded-lg border-l-4 border-l-status-completed bg-status-completed/5 p-4 text-sm">
            <strong className="text-foreground">
              Account created for {createdEmail}.
            </strong>{" "}
            Temporary password:{" "}
            <code className="rounded bg-surface-muted px-1.5 py-0.5 font-mono">
              {createdPw}
            </code>
            <br />
            Share it securely with the client. They sign in with it.
          </div>
        )}
        {ok && (
          <div className="mt-4 rounded-lg bg-status-completed/10 p-3 text-sm text-status-completed">
            {ok}
          </div>
        )}
        {error && (
          <div className="mt-4 rounded-lg bg-status-locked/10 p-3 text-sm text-status-locked">
            {error}
          </div>
        )}

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-lg border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              Create client account
            </h2>
            <form action={createClientAccount} className="mt-3 space-y-3 text-sm">
              <label className="block font-medium">
                Email
                <input name="email" type="email" required className={field} />
              </label>
              <label className="block font-medium">
                Full name / contact
                <input name="fullName" className={field} />
              </label>
              <label className="block font-medium">
                Existing organization
                <select name="clientId" className={field}>
                  <option value="">— New organization —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-medium">
                …or new organization name
                <input name="orgName" className={field} placeholder="e.g. Cedar Hospitality Group" />
              </label>
              <button className="rounded-md bg-navy px-4 py-2 font-medium text-white transition hover:bg-navy-700">
                Create account
              </button>
            </form>
          </section>

          <section className="rounded-lg border bg-surface p-5">
            <h2 className="font-display text-lg font-semibold">
              Create engagement
            </h2>
            <form action={createEngagement} className="mt-3 space-y-3 text-sm">
              <label className="block font-medium">
                Organization
                <select name="clientId" required className={field}>
                  <option value="">— Select —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block font-medium">
                Pillar
                <select name="pillar" required className={field}>
                  <option value="pillar_1">Pillar 1 - Risk Assessment</option>
                  <option value="pillar_2">Pillar 2 - Governance Framework</option>
                </select>
              </label>
              <label className="block font-medium">
                Title
                <input name="title" required className={field} placeholder="e.g. Risk Assessment - Pillar 1" />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block font-medium">
                  Industry
                  <input name="industry" className={field} />
                </label>
                <label className="block font-medium">
                  Sector
                  <select name="sector" className={field}>
                    <option value="">—</option>
                    <option value="Hospital">Hospital</option>
                    <option value="F&B">F&amp;B</option>
                    <option value="Construction">Construction</option>
                    <option value="Other">Other</option>
                  </select>
                </label>
              </div>
              <button className="rounded-md bg-navy px-4 py-2 font-medium text-white transition hover:bg-navy-700">
                Create engagement
              </button>
            </form>
          </section>
        </div>

        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold">Organizations</h2>
          <div className="mt-3 space-y-3">
            {clients.length === 0 && (
              <p className="text-sm text-muted-foreground">No organizations yet.</p>
            )}
            {clients.map((c) => {
              const users = profiles.filter((p) => p.client_id === c.id);
              const engs = engagements.filter((e) => e.client_id === c.id);
              return (
                <div key={c.id} className="rounded-lg border bg-surface p-4">
                  <p className="font-medium">
                    {c.name}{" "}
                    {c.sector && (
                      <span className="ml-1 text-xs text-muted-foreground">
                        {c.sector}
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Users: {users.map((u) => u.email).join(", ") || "none"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Engagements: {engs.map((e) => e.title).join(", ") || "none"}
                  </p>
                </div>
              );
            })}
            <div className="rounded-lg border border-dashed bg-surface p-4">
              <p className="text-xs text-muted-foreground">
                Admins:{" "}
                {profiles
                  .filter((p) => p.role === "admin")
                  .map((p) => p.email)
                  .join(", ") || "none"}
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
