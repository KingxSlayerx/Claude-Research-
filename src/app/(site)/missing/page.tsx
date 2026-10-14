import type { Metadata } from "next";
import NotFound from "../not-found";

export const metadata: Metadata = { title: "Page not found", robots: { index: false } };

/** Rendered (with a 404 status) by src/proxy.ts for unknown door URLs. */
export default function Missing() {
  return <NotFound />;
}
