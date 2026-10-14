import { z } from "zod";
import { authenticateStaff, requireStaff } from "@/lib/server/auth/staff";
import { clearedCookie, createSessionToken, serializeCookie, sessionCookie } from "@/lib/server/auth/session";
import { clientIp, errorResponse, json, readJson, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";
import { sessionSecret, storeKind } from "@/lib/server/env";

const loginSchema = z.object({ email: z.string().trim().max(200), password: z.string().min(1).max(200) });

/** Current staff member, if signed in. */
export async function GET(req: Request) {
  const staff = await requireStaff(req);
  if (!staff) return errorResponse(401, "Not signed in.");
  return json({ staff: { name: staff.name, email: staff.email, role: staff.role }, store: storeKind() });
}

/** Sign in. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return errorResponse(403, "Cross-site requests are not allowed.");
  if (!sessionSecret() || !storeKind()) return errorResponse(503, "Staff sign-in is not configured on this server.");
  const body = loginSchema.safeParse(await readJson(req, 4096));
  if (!body.success) return errorResponse(400, "Enter your email and password.");

  const ip = clientIp(req);
  const byIp = rateLimit(`login-ip:${ip}`, 20, 15 * 60 * 1000);
  const byEmail = rateLimit(`login-email:${body.data.email.toLowerCase()}`, 6, 15 * 60 * 1000);
  if (!byIp.ok || !byEmail.ok)
    return json({ error: "Too many sign-in attempts. Try again in a few minutes." }, { status: 429, headers: { "Retry-After": String(Math.max(byIp.retryAfter, byEmail.retryAfter)) } });

  const result = await authenticateStaff(body.data.email, body.data.password);
  if (!result.ok) {
    if (result.reason === "unconfigured") return errorResponse(503, "Staff sign-in is not configured on this server.");
    // Same message for wrong password and non-staff accounts.
    return errorResponse(401, "That email and password don't match a staff account.");
  }
  const token = createSessionToken(result.staff);
  return json(
    { staff: { name: result.staff.name, email: result.staff.email, role: result.staff.role } },
    { status: 200, headers: { "Set-Cookie": serializeCookie(sessionCookie(token)) } },
  );
}

/** Sign out. */
export async function DELETE(req: Request) {
  if (!sameOrigin(req)) return errorResponse(403, "Cross-site requests are not allowed.");
  return json({ ok: true }, { status: 200, headers: { "Set-Cookie": clearedCookie() } });
}
