import prisma from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session";
import { getCategoryCounts } from "@/lib/queries";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import MobileTabBar from "@/components/layout/MobileTabBar";

// The best live public promotion for the announcement bar (first-order offers first)
async function featuredCoupon() {
  return prisma.coupon.findFirst({
    where: { isPublic: true, expiresAt: { gt: new Date() } },
    orderBy: [{ forNewUser: "desc" }, { discount: "desc" }],
    select: { code: true, description: true },
  });
}

export default async function ShopLayout({ children }) {
  const user = await getCurrentUser();
  const [coupon, categoryCounts, addresses] = await Promise.all([
    featuredCoupon(),
    getCategoryCounts(),
    user
      ? prisma.address.findMany({
          where: { userId: user.id },
          select: { id: true, label: true, street: true, city: true, zip: true, isDefault: true },
          orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        })
      : [],
  ]);

  return (
    <>
      <AnnouncementBar coupon={coupon} />
      <Navbar categoryCounts={categoryCounts} addresses={addresses} signedIn={Boolean(user)} />
      <main className="min-h-[60vh]">{children}</main>
      <Footer />
      <MobileTabBar />
    </>
  );
}
