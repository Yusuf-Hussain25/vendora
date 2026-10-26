import { requireRole } from "@/lib/session";
import DashboardShell from "@/components/dashboard/DashboardShell";

export const metadata = { title: "Rider app" };

export default async function RiderLayout({ children }) {
  const user = await requireRole("RIDER", "/rider");
  return (
    <DashboardShell area="rider" user={{ name: user.name, email: user.email, image: user.image }} subtitle={user.vehicle || "Delivery partner"}>
      {children}
    </DashboardShell>
  );
}
