import { AdminShell } from "@/components/admin/admin-shell";

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
