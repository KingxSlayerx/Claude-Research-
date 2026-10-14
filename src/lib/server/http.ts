import "server-only";
import { trustProxy } from "./env";

export function json(body: unknown, init: number | ResponseInit = 200): Response {
  const opts = typeof init === "number" ? { status: init } : init;
  return Response.json(body, { ...opts, headers: { "Cache-Control": "no-store", ...(opts.headers ?? {}) } });
}

export const errorResponse = (status: number, error: string, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);

/**
 * Rejects cross-site state-changing requests. Browsers always send Origin on
 * POST/PATCH/DELETE fetches; it must match the host serving the API.
 */
export function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return req.headers.get("sec-fetch-site") !== "cross-site";
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

export function clientIp(req: Request): string {
  if (trustProxy()) {
    const fwd = req.headers.get("x-forwarded-for");
    if (fwd) return fwd.split(",")[0].trim();
    const real = req.headers.get("x-real-ip");
    if (real) return real;
  }
  return req.headers.get("x-real-ip") ?? "local";
}

/** Reads a JSON body with a size cap. Returns undefined for invalid or oversized bodies. */
export async function readJson(req: Request, maxBytes = 64 * 1024): Promise<unknown> {
  if (!(req.headers.get("content-type") ?? "").includes("application/json")) return undefined;
  const text = await req.text();
  if (text.length > maxBytes) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
