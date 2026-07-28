import "server-only";
import { redirect } from "next/navigation";
import { createServerSupabase } from "./supabase/server";
import type { Role } from "./types";

export interface Profile {
  id: string;
  role: "admin" | "client";
  client_id: string | null;
  full_name: string | null;
  email: string | null;
}

export interface SessionUser {
  userId: string;
  profile: Profile;
  /** UI role: the admin drives the advisor experience. */
  uiRole: Role;
}

/** Authoritative session check. Returns null when not signed in. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, role, client_id, full_name, email")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    userId: user.id,
    profile: profile as Profile,
    uiRole: (profile as Profile).role === "admin" ? "advisor" : "client",
  };
}

/** Require a signed-in user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

/** Require an admin; redirect clients away. */
export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireUser();
  if (session.profile.role !== "admin") redirect("/dashboard");
  return session;
}
