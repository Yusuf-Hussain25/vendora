import "server-only";
import { randomInt } from "node:crypto";
import prisma from "@/lib/prisma";
import { placedOrder } from "@/lib/orders";

const DAY = 86_400_000;
const SKU_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Short, readable stock-keeping code, e.g. VND-7K2QX
export const newSku = () => `VND-${Array.from({ length: 5 }, () => SKU_ALPHABET[randomInt(SKU_ALPHABET.length)]).join("")}`;

// Records one stock change. Call inside the same transaction that changes the stock.
export function logMovement(tx, { productId, storeId, change, balance, reason, note, userId, orderId }) {
  if (!change && reason !== "INITIAL") return null;
  return tx.stockMovement.create({ data: { productId, storeId, change, balance, reason, note, userId, orderId } });
}

// Status and the suggested next step for one product
export function assess({ stock, reorderLevel, isActive, sold30, createdAt }, now = Date.now()) {
  const perDay = sold30 / 30;
  const daysLeft = perDay > 0 ? Math.floor(stock / perDay) : null;
  // Enough to cover the next 30 days of sales, never less than twice the alert level
  const restockTo = Math.max(Math.ceil(perDay * 30), reorderLevel * 2, 10);
  const age = (now - new Date(createdAt).getTime()) / DAY;

  if (!isActive) return { status: "hidden", daysLeft, action: { kind: "hidden", label: "Hidden from shoppers" } };
  if (stock <= 0) return { status: "out", daysLeft: 0, action: { kind: "restock", qty: restockTo, label: `Restock ${restockTo} now` } };
  if (stock <= reorderLevel || (daysLeft != null && daysLeft < 7)) {
    const qty = Math.max(restockTo - stock, reorderLevel);
    return { status: "low", daysLeft, action: { kind: "restock", qty, label: `Restock ${qty}` } };
  }
  if (sold30 === 0 && age > 14) return { status: "slow", daysLeft, action: { kind: "deal", label: "Run a flash deal" } };
  return { status: "ok", daysLeft, action: { kind: "none", label: "Nothing needed" } };
}

// Inventory rows for a store, or for the whole marketplace when storeId is omitted
export async function getInventory({ storeId } = {}) {
  const since = new Date(Date.now() - 30 * DAY);
  const where = storeId ? { storeId } : { store: { status: "APPROVED" } };

  const [products, sales] = await Promise.all([
    prisma.product.findMany({
      where,
      select: {
        id: true,
        name: true,
        sku: true,
        images: true,
        category: true,
        subCategory: true,
        unit: true,
        price: true,
        stock: true,
        reorderLevel: true,
        isActive: true,
        createdAt: true,
        store: { select: { name: true, username: true } },
        movements: { select: { createdAt: true }, orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { name: "asc" },
    }),
    prisma.orderItem.groupBy({
      by: ["productId"],
      where: { product: where, order: { ...placedOrder, status: { not: "CANCELLED" }, createdAt: { gte: since } } },
      _sum: { quantity: true },
    }),
  ]);

  const soldFor = Object.fromEntries(sales.map((s) => [s.productId, s._sum.quantity || 0]));
  const rows = products.map(({ movements, ...p }) => {
    const sold30 = soldFor[p.id] || 0;
    return { ...p, sold30, lastMovementAt: movements[0]?.createdAt || null, ...assess({ ...p, sold30 }) };
  });

  const summary = {
    total: rows.length,
    inStock: rows.filter((r) => r.status === "ok").length,
    slow: rows.filter((r) => r.status === "slow").length,
    low: rows.filter((r) => r.status === "low").length,
    out: rows.filter((r) => r.status === "out").length,
    hidden: rows.filter((r) => r.status === "hidden").length,
    units: rows.reduce((s, r) => s + Math.max(0, r.stock), 0),
    value: rows.reduce((s, r) => s + Math.max(0, r.stock) * r.price, 0),
    toRestock: rows.filter((r) => r.action.kind === "restock").length,
  };
  return { rows, summary };
}
