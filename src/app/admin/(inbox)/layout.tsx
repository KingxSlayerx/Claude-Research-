import { Suspense } from "react";
import { AdminShell } from "@/components/admin/admin-shell";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<p className="p-8 text-muted">Loading…</p>}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
