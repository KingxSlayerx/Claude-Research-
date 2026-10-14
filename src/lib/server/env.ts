import "server-only";

/**
 * Server configuration. Secrets are only ever read here, on the server.
 * See .env.example for every variable and docs/DEPLOYMENT.md for setup.
 */

export type StoreKind = "supabase" | "file";

const v = (name: string) => {
  const x = process.env[name];
  return x && x.trim() ? x.trim() : undefined;
};

export const isProduction = process.env.NODE_ENV === "production";

export function supabaseConfig() {
  const url = v("SUPABASE_URL");
  const serviceRoleKey = v("SUPABASE_SERVICE_ROLE_KEY");
  const anonKey = v("SUPABASE_ANON_KEY");
  return url && serviceRoleKey && anonKey ? { url, serviceRoleKey, anonKey } : null;
}

/**
 * Which quote store to use:
 *  - QUOTE_STORE=supabase (or unset with Supabase configured) → Supabase Postgres.
 *  - QUOTE_STORE=file → JSON file on local disk. For development, tests and
 *    single-server self-hosting only; never on serverless hosts.
 *  - Otherwise in development → file; in production → not configured (503).
 */
export function storeKind(): StoreKind | null {
  const explicit = v("QUOTE_STORE");
  if (explicit === "supabase") return supabaseConfig() ? "supabase" : null;
  if (explicit === "file") return "file";
  if (supabaseConfig()) return "supabase";
  return isProduction ? null : "file";
}

export function fileStorePath(): string {
  return v("QUOTE_FILE_PATH") ?? ".data/quotes.json";
}

export function sessionSecret(): string | null {
  const s = v("SESSION_SECRET");
  if (s && s.length >= 32) return s;
  if (!isProduction) return "development-only-session-secret-change-me-0000";
  return null;
}

/** Staff login for the file store (development / single-server only). */
export function localStaff() {
  const email = v("STAFF_EMAIL")?.toLowerCase();
  const passwordHash = v("STAFF_PASSWORD_HASH");
  const name = v("STAFF_NAME") ?? "Showroom";
  return email && passwordHash ? { email, passwordHash, name } : null;
}

/** Set to "1" only when the site sits behind a proxy that sets X-Forwarded-For reliably. */
export const trustProxy = () => v("TRUST_PROXY") === "1";
