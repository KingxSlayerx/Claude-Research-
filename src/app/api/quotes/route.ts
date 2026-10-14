import { submissionSchema, fieldErrors, type SubmissionReceipt } from "@/domain/quote";
import { buildQuote, getQuoteStore, makeReference } from "@/lib/server/quotes";
import { clientIp, errorResponse, json, readJson, sameOrigin } from "@/lib/server/http";
import { rateLimit } from "@/lib/server/rate-limit";

/** Customer quote submission. Validates, re-prices and stores the request. */
export async function POST(req: Request) {
  if (!sameOrigin(req)) return errorResponse(403, "Cross-site requests are not allowed.");

  const limit = rateLimit(`quote:${clientIp(req)}`, 8, 10 * 60 * 1000);
  if (!limit.ok) return json({ error: "Too many requests." }, { status: 429, headers: { "Retry-After": String(limit.retryAfter) } });

  const body = await readJson(req);
  if (body === undefined) return errorResponse(400, "Invalid request.");

  const parsed = submissionSchema.safeParse(body);
  if (!parsed.success) return errorResponse(422, "Please check the highlighted details.", { fields: fieldErrors(parsed.error) });

  const { customer, items, idempotencyKey, website } = parsed.data;
  const input = buildQuote(customer, items, idempotencyKey);
  if (!input) return errorResponse(422, "One of the doors in your quote is no longer available. Please review your quote.", { fields: {} });

  const store = getQuoteStore();
  if (!store) {
    console.error("[quotes] Quote storage is not configured. Set Supabase credentials — see docs/DEPLOYMENT.md.");
    return errorResponse(503, "Quote requests are temporarily unavailable.");
  }

  // Bots that fill the hidden field get a normal-looking rejection without storing anything.
  if (website) return errorResponse(422, "Please check the highlighted details.", { fields: {} });

  try {
    const { record } = await store.create(input, () => makeReference());
    const receipt: SubmissionReceipt = {
      reference: record.reference,
      createdAt: record.createdAt,
      totals: record.totals,
      doors: record.totals.doors,
      siteVisit: record.customer.siteVisit,
      firstName: record.customer.name.split(/\s+/)[0],
      phone: record.customer.phone,
    };
    return json({ receipt }, 201);
  } catch (e) {
    console.error("[quotes] Failed to store quote request", e);
    return errorResponse(500, "The request could not be saved.");
  }
}
