import { z } from "zod";
import { requireStaff } from "@/lib/server/auth/staff";
import { errorResponse, json, readJson, sameOrigin } from "@/lib/server/http";
import { getQuoteStore } from "@/lib/server/quotes";

const noteSchema = z.object({ note: z.string().trim().min(1, "Write a note first.").max(2000) });

/** Staff only: add an internal follow-up note. */
export async function POST(req: Request, { params }: { params: Promise<{ reference: string }> }) {
  if (!sameOrigin(req)) return errorResponse(403, "Cross-site requests are not allowed.");
  const staff = await requireStaff(req);
  if (!staff) return errorResponse(401, "Not signed in.");
  const { reference } = await params;
  if (!/^TH-\d{6}-[A-Z0-9]{5}$/.test(reference)) return errorResponse(404, "Request not found.");
  const body = noteSchema.safeParse(await readJson(req, 8192));
  if (!body.success) return errorResponse(400, body.error.issues[0]?.message ?? "Invalid note.");
  const store = getQuoteStore();
  if (!store) return errorResponse(503, "Quote storage is not configured.");
  try {
    const ev = await store.addNote(reference, body.data.note, staff.email);
    if (!ev) return errorResponse(404, "Request not found.");
    return json(await store.get(reference), 201);
  } catch (e) {
    console.error("[admin] note failed", e);
    return errorResponse(500, "The note was not saved.");
  }
}
