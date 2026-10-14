import "server-only";
import { createClient } from "@supabase/supabase-js";
import { localStaff, storeKind, supabaseConfig } from "../env";
import { verifyPassword } from "./password";
import { readCookie, SESSION_COOKIE, verifySessionToken, type StaffSession } from "./session";

export type LoginResult = { ok: true; staff: Omit<StaffSession, "exp"> } | { ok: false; reason: "invalid" | "not-staff" | "unconfigured" };

/**
 * Verifies staff credentials.
 *  - Supabase: password checked by Supabase Auth, then the user must be an
 *    active row in `staff_members`.
 *  - File store: a single account from STAFF_EMAIL / STAFF_PASSWORD_HASH.
 */
export async function authenticateStaff(email: string, password: string): Promise<LoginResult> {
  const kind = storeKind();
  const normEmail = email.trim().toLowerCase();
  if (kind === "supabase") {
    const cfg = supabaseConfig()!;
    const auth = createClient(cfg.url, cfg.anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await auth.auth.signInWithPassword({ email: normEmail, password });
    if (error || !data.user) return { ok: false, reason: "invalid" };
    await auth.auth.signOut().catch(() => undefined);
    const member = await getActiveMember(data.user.id);
    if (!member) return { ok: false, reason: "not-staff" };
    return { ok: true, staff: { sub: data.user.id, email: member.email, name: member.name, role: member.role } };
  }
  if (kind === "file") {
    const acct = localStaff();
    if (!acct) return { ok: false, reason: "unconfigured" };
    // Always run the hash check so timing does not reveal whether the email matched.
    const valid = await verifyPassword(password, acct.passwordHash);
    if (!valid || normEmail !== acct.email) return { ok: false, reason: "invalid" };
    return { ok: true, staff: { sub: acct.email, email: acct.email, name: acct.name, role: "admin" } };
  }
  return { ok: false, reason: "unconfigured" };
}

async function getActiveMember(userId: string) {
  const cfg = supabaseConfig();
  if (!cfg) return null;
  const db = createClient(cfg.url, cfg.serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data } = await db
    .from("staff_members")
    .select("email,name,role,active")
    .eq("user_id", userId)
    .maybeSingle<{ email: string; name: string; role: "staff" | "admin"; active: boolean }>();
  return data && data.active ? data : null;
}

/**
 * Returns the signed-in staff member for this request, or null.
 * In Supabase mode the membership is re-checked on every request, so
 * deactivating a staff member takes effect immediately.
 */
export async function requireStaff(req: Request): Promise<StaffSession | null> {
  const session = verifySessionToken(readCookie(req, SESSION_COOKIE));
  if (!session) return null;
  const kind = storeKind();
  if (kind === "supabase") {
    const member = await getActiveMember(session.sub);
    return member ? { ...session, name: member.name, role: member.role } : null;
  }
  if (kind === "file") {
    const acct = localStaff();
    return acct && acct.email === session.email ? session : null;
  }
  return null;
}
