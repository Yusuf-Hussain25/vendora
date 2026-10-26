import prisma from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = { title: { default: "Admin console", template: "%s · Admin · Vendora" } };

export default async function AdminLayout({ children }) {
  const user = await requireRole("ADMIN", "/admin");
  const pending = await prisma.store.count({ where: { status: "PENDING" } });
  return (
    <DashboardShell area="admin" user={{ name: user.name, email: user.email, image: user.image }} subtitle="Marketplace operations" badges={{ stores: pending }}>
      {children}
    </DashboardShell>
  );
}
