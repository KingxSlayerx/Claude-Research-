import type { Metadata } from "next";
import { Inbox } from "@/components/admin/inbox";

export const metadata: Metadata = { title: "Inbox" };

// Rendered only after the client-side session check, so there is no static shell to validate.
export const instant = false;

export default function AdminPage() {
  return <Inbox />;
}
