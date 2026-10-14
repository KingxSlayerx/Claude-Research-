import { z } from "zod";
import { QUOTE_STATUSES } from "@/domain/catalog";
import { requireStaff } from "@/lib/server/auth/staff";
import { errorResponse, json, readJson, sameOrigin } from "@/lib/server/http";
import { getQuoteStore } from "@/lib/server/quotes";

type Ctx = { params: Promise<{ reference: string }> };

const REF = /^TH-\d{6}-[A-Z0-9]{5}$/;

/** Staff only: one request with its history. */
export async function GET(req: Request, { params }: Ctx) {
  const staff = await requireStaff(req);
  if (!staff) return errorResponse(401, "Not signed in.");
  const { reference } = await params;
  if (!REF.test(reference)) return errorResponse(404, "Request not found.");
  const store = getQuoteStore();
  if (!store) return errorResponse(503, "Quote storage is not configured.");
  try {
    const found = await store.get(reference);
    return found ? json(found) : errorResponse(404, "Request not found.");
  } catch (e) {
    console.error("[admin] get failed", e);
    return errorResponse(500, "Couldn't load this request.");
  }
}

const patchSchema = z.object({ status: z.enum(QUOTE_STATUSES.map((s) => s.id) as [string, ...string[]]) });

/** Staff only: change status. Returns the saved record so the UI shows what was stored. */
export async function PATCH(req: Request, { params }: Ctx) {
  if (!sameOrigin(req)) return errorResponse(403, "Cross-site requests are not allowed.");
  const staff = await requireStaff(req);
  if (!staff) return errorResponse(401, "Not signed in.");
  const { reference } = await params;
  if (!REF.test(reference)) return errorResponse(404, "Request not found.");
  const body = patchSchema.safeParse(await readJson(req, 1024));
  if (!body.success) return errorResponse(400, "Choose a valid status.");
  const store = getQuoteStore();
  if (!store) return errorResponse(503, "Quote storage is not configured.");
  try {
    const record = await store.setStatus(reference, body.data.status as (typeof QUOTE_STATUSES)[number]["id"], staff.email);
    if (!record) return errorResponse(404, "Request not found.");
    const found = await store.get(reference);
    return json(found);
  } catch (e) {
    console.error("[admin] status update failed", e);
    return errorResponse(500, "The status was not saved.");
  }
}
