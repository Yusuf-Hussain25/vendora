import prisma from "@/lib/prisma";
import { placedOrder } from "@/lib/orders";
import { money, shortDate, timeAgo } from "@/lib/format";
import { PageHeader } from "@/components/dashboard/Widgets";
import Avatar from "@/components/ui/Avatar";

export const metadata = { title: "Customers" };

export default async function AdminUsers() {
  const [users, spend] = await Promise.all([
    prisma.user.findMany({
      where: { role: "CUSTOMER" },
      select: { id: true, name: true, email: true, image: true, createdAt: true, store: { select: { name: true, status: true } } },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.order.groupBy({
      by: ["userId"],
      where: { ...placedOrder, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: true,
      _max: { createdAt: true },
    }),
  ]);
  const spendFor = Object.fromEntries(spend.map((s) => [s.userId, s]));

  return (
    <>
      <PageHeader title="Customers" subtitle={`${users.length} registered shoppers`} />
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="text-left text-xs text-text-3 border-b border-border">
                <th className="font-medium px-5 py-3">Customer</th>
                <th className="font-medium px-3 py-3">Orders</th>
                <th className="font-medium px-3 py-3">Spent</th>
                <th className="font-medium px-3 py-3">Last order</th>
                <th className="font-medium px-5 py-3">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => {
                const s = spendFor[u.id];
                return (
                  <tr key={u.id} className="hover:bg-surface transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar src={u.image} name={u.name} size={36} />
                        <div className="min-w-0">
                          <p className="font-medium flex items-center gap-2">
                            {u.name}
                            {u.store?.status === "APPROVED" && <span className="badge badge-info">Seller</span>}
                          </p>
                          <p className="text-xs text-text-3 truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">{s?._count || 0}</td>
                    <td className="px-3 py-3 font-medium">{money(s?._sum.total || 0)}</td>
                    <td className="px-3 py-3 text-text-2">{s ? timeAgo(s._max.createdAt) : "–"}</td>
                    <td className="px-5 py-3 text-text-2">{shortDate(u.createdAt)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
