import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/server/auth/password";
import { createSessionToken, verifySessionToken } from "@/lib/server/auth/session";
import { makeReference } from "@/lib/server/quotes";
import { resetRateLimits } from "@/lib/server/rate-limit";
import * as quotesRoute from "@/app/api/quotes/route";
import * as sessionRoute from "@/app/api/admin/session/route";
import * as listRoute from "@/app/api/admin/quotes/route";
import * as itemRoute from "@/app/api/admin/quotes/[reference]/route";
import * as notesRoute from "@/app/api/admin/quotes/[reference]/notes/route";

const ORIGIN = "http://localhost:3000";
let dir: string;

const customer = {
  name: "Asha Rao",
  phone: "+91 98765 43210",
  email: "asha@example.com",
  locality: "Kokapet",
  projectType: "New home",
  timeline: "1–2 months",
  siteVisit: true,
  notes: "Ground floor",
  consent: true,
};

function post(url: string, body: unknown, headers: Record<string, string> = {}) {
  return new Request(`${ORIGIN}${url}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: ORIGIN, host: "localhost:3000", ...headers },
    body: JSON.stringify(body),
  });
}

function withCookie(req: Request, cookie: string) {
  const h = new Headers(req.headers);
  h.set("cookie", cookie);
  return new Request(req, { headers: h });
}

beforeAll(async () => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "threshold-test-"));
  vi.stubEnv("QUOTE_STORE", "file");
  vi.stubEnv("QUOTE_FILE_PATH", path.join(dir, "quotes.json"));
  vi.stubEnv("SESSION_SECRET", "test-secret-test-secret-test-secret-1234");
  vi.stubEnv("STAFF_EMAIL", "staff@example.com");
  vi.stubEnv("STAFF_NAME", "Test Staff");
  vi.stubEnv("STAFF_PASSWORD_HASH", await hashPassword("correct horse battery"));
});
afterAll(() => {
  vi.unstubAllEnvs();
  fs.rmSync(dir, { recursive: true, force: true });
});
beforeEach(() => resetRateLimits());

describe("passwords and sessions", () => {
  it("verifies scrypt hashes", async () => {
    const h = await hashPassword("a long passphrase");
    expect(await verifyPassword("a long passphrase", h)).toBe(true);
    expect(await verifyPassword("wrong", h)).toBe(false);
    expect(await verifyPassword("x", "not-a-hash")).toBe(false);
  });

  it("rejects tampered and expired session tokens", () => {
    const t = createSessionToken({ sub: "a", email: "a@b.c", name: "A", role: "staff" });
    expect(verifySessionToken(t)?.email).toBe("a@b.c");
    const [payload, mac] = t.split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "a", email: "a@b.c", name: "A", role: "admin", exp: 9e9 })).toString("base64url");
    expect(verifySessionToken(`${forged}.${mac}`)).toBeNull();
    expect(verifySessionToken(`${payload}.x${mac.slice(1)}`)).toBeNull();
    expect(verifySessionToken(t, Date.now() + 9 * 3600 * 1000)).toBeNull();
  });

  it("makes readable, dated references", () => {
    expect(makeReference(new Date("2026-03-31T20:00:00Z"))).toMatch(/^TH-260401-[2-9A-HJ-NP-Z]{5}$/);
  });
});

describe("POST /api/quotes", () => {
  it("stores a request, recomputes prices server-side and is idempotent", async () => {
    const key = crypto.randomUUID();
    const body = { idempotencyKey: key, customer, items: [{ style: "pivot", qty: 2, unit: 1 }, { style: "flush", qty: 3 }], website: "" };
    const res = await quotesRoute.POST(post("/api/quotes", body));
    expect(res.status).toBe(201);
    const { receipt } = await res.json();
    expect(receipt.reference).toMatch(/^TH-\d{6}-[A-Z0-9]{5}$/);
    expect(receipt.totals.subtotal).toBe(164680 * 2 + 17290 * 3);
    expect(receipt.phone).toBe("+91 98765 43210");
    expect(receipt.firstName).toBe("Asha");

    const again = await (await quotesRoute.POST(post("/api/quotes", body))).json();
    expect(again.receipt.reference).toBe(receipt.reference);
    const stored = JSON.parse(fs.readFileSync(path.join(dir, "quotes.json"), "utf8"));
    expect(stored.quotes).toHaveLength(1);
  });

  it("rejects invalid details with field errors and stores nothing", async () => {
    const res = await quotesRoute.POST(post("/api/quotes", { idempotencyKey: crypto.randomUUID(), customer: { ...customer, phone: "123" }, items: [{ style: "flush" }] }));
    expect(res.status).toBe(422);
    expect((await res.json()).fields.phone).toBeTruthy();
  });

  it("rejects unknown door styles", async () => {
    const res = await quotesRoute.POST(post("/api/quotes", { idempotencyKey: crypto.randomUUID(), customer, items: [{ style: "garage" }] }));
    expect(res.status).toBe(422);
  });

  it("rejects cross-site posts and non-JSON bodies", async () => {
    expect((await quotesRoute.POST(post("/api/quotes", {}, { origin: "https://evil.example" }))).status).toBe(403);
    const plain = new Request(`${ORIGIN}/api/quotes`, { method: "POST", headers: { origin: ORIGIN, host: "localhost:3000", "content-type": "text/plain" }, body: "x" });
    expect((await quotesRoute.POST(plain)).status).toBe(400);
  });

  it("silently drops honeypot submissions", async () => {
    const before = JSON.parse(fs.readFileSync(path.join(dir, "quotes.json"), "utf8")).quotes.length;
    const res = await quotesRoute.POST(post("/api/quotes", { idempotencyKey: crypto.randomUUID(), customer, items: [{ style: "flush" }], website: "spam.example" }));
    expect(res.status).toBe(422);
    expect(JSON.parse(fs.readFileSync(path.join(dir, "quotes.json"), "utf8")).quotes.length).toBe(before);
  });

  it("rate-limits bursts from one address", async () => {
    let last = 0;
    for (let i = 0; i < 10; i++) {
      last = (await quotesRoute.POST(post("/api/quotes", { idempotencyKey: crypto.randomUUID(), customer, items: [{ style: "flush" }] }))).status;
    }
    expect(last).toBe(429);
  });

  it("returns 503 (not success) when storage is not configured", async () => {
    vi.stubEnv("QUOTE_STORE", "supabase"); // selected but no credentials
    const res = await quotesRoute.POST(post("/api/quotes", { idempotencyKey: crypto.randomUUID(), customer, items: [{ style: "flush" }] }));
    expect(res.status).toBe(503);
    vi.stubEnv("QUOTE_STORE", "file");
  });
});

describe("showroom API", () => {
  async function login(password = "correct horse battery") {
    const res = await sessionRoute.POST(post("/api/admin/session", { email: "Staff@Example.com", password }));
    return { res, cookie: (res.headers.get("set-cookie") ?? "").split(";")[0] };
  }

  it("requires a staff session for every read and write", async () => {
    const anon = new Request(`${ORIGIN}/api/admin/quotes`);
    expect((await listRoute.GET(anon)).status).toBe(401);
    expect((await itemRoute.GET(anon, { params: Promise.resolve({ reference: "TH-260101-AAAAA" }) })).status).toBe(401);
    const patch = new Request(`${ORIGIN}/x`, { method: "PATCH", headers: { origin: ORIGIN, host: "localhost:3000", "content-type": "application/json" }, body: '{"status":"won"}' });
    expect((await itemRoute.PATCH(patch, { params: Promise.resolve({ reference: "TH-260101-AAAAA" }) })).status).toBe(401);
  });

  it("rejects wrong passwords without revealing which part was wrong", async () => {
    const { res } = await login("nope");
    expect(res.status).toBe(401);
    expect((await res.json()).error).toMatch(/don't match a staff account/);
  });

  it("lists, searches, updates status with history, and adds notes", async () => {
    const { res, cookie } = await login();
    expect(res.status).toBe(200);
    expect(cookie).toMatch(/^th_staff=/);
    expect(res.headers.get("set-cookie")).toMatch(/HttpOnly; SameSite=Strict/);

    const list = await (await listRoute.GET(withCookie(new Request(`${ORIGIN}/api/admin/quotes?q=kokapet`), cookie))).json();
    expect(list.items.length).toBeGreaterThan(0);
    expect(list.counts.new).toBe(list.items.length);
    const ref = list.items[0].reference;
    const none = await (await listRoute.GET(withCookie(new Request(`${ORIGIN}/api/admin/quotes?q=zzzz`), cookie))).json();
    expect(none.items).toHaveLength(0);

    const ctx = { params: Promise.resolve({ reference: ref }) };
    const patchReq = (status: string) =>
      withCookie(new Request(`${ORIGIN}/api/admin/quotes/${ref}`, { method: "PATCH", headers: { origin: ORIGIN, host: "localhost:3000", "content-type": "application/json" }, body: JSON.stringify({ status }) }), cookie);
    const updated = await (await itemRoute.PATCH(patchReq("visit"), ctx)).json();
    expect(updated.record.status).toBe("visit");
    expect(updated.events.map((e: { kind: string }) => e.kind)).toEqual(["created", "status"]);
    expect((await itemRoute.PATCH(patchReq("bogus"), { params: Promise.resolve({ reference: ref }) })).status).toBe(400);

    const noted = await (await notesRoute.POST(withCookie(post(`/api/admin/quotes/${ref}/notes`, { note: "Visit Saturday 11am" }), cookie), { params: Promise.resolve({ reference: ref }) })).json();
    expect(noted.events.at(-1)).toMatchObject({ kind: "note", note: "Visit Saturday 11am", actor: "staff@example.com" });

    const filtered = await (await listRoute.GET(withCookie(new Request(`${ORIGIN}/api/admin/quotes?status=visit`), cookie))).json();
    expect(filtered.items.map((i: { reference: string }) => i.reference)).toContain(ref);
  });

  it("returns 404 for unknown or malformed references", async () => {
    const { cookie } = await login();
    expect((await itemRoute.GET(withCookie(new Request(`${ORIGIN}/x`), cookie), { params: Promise.resolve({ reference: "TH-260101-ZZZZZ" }) })).status).toBe(404);
    expect((await itemRoute.GET(withCookie(new Request(`${ORIGIN}/x`), cookie), { params: Promise.resolve({ reference: "../etc" }) })).status).toBe(404);
  });
});

describe("password hash format", () => {
  it("never contains '$', which Next.js would expand inside .env files", async () => {
    expect(await hashPassword("a long passphrase")).not.toContain("$");
  });
});
