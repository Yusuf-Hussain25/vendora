import prisma from "@/lib/prisma";
import { isExpired } from "@/lib/pricing";
import { PageHeader } from "@/components/dashboard/Widgets";
import CouponManager from "@/components/admin/CouponManager";

export const metadata = { title: "Coupons" };

export default async function AdminCoupons() {
  const [coupons, usage] = await Promise.all([
    prisma.coupon.findMany({ orderBy: { createdAt: "desc" } }),
    prisma.order.groupBy({ by: ["couponCode"], where: { couponCode: { not: null } }, _count: true }),
  ]);
  const usedFor = Object.fromEntries(usage.map((u) => [u.couponCode, u._count]));

  return (
    <>
      <PageHeader title="Coupons" subtitle="Percentage discounts shoppers enter at checkout." />
      <CouponManager coupons={coupons.map((c) => ({ ...c, used: usedFor[c.code] || 0, expired: isExpired(c) }))} />
    </>
  );
}
