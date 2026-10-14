import { QUOTE_STATUSES, type QuoteStatus } from "@/domain/catalog";
import { requireStaff } from "@/lib/server/auth/staff";
import { errorResponse, json } from "@/lib/server/http";
import { getQuoteStore } from "@/lib/server/quotes";

/** Staff only: list quote requests, newest first, with search and status filter. */
export async function GET(req: Request) {
  const staff = await requireStaff(req);
  if (!staff) return errorResponse(401, "Not signed in.");
  const store = getQuoteStore();
  if (!store) return errorResponse(503, "Quote storage is not configured.");
  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") ?? "all";
  const status = QUOTE_STATUSES.some((s) => s.id === statusParam) ? (statusParam as QuoteStatus) : "all";
  try {
    const list = await store.list({ search: url.searchParams.get("q") ?? undefined, status, limit: 200 });
    return json(list);
  } catch (e) {
    console.error("[admin] list failed", e);
    return errorResponse(500, "Couldn't load requests.");
  }
}
