import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { isProduction, sessionSecret } from "../env";

export interface StaffSession {
  /** Staff identifier (Supabase user id, or email for the local store). */
  sub: string;
  email: string;
  name: string;
  role: "staff" | "admin";
  /** Expiry, seconds since epoch. */
  exp: number;
}

export const SESSION_COOKIE = "th_staff";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

const b64 = (s: string | Buffer) => Buffer.from(s).toString("base64url");

function sign(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createSessionToken(s: Omit<StaffSession, "exp">, now = Date.now()): string {
  const secret = sessionSecret();
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const payload = b64(JSON.stringify({ ...s, exp: Math.floor(now / 1000) + SESSION_TTL_SECONDS }));
  return `${payload}.${sign(payload, secret)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()): StaffSession | null {
  const secret = sessionSecret();
  if (!token || !secret) return null;
  const [payload, mac] = token.split(".");
  if (!payload || !mac) return null;
  const expected = Buffer.from(sign(payload, secret));
  const got = Buffer.from(mac);
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null;
  try {
    const s = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as StaffSession;
    if (typeof s.exp !== "number" || s.exp * 1000 < now) return null;
    if (typeof s.sub !== "string" || typeof s.email !== "string") return null;
    return s;
  } catch {
    return null;
  }
}

export function sessionCookie(token: string) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    secure: isProduction && process.env.SESSION_COOKIE_INSECURE !== "1",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export function readCookie(req: Request, name: string): string | undefined {
  const header = req.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return undefined;
}

export function serializeCookie(c: ReturnType<typeof sessionCookie>): string {
  return [
    `${c.name}=${encodeURIComponent(c.value)}`,
    `Path=${c.path}`,
    `Max-Age=${c.maxAge}`,
    "HttpOnly",
    "SameSite=Strict",
    c.secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearedCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict${isProduction && process.env.SESSION_COOKIE_INSECURE !== "1" ? "; Secure" : ""}`;
}
