import { NextResponse, type NextRequest } from "next/server";
import { STYLES } from "@/domain/catalog";

const SLUGS = new Set(STYLES.map((s) => s.slug));

/**
 * Product pages stream, so a notFound() thrown while rendering can no longer
 * change the HTTP status. Unknown door slugs are answered here, before
 * rendering, with the styled not-found page and a real 404 status.
 */
export async function proxy(req: NextRequest) {
  const slug = req.nextUrl.pathname.split("/")[2];
  if (!slug || SLUGS.has(decodeURIComponent(slug))) return NextResponse.next();
  if (req.headers.get("rsc")) return new NextResponse(null, { status: 404 });
  try {
    const page = await fetch(new URL("/missing", req.url), { headers: { accept: "text/html" } });
    return new NextResponse(page.body, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}

export const config = { matcher: "/doors/:slug" };
