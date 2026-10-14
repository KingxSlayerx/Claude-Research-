import type { Metadata } from "next";
import { Inbox } from "@/components/admin/inbox";

export const metadata: Metadata = { title: "Inbox" };

export default function AdminPage() {
  return <Inbox />;
}
