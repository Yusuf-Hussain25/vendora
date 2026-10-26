import "server-only";
import prisma from "@/lib/prisma";

export const PAGE_SIZE = 24;

export const productCardSelect = {
  id: true,
  name: true,
  images: true,
  price: true,
  mrp: true,
  dealPrice: true,
  dealEndsAt: true,
  unit: true,
  sizes: true,
  ratingAvg: true,
  ratingCount: true,
  soldCount: true,
  stock: true,
  category: true,
  subCategory: true,
  brand: true,
  createdAt: true,
  store: { select: { name: true, username: true } },
};

// Only products from approved, active stores are visible to shoppers
export const visibleProduct = { isActive: true, store: { status: "APPROVED", isActive: true } };

const orderByFor = (sort) =>
  ({
    newest: [{ createdAt: "desc" }],
    "price-asc": [{ price: "asc" }],
    "price-desc": [{ price: "desc" }],
    rating: [{ ratingAvg: "desc" }, { ratingCount: "desc" }],
    popular: [{ soldCount: "desc" }],
  })[sort] || [{ soldCount: "desc" }, { ratingAvg: "desc" }];

export function buildProductWhere({ q, category, sub, min, max, rating, deals, store, inStock } = {}) {
  const and = [visibleProduct];
  if (q) {
    const term = q.trim();
    and.push({
      OR: [
        { name: { contains: term, mode: "insensitive" } },
        { brand: { contains: term, mode: "insensitive" } },
        { subCategory: { contains: term, mode: "insensitive" } },
        { tags: { has: term.toLowerCase() } },
        { store: { name: { contains: term, mode: "insensitive" } } },
      ],
    });
  }
  if (category) and.push({ category });
  if (sub) and.push({ subCategory: sub });
  if (min) and.push({ price: { gte: Number(min) } });
  if (max) and.push({ price: { lte: Number(max) } });
  if (rating) and.push({ ratingAvg: { gte: Number(rating) } });
  if (deals) and.push({ dealPrice: { not: null }, dealEndsAt: { gt: new Date() } });
  if (store) and.push({ store: { username: store } });
  if (inStock) and.push({ stock: { gt: 0 } });
  return { AND: and };
}

export async function searchProducts(filters = {}) {
  const page = Math.max(1, Number(filters.page) || 1);
  const where = buildProductWhere(filters);
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      select: productCardSelect,
      orderBy: orderByFor(filters.sort),
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getSubCategories(category) {
  if (!category) return [];
  const rows = await prisma.product.groupBy({
    by: ["subCategory"],
    where: { ...visibleProduct, category, subCategory: { not: null } },
    _count: true,
    orderBy: { subCategory: "asc" },
  });
  return rows.map((r) => ({ name: r.subCategory, count: r._count }));
}

export async function getCategoryCounts() {
  const rows = await prisma.product.groupBy({ by: ["category"], where: visibleProduct, _count: true });
  return Object.fromEntries(rows.map((r) => [r.category, r._count]));
}

export async function getLiveDeals(take = 12) {
  return prisma.product.findMany({
    where: { ...visibleProduct, dealPrice: { not: null }, dealEndsAt: { gt: new Date() } },
    select: productCardSelect,
    orderBy: { dealEndsAt: "asc" },
    take,
  });
}

export async function getStoresWithStats({ take } = {}) {
  const stores = await prisma.store.findMany({
    where: { status: "APPROVED", isActive: true },
    select: {
      id: true,
      name: true,
      username: true,
      tagline: true,
      logo: true,
      banner: true,
      city: true,
      createdAt: true,
      _count: { select: { products: { where: { isActive: true } } } },
    },
    orderBy: { createdAt: "asc" },
    take,
  });
  const ratings = await prisma.product.groupBy({
    by: ["storeId"],
    where: { storeId: { in: stores.map((s) => s.id) }, ratingCount: { gt: 0 } },
    _avg: { ratingAvg: true },
    _sum: { ratingCount: true, soldCount: true },
  });
  const byStore = Object.fromEntries(ratings.map((r) => [r.storeId, r]));
  return stores.map((s) => ({
    ...s,
    productCount: s._count.products,
    rating: byStore[s.id]?._avg.ratingAvg || 0,
    reviews: byStore[s.id]?._sum.ratingCount || 0,
    sold: byStore[s.id]?._sum.soldCount || 0,
  }));
}

export async function getProduct(id) {
  const product = await prisma.product.findFirst({
    where: { id, ...visibleProduct },
    include: {
      store: {
        select: { id: true, name: true, username: true, logo: true, tagline: true, city: true, createdAt: true },
      },
      ratings: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: { user: { select: { name: true, image: true } } },
      },
    },
  });
  if (!product) return null;

  const [related, storeProducts, grouped] = await Promise.all([
    prisma.product.findMany({
      where: { ...visibleProduct, category: product.category, subCategory: product.subCategory, id: { not: id } },
      select: productCardSelect,
      orderBy: { soldCount: "desc" },
      take: 8,
    }),
    prisma.product.count({ where: { ...visibleProduct, storeId: product.storeId } }),
    prisma.rating.groupBy({ by: ["rating"], where: { productId: id }, _count: true }),
  ]);

  // Star breakdown over every review, not just the latest page shown
  const breakdown = [5, 4, 3, 2, 1].map((stars) => ({
    stars,
    count: grouped.find((g) => g.rating === stars)?._count || 0,
  }));

  return { product, related, storeProducts, breakdown };
}
