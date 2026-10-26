import { Bike } from "lucide-react";
import prisma from "@/lib/prisma";
import { shortDate } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/Widgets";
import Avatar from "@/components/ui/Avatar";
import EmptyState from "@/components/ui/EmptyState";
import AddRider from "@/components/admin/AddRider";

export const metadata = { title: "Riders" };

export default async function AdminRiders() {
  const riders = await prisma.user.findMany({
    where: { role: "RIDER" },
    select: { id: true, name: true, email: true, image: true, phone: true, vehicle: true, isOnline: true, createdAt: true },
    orderBy: [{ isOnline: "desc" }, { name: "asc" }],
  });
  const stats = await prisma.order.groupBy({ by: ["riderId", "status"], where: { riderId: { in: riders.map((r) => r.id) } }, _count: true });
  const statFor = (id, statuses) => stats.filter((s) => s.riderId === id && statuses.includes(s.status)).reduce((sum, s) => sum + s._count, 0);

  return (
    <>
      <PageHeader title="Riders" subtitle={`${riders.filter((r) => r.isOnline).length} of ${riders.length} online right now`}>
        <AddRider />
      </PageHeader>
      {riders.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {riders.map((r) => (
            <article key={r.id} className="card p-5">
              <div className="flex items-center gap-3">
                <Avatar src={r.image} name={r.name} size={48} online={r.isOnline} />
                <div className="min-w-0">
                  <p className="font-semibold truncate">{r.name}</p>
                  <p className="text-xs text-text-3 truncate">{r.email}</p>
                </div>
                <span className={`badge ml-auto ${r.isOnline ? "badge-success" : ""}`}>{r.isOnline ? "Online" : "Offline"}</span>
              </div>
              <dl className="mt-5 grid grid-cols-3 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-text-3">Active</dt>
                  <dd className="font-medium">{statFor(r.id, ["PACKED", "OUT_FOR_DELIVERY"])}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">Delivered</dt>
                  <dd className="font-medium">{statFor(r.id, ["DELIVERED"])}</dd>
                </div>
                <div>
                  <dt className="text-xs text-text-3">Joined</dt>
                  <dd className="font-medium">{shortDate(r.createdAt)}</dd>
                </div>
              </dl>
              <p className="mt-4 text-xs text-text-3 flex items-center gap-1.5">
                <Bike className="w-3.5 h-3.5" />
                {r.vehicle || "Vehicle not set"}
                {r.phone && ` · ${r.phone}`}
              </p>
            </article>
          ))}
        </div>
      ) : (
        <EmptyState icon={Bike} title="No riders yet">
          Add your first delivery partner to start dispatching orders.
        </EmptyState>
      )}
    </>
  );
}
