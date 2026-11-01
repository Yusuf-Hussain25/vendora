import { revalidateTag } from "next/cache";
import prisma from "@/lib/prisma";
import { logMovement } from "@/lib/inventory";

export const dynamic = "force-dynamic";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
// The seeded accounts all use this domain (scripts/seed.mjs). Only their stores are refreshed,
// so real sellers' deals, coupons and stock are never touched.
const DEMO_DOMAIN = "@vendora-demo.dev";
// The public coupons the seeder creates
const DEMO_COUPONS = ["WELCOME10", "FRESH15", "BIGCART20"];
const RESTOCK_TO = 20;

const hoursFromNow = (min, max) => new Date(Date.now() + (min + Math.random() * (max - min)) * HOUR);

// Runs once a day (vercel.json → crons) so the demo never goes stale: flash deals keep
// counting down, the seeded coupons stay valid, and sold-out demo products come back.
export async function GET(request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const demoStores = { owner: { email: { endsWith: DEMO_DOMAIN } } };

  // 1. Seeded flash deals end within 2.5 days. Push any that would end before the next run
  //    to 1.5–3 days out, each with its own end time so the countdowns differ.
  const deals = await prisma.product.findMany({
    where: { store: demoStores, dealPrice: { not: null }, dealEndsAt: { lt: new Date(Date.now() + 30 * HOUR) } },
    select: { id: true },
  });
  for (const { id } of deals) {
    await prisma.product.update({ where: { id }, data: { dealEndsAt: hoursFromNow(36, 72) } });
  }

  // 2. Keep the seeded public coupons valid for at least another two weeks
  const coupons = await prisma.coupon.updateMany({
    where: { code: { in: DEMO_COUPONS }, expiresAt: { lt: new Date(Date.now() + 14 * DAY) } },
    data: { expiresAt: new Date(Date.now() + 30 * DAY) },
  });

  // 3. Restock sold-out demo products, recorded in the stock ledger like a real restock
  const soldOut = await prisma.product.findMany({
    where: { store: demoStores, isActive: true, stock: { lte: 0 } },
    select: { id: true, storeId: true, stock: true },
  });
  for (const product of soldOut) {
    await prisma.$transaction(async (tx) => {
      const updated = await tx.product.update({ where: { id: product.id }, data: { stock: RESTOCK_TO } });
      await logMovement(tx, {
        productId: product.id,
        storeId: product.storeId,
        change: RESTOCK_TO - product.stock,
        balance: updated.stock,
        reason: "RESTOCK",
        note: "Daily demo restock",
      });
    });
  }

  revalidateTag("catalog", "max");
  return Response.json(
    { ok: true, deals: deals.length, coupons: coupons.count, restocked: soldOut.length },
    { headers: { "Cache-Control": "no-store" } },
  );
}
