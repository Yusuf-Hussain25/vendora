// Fills Vendora with realistic demo data: stores, ~180 products, shoppers, riders,
// coupons, orders across the last 30 days and reviews. Safe to re-run: existing records are
// reused, and flash deals are refreshed so they're always live.
//
//   npm run seed                       seed everything
//   npm run seed -- --with you@mail    also add orders, wishlist and addresses to your own account
//
// Product names, photos and reviews come from the free DummyJSON catalog (dummyjson.com).

import "dotenv/config";
import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

const prisma = new PrismaClient();
const DOMAIN = "vendora-demo.dev";
const DAY = 86_400_000;
const HOUR = 3_600_000;
const now = Date.now();

const required = ["NEXT_PUBLIC_DEMO_EMAIL", "NEXT_PUBLIC_DEMO_PASSWORD", "SEED_PASSWORD"];
const missing = required.filter((key) => !process.env[key]);
if (missing.length) {
  console.error(`Missing ${missing.join(", ")} in .env. See .env.example.`);
  process.exit(1);
}

const withIndex = process.argv.indexOf("--with");
const withEmail = withIndex > -1 ? process.argv[withIndex + 1]?.toLowerCase() : null;

// Deterministic randomness so re-runs pick the same products for the same orders
function rng(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), t | 1);
    r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(2026);
const pick = (list, r = rand) => list[Math.floor(r() * list.length)];
const between = (min, max, r = rand) => min + r() * (max - min);
const round2 = (n) => Math.round(n * 100) / 100;

// ------------------------------------------------------------------ places (San Francisco)
const CITY = { lat: 37.7749, lng: -122.4194 };
const round4 = (n) => Math.round(n * 1e4) / 1e4;
const near = (r, spread = 0.035) => ({
  lat: round4(CITY.lat + between(-spread, spread, r)),
  lng: round4(CITY.lng + between(-spread, spread, r)),
});
const STREETS = [
  "Valencia St", "Hayes St", "Divisadero St", "Irving St", "Clement St", "Folsom St", "Castro St",
  "Fillmore St", "Polk St", "Mission St", "Grove St", "Noe St", "Guerrero St", "Union St",
];

// ------------------------------------------------------------------ people
const SHOPPERS = [
  ["Aisha Khan", "women", 44], ["Daniel Reyes", "men", 32], ["Priya Nair", "women", 68], ["Tom Becker", "men", 75],
  ["Sofia Martins", "women", 21], ["Kenji Watanabe", "men", 52], ["Leila Haddad", "women", 90], ["Marcus Lee", "men", 11],
  ["Hannah Okafor", "women", 33], ["Oliver Grant", "men", 64], ["Zara Ahmed", "women", 57], ["Lucas Silva", "men", 46],
];
const RIDERS = [
  ["Ravi Patel", "men", 85, "Electric scooter", true], ["Emma Novak", "women", 12, "Bicycle", true], ["Diego Alvarez", "men", 29, "Motorbike", false],
];

const STORES = [
  {
    username: "threadline", name: "Threadline Studio", owner: "demo",
    tagline: "Easy shirts, tops and dresses for every day",
    description: "A small studio of wardrobe staples. Breathable cottons, relaxed fits and colours that go with everything you already own.",
    sources: ["mens-shirts", "tops", "womens-dresses"],
  },
  {
    username: "stride", name: "Stride & Co.", owner: ["Noah Bennett", "men", 22],
    tagline: "Sneakers, heels and bags built to be walked in",
    description: "Footwear and bags picked for comfort first. Every pair is tested on San Francisco hills before it makes the shelf.",
    sources: ["mens-shoes", "womens-shoes", "womens-bags"],
  },
  {
    username: "freshfields", name: "Fresh Fields Market", owner: ["Maya Thompson", "women", 26],
    tagline: "Produce from Bay Area farms, delivered same day",
    description: "Seasonal fruit and vegetables, meat, dairy and pantry staples. Orders before 4pm arrive the same evening.",
    sources: ["groceries"],
  },
  {
    username: "voltline", name: "Voltline", owner: ["Arjun Mehta", "men", 41],
    tagline: "Phones, laptops and the accessories that make them better",
    description: "Authorised reseller for the brands you know, plus the chargers, cases and earbuds we actually use ourselves.",
    sources: ["smartphones", "laptops", "tablets", "mobile-accessories"],
  },
  {
    username: "hearthoak", name: "Hearth & Oak", owner: ["Clara Jensen", "women", 49],
    tagline: "Furniture, decor and cookware for a home you love",
    description: "Solid furniture, warm decor and kitchen tools that last. We pack everything flat and plastic-free.",
    sources: ["furniture", "home-decoration", "kitchen-accessories"],
  },
  {
    username: "glowlab", name: "Glow Lab", owner: ["Ines Moreau", "women", 63],
    tagline: "Skincare, makeup and fragrance, honestly reviewed",
    description: "A tight edit of beauty products we'd recommend to friends, with ingredients listed and shades swatched.",
    sources: ["beauty", "fragrances", "skin-care"],
  },
  {
    username: "tickgleam", name: "Tick & Gleam", owner: ["Samuel Osei", "men", 36],
    tagline: "Watches, jewellery and sunglasses with a story",
    description: "Everyday watches, fine jewellery and sunglasses, each checked and polished in our Hayes Valley workshop.",
    sources: ["mens-watches", "womens-watches", "womens-jewellery", "sunglasses"],
  },
  {
    username: "peakmotion", name: "Peak Motion", owner: ["Jade Kim", "women", 15],
    tagline: "Training kit and outdoor gear for every sport",
    description: "Balls, bats, rackets and gym gear for weekend players and serious athletes alike.",
    sources: ["sports-accessories"],
  },
];

const PENDING_STORE = {
  username: "urbansprout", name: "Urban Sprout", owner: ["Felix Wagner", "men", 58],
  tagline: "Houseplants and planters for small spaces",
  description: "Low-maintenance plants grown in Oakland, potted in recycled planters and delivered by bike.",
};

// ------------------------------------------------------------------ catalog mapping
const CATEGORY_MAP = {
  "mens-shirts": ["fashion", "Men's shirts"], tops: ["fashion", "Women's tops"], "womens-dresses": ["fashion", "Dresses"],
  "mens-shoes": ["fashion", "Men's shoes"], "womens-shoes": ["fashion", "Women's shoes"], "womens-bags": ["fashion", "Bags"],
  groceries: ["grocery", null],
  smartphones: ["electronics", "Phones"], laptops: ["electronics", "Laptops"], tablets: ["electronics", "Tablets"],
  "mobile-accessories": ["electronics", "Accessories"],
  furniture: ["home", "Furniture"], "home-decoration": ["home", "Decor"], "kitchen-accessories": ["home", "Kitchen"],
  beauty: ["beauty", "Makeup"], fragrances: ["beauty", "Fragrance"], "skin-care": ["beauty", "Skincare"],
  "mens-watches": ["accessories", "Men's watches"], "womens-watches": ["accessories", "Women's watches"],
  "womens-jewellery": ["accessories", "Jewellery"], sunglasses: ["accessories", "Sunglasses"],
  "sports-accessories": ["sports", "Equipment"],
};

const GROCERY = {
  Apple: ["Fruits & veg", "1 kg"], Cucumber: ["Fruits & veg", "500 g"], "Green Bell Pepper": ["Fruits & veg", "250 g"],
  "Green Chili Pepper": ["Fruits & veg", "100 g"], Kiwi: ["Fruits & veg", "6 pcs"], Lemon: ["Fruits & veg", "6 pcs"],
  Mulberry: ["Fruits & veg", "250 g"], Potatoes: ["Fruits & veg", "2 kg"], "Red Onions": ["Fruits & veg", "1 kg"],
  Strawberry: ["Fruits & veg", "400 g"], "Beef Steak": ["Meat & fish", "500 g"], "Chicken Meat": ["Meat & fish", "1 kg"],
  "Fish Steak": ["Meat & fish", "500 g"], Eggs: ["Dairy & eggs", "12 pcs"], Milk: ["Dairy & eggs", "1 L"],
  "Ice Cream": ["Dairy & eggs", "1 L"], "Cooking Oil": ["Pantry", "1 L"], "Honey Jar": ["Pantry", "500 g"],
  "Nescafe Coffee": ["Pantry", "200 g"], Rice: ["Pantry", "5 kg"], "Protein Powder": ["Pantry", "1 kg"],
  Juice: ["Drinks", "1 L"], "Soft Drinks": ["Drinks", "6 x 330 ml"], Water: ["Drinks", "6 x 1 L"],
  "Cat Food": ["Pets", "2 kg"], "Dog Food": ["Pets", "3 kg"], "Tissue Paper Box": ["Household", "3 boxes"],
};

const SIZES = {
  "mens-shirts": ["S", "M", "L", "XL"], tops: ["XS", "S", "M", "L", "XL"], "womens-dresses": ["XS", "S", "M", "L"],
  "mens-shoes": ["7", "8", "9", "10", "11"], "womens-shoes": ["5", "6", "7", "8", "9"],
};

// ------------------------------------------------------------------ helpers
const portrait = (gender, n) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;
const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${DOMAIN}`;
const phoneFor = (r) => `+1 415 ${String(Math.floor(between(200, 999, r))).padStart(3, "0")} ${String(Math.floor(between(1000, 9999, r)))}`;

const seedPasswordHash = await hashPassword(process.env.SEED_PASSWORD);
const demoPasswordHash = await hashPassword(process.env.NEXT_PUBLIC_DEMO_PASSWORD);

async function upsertUser({ email, name, image = null, role = "CUSTOMER", phone = null, vehicle = null, isOnline = false, passwordHash, syncPassword = false }) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // Keep the private admin's password in step with ADMIN_PASSWORD in .env
    if (syncPassword) {
      await prisma.account.updateMany({ where: { userId: existing.id, providerId: "credential" }, data: { password: passwordHash } });
    }
    return prisma.user.update({ where: { id: existing.id }, data: { role, vehicle, isOnline, image: existing.image || image } });
  }
  const id = randomUUID().replace(/-/g, "");
  const user = await prisma.user.create({
    data: { id, email, name, image, role, phone, vehicle, isOnline, emailVerified: true, createdAt: new Date(now - between(40, 120) * DAY) },
  });
  await prisma.account.create({
    data: { id: randomUUID().replace(/-/g, ""), accountId: id, providerId: "credential", userId: id, password: passwordHash },
  });
  return user;
}

async function upsertAddress(user, { label, street, isDefault }, r) {
  const existing = await prisma.address.findFirst({ where: { userId: user.id, label } });
  if (existing) return existing;
  const spot = near(r);
  return prisma.address.create({
    data: {
      userId: user.id, label, name: user.name, phone: user.phone || phoneFor(r), street,
      city: "San Francisco", state: "CA", zip: `941${String(Math.floor(between(2, 34, r))).padStart(2, "0")}`,
      country: "United States", lat: spot.lat, lng: spot.lng, isDefault,
    },
  });
}

const flowFor = (status) => {
  const flow = ["PLACED", "CONFIRMED", "PACKED", "OUT_FOR_DELIVERY", "DELIVERED"];
  if (status === "CANCELLED") return ["PLACED", "CANCELLED"];
  return flow.slice(0, flow.indexOf(status) + 1);
};

// Creates one store order unless an order with this number already exists
async function seedOrder({ number, user, address, store, lines, status, createdAt, paymentMethod = "COD", rider = null, couponCode = null }) {
  const existing = await prisma.order.findUnique({ where: { number } });
  if (existing) return existing;

  const subtotal = round2(lines.reduce((sum, l) => sum + l.price * l.quantity, 0));
  const discount = couponCode ? round2(subtotal * 0.1) : 0;
  const deliveryFee = subtotal >= 50 ? 0 : 4.99;
  const steps = flowFor(status);
  // Space the status changes out, but never past the present moment
  const gap = Math.min(3.5 * HOUR, (now - createdAt.getTime()) / steps.length);
  const history = steps.map((s, i) => ({ status: s, at: new Date(createdAt.getTime() + i * gap).toISOString() }));
  const outForDelivery = status === "OUT_FOR_DELIVERY";
  const riderSpot = outForDelivery && store.lat && address.lat
    ? { riderLat: store.lat + (address.lat - store.lat) * 0.55, riderLng: store.lng + (address.lng - store.lng) * 0.55, riderSeenAt: new Date() }
    : {};

  return prisma.order.create({
    data: {
      number, checkoutId: `seed-${number}`, userId: user.id, storeId: store.id, riderId: rider?.id || null,
      shippingAddress: {
        label: address.label, name: address.name, phone: address.phone, street: address.street, city: address.city,
        state: address.state, zip: address.zip, country: address.country, lat: address.lat, lng: address.lng,
      },
      subtotal, discount, deliveryFee, total: round2(subtotal - discount + deliveryFee), couponCode,
      paymentMethod, isPaid: paymentMethod === "STRIPE" || status === "DELIVERED",
      status, statusHistory: history, deliveryOtp: String(Math.floor(between(1000, 9999))),
      createdAt, updatedAt: new Date(history.at(-1).at), ...riderSpot,
      items: {
        create: lines.map((l) => ({
          productId: l.id, name: l.name, image: l.images[0], size: l.size || null, unit: l.unit || null, quantity: l.quantity, price: l.price,
        })),
      },
    },
  });
}

const linesFrom = (products, r, max = 3) => {
  const chosen = new Map();
  const count = 1 + Math.floor(r() * max);
  for (let i = 0; i < count; i++) {
    const p = pick(products, r);
    if (!chosen.has(p.id)) chosen.set(p.id, { ...p, quantity: 1 + Math.floor(r() * 2), size: p.sizes.length ? pick(p.sizes, r) : null });
  }
  return [...chosen.values()];
};

// ------------------------------------------------------------------ run
console.log("Fetching catalog from DummyJSON…");
const res = await fetch("https://dummyjson.com/products?limit=0");
if (!res.ok) throw new Error(`DummyJSON returned ${res.status}`);
const { products: source } = await res.json();

console.log("Accounts…");
const demo = await upsertUser({
  email: process.env.NEXT_PUBLIC_DEMO_EMAIL.toLowerCase(), name: "Alex Rivera", image: portrait("women", 79),
  phone: "+1 415 555 0142", passwordHash: demoPasswordHash,
});

if (process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL) {
  await upsertUser({ email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL.toLowerCase(), name: "Morgan Admin", image: portrait("men", 3), role: "ADMIN", passwordHash: demoPasswordHash });
}
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  await upsertUser({ email: process.env.ADMIN_EMAIL.toLowerCase(), name: "Vendora Admin", role: "ADMIN", passwordHash: await hashPassword(process.env.ADMIN_PASSWORD), syncPassword: true });
}

const riders = [];
for (const [index, [name, gender, n, vehicle, online]] of RIDERS.entries()) {
  const email = index === 0 && process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL ? process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL.toLowerCase() : emailFor(name);
  riders.push(await upsertUser({
    email, name, image: portrait(gender, n), role: "RIDER", vehicle, isOnline: online, phone: phoneFor(rand),
    passwordHash: index === 0 ? demoPasswordHash : seedPasswordHash,
  }));
}

const shoppers = [];
for (const [name, gender, n] of SHOPPERS) {
  const user = await upsertUser({ email: emailFor(name), name, image: portrait(gender, n), phone: phoneFor(rand), passwordHash: seedPasswordHash });
  const r = rng(user.email.length * 97 + n);
  await upsertAddress(user, { label: "Home", street: `${Math.floor(between(100, 2900, r))} ${pick(STREETS, r)}`, isDefault: true }, r);
  shoppers.push(user);
}

console.log("Stores and products…");
const storeRecords = [];
const allProducts = [];
for (const [index, def] of [...STORES, PENDING_STORE].entries()) {
  const r = rng(index * 131 + 7);
  const owner = def.owner === "demo"
    ? demo
    : await upsertUser({ email: emailFor(def.owner[0]), name: def.owner[0], image: portrait(def.owner[1], def.owner[2]), phone: phoneFor(r), passwordHash: seedPasswordHash });
  const spot = near(r, 0.025);
  const pending = def === PENDING_STORE;

  // Monogram logos and banner photos ship with the app in /public
  const artwork = { logo: `/stores/${def.username}.svg`, banner: `/images/stores/${def.username}.jpg` };
  const store = await prisma.store.upsert({
    where: { username: def.username },
    update: artwork,
    create: {
      ownerId: owner.id, name: def.name, username: def.username, tagline: def.tagline, description: def.description,
      ...artwork,
      email: `hello@${def.username}.${DOMAIN}`, phone: phoneFor(r),
      address: `${Math.floor(between(100, 2900, r))} ${pick(STREETS, r)}`, city: "San Francisco",
      lat: spot.lat, lng: spot.lng, status: pending ? "PENDING" : "APPROVED", isActive: true,
      createdAt: new Date(now - (pending ? 1 : between(60, 200, r)) * DAY),
    },
  });
  storeRecords.push(store);
  if (pending) continue;

  const items = source.filter((p) => def.sources.includes(p.category));
  for (const [i, item] of items.entries()) {
    const [category, sub] = CATEGORY_MAP[item.category];
    const grocery = GROCERY[item.title];
    const price = round2(item.price);
    const mrp = round2(price / (1 - Math.min(item.discountPercentage, 40) / 100));
    const deal = i % 6 === 2;
    const data = {
      storeId: store.id, name: item.title, description: item.description, brand: item.brand || null,
      category, subCategory: grocery ? grocery[0] : sub, images: item.images.slice(0, 4).map(encodeURI),
      mrp, price, unit: grocery ? grocery[1] : null, sizes: SIZES[item.category] || [],
      tags: [...new Set([...(item.tags || []), ...(grocery?.[0] === "Fruits & veg" ? ["organic"] : [])])],
      stock: i % 9 === 4 ? 3 : Math.max(8, item.stock), createdAt: new Date(now - between(2, 90, r) * DAY),
    };
    const dealFields = deal
      ? { dealPrice: round2(price * 0.78), dealEndsAt: new Date(now + between(5, 52, r) * HOUR) }
      : { dealPrice: null, dealEndsAt: null };

    const existing = await prisma.product.findFirst({ where: { storeId: store.id, name: item.title } });
    const product = existing
      ? await prisma.product.update({ where: { id: existing.id }, data: dealFields })
      : await prisma.product.create({ data: { ...data, ...dealFields } });
    allProducts.push({ ...product, reviews: item.reviews || [], storeIndex: index });
  }
}

const storeById = Object.fromEntries(storeRecords.map((s) => [s.id, s]));
const productsByStore = Object.groupBy(allProducts, (p) => p.storeId);
const liveStores = storeRecords.filter((s) => s.status === "APPROVED");

console.log("Coupons…");
const coupons = [
  { code: "WELCOME10", description: "10% off your first order", discount: 10, forNewUser: true, expiresAt: new Date(now + 60 * DAY) },
  { code: "FRESH15", description: "15% off orders over $30", discount: 15, minOrder: 30, expiresAt: new Date(now + 21 * DAY) },
  { code: "BIGCART20", description: "20% off orders over $150", discount: 20, minOrder: 150, expiresAt: new Date(now + 14 * DAY) },
  { code: "SPRING5", description: "5% off, spring promotion", discount: 5, isPublic: false, expiresAt: new Date(now - 10 * DAY) },
];
for (const c of coupons) await prisma.coupon.upsert({ where: { code: c.code }, update: { expiresAt: c.expiresAt }, create: c });

console.log("Order history…");
let seq = 0;
const orderNo = () => `VND-${String(31000 + ++seq)}`;
const statusForAge = (days, r) => {
  if (days > 4) return r() < 0.06 ? "CANCELLED" : "DELIVERED";
  if (days > 2) return pick(["DELIVERED", "DELIVERED", "OUT_FOR_DELIVERY"], r);
  return pick(["PLACED", "CONFIRMED", "PACKED", "PACKED"], r);
};

const orderRng = rng(4242);
for (let i = 0; i < 90; i++) {
  const buyer = pick(shoppers, orderRng);
  const store = pick(liveStores, orderRng);
  const days = Math.pow(orderRng(), 1.6) * 30;
  const status = statusForAge(days, orderRng);
  const address = await prisma.address.findFirst({ where: { userId: buyer.id } });
  const rider = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(status) ? pick(riders, orderRng) : null;
  await seedOrder({
    number: orderNo(), user: buyer, address, store, lines: linesFrom(productsByStore[store.id], orderRng),
    status, rider, createdAt: new Date(now - days * DAY), paymentMethod: orderRng() < 0.35 ? "STRIPE" : "COD",
  });
}

console.log("Demo account…");
const demoRng = rng(777);
const home = await upsertAddress(demo, { label: "Home", street: "1458 Valencia St", isDefault: true }, demoRng);
await upsertAddress(demo, { label: "Work", street: "301 Howard St", isDefault: false }, demoRng);

const otherStores = liveStores.filter((s) => s.ownerId !== demo.id);
const storeNamed = (u) => otherStores.find((s) => s.username === u);
const demoOrders = [
  { store: "freshfields", status: "OUT_FOR_DELIVERY", hours: 2, rider: riders[0] },
  { store: "voltline", status: "PACKED", hours: 20 },
  { store: "glowlab", status: "CONFIRMED", hours: 6 },
  { store: "stride", status: "DELIVERED", hours: 24 * 6 },
  { store: "hearthoak", status: "DELIVERED", hours: 24 * 13 },
  { store: "tickgleam", status: "DELIVERED", hours: 24 * 22 },
];
for (const o of demoOrders) {
  const store = storeNamed(o.store);
  await seedOrder({
    number: orderNo(), user: demo, address: home, store, lines: linesFrom(productsByStore[store.id], demoRng, 2),
    status: o.status, rider: o.rider || (o.status === "DELIVERED" ? riders[1] : null),
    createdAt: new Date(now - o.hours * HOUR), paymentMethod: o.status === "PACKED" ? "STRIPE" : "COD",
  });
}

// Demo shopper's own store gets fresh orders to manage
const threadline = liveStores.find((s) => s.ownerId === demo.id);
for (const [i, status] of ["PLACED", "PLACED", "CONFIRMED", "PACKED"].entries()) {
  const buyer = shoppers[(i * 5) % shoppers.length];
  const address = await prisma.address.findFirst({ where: { userId: buyer.id } });
  await seedOrder({
    number: orderNo(), user: buyer, address, store: threadline, lines: linesFrom(productsByStore[threadline.id], demoRng, 2),
    status, createdAt: new Date(now - (i * 3 + 1) * HOUR),
  });
}

// Wishlist and a few items waiting in the cart
const wishRng = rng(99);
for (let i = 0; i < 8; i++) {
  const p = pick(allProducts.filter((x) => x.storeId !== threadline.id), wishRng);
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: demo.id, productId: p.id } }, update: {}, create: { userId: demo.id, productId: p.id },
  });
}
const cartPicks = ["freshfields", "freshfields", "stride"].map((u) => pick(productsByStore[storeNamed(u).id], wishRng));
const cart = Object.fromEntries(cartPicks.map((p) => [p.sizes.length ? `${p.id}:${p.sizes[1]}` : p.id, p.unit ? 2 : 1]));
await prisma.user.update({ where: { id: demo.id }, data: { cart } });

console.log("Reviews…");
const delivered = await prisma.order.findMany({ where: { status: "DELIVERED" }, include: { items: true } });
const reviewText = [
  "Exactly as described and arrived quickly.", "Great quality for the price. Would buy again.",
  "Good, but the colour is slightly different from the photos.", "Rider was friendly and delivery was on time.",
  "Fits perfectly, really happy with it.", "Packaging could be better, product itself is great.",
];
const reviewRng = rng(55);
for (const order of delivered) {
  // Leave the demo account a couple of unrated items so the "Rate" flow has something to show
  if (order.userId === demo.id && order.createdAt > new Date(now - 10 * DAY)) continue;
  for (const item of order.items) {
    if (reviewRng() > 0.7) continue;
    const product = allProducts.find((p) => p.id === item.productId);
    const source = product?.reviews?.length ? pick(product.reviews, reviewRng) : null;
    const rating = source ? Math.max(3, source.rating) : 4 + Math.round(reviewRng());
    const review = source && reviewRng() < 0.5 ? `${source.comment} ${pick(reviewText, reviewRng)}` : pick(reviewText, reviewRng);
    await prisma.rating.upsert({
      where: { userId_productId_orderId: { userId: order.userId, productId: item.productId, orderId: order.id } },
      update: {},
      create: { userId: order.userId, productId: item.productId, orderId: order.id, rating, review, createdAt: new Date(order.updatedAt.getTime() + 20 * HOUR) },
    });
  }
}

// Ratings and sales counts are stored on products for fast sorting
await prisma.$executeRaw`
  UPDATE "Product" p SET
    "ratingAvg" = COALESCE((SELECT AVG(r.rating) FROM "Rating" r WHERE r."productId" = p.id), 0),
    "ratingCount" = (SELECT COUNT(*) FROM "Rating" r WHERE r."productId" = p.id),
    "soldCount" = COALESCE((SELECT SUM(i.quantity) FROM "OrderItem" i JOIN "Order" o ON o.id = i."orderId"
                            WHERE i."productId" = p.id AND o.status <> 'CANCELLED'), 0)`;

if (withEmail) {
  const you = await prisma.user.findUnique({ where: { email: withEmail } });
  if (!you) {
    console.warn(`--with: no account for ${withEmail}. Sign up in the app first, then re-run.`);
  } else {
    console.log(`Adding demo data to ${withEmail}…`);
    const r = rng(withEmail.length * 13);
    const address = await upsertAddress(you, { label: "Home", street: `${Math.floor(between(100, 2900, r))} ${pick(STREETS, r)}`, isDefault: true }, r);
    const tag = withEmail.replace(/[^a-z0-9]/g, "").slice(0, 6).toUpperCase();
    const plan = [["freshfields", "OUT_FOR_DELIVERY", 1], ["voltline", "PACKED", 10], ["stride", "DELIVERED", 24 * 5]];
    for (const [i, [u, status, hours]] of plan.entries()) {
      const store = storeNamed(u);
      await seedOrder({
        number: `VND-${tag}${i + 1}`, user: you, address, store, lines: linesFrom(productsByStore[store.id], r, 2), status,
        rider: status === "PACKED" ? null : riders[0], createdAt: new Date(now - hours * HOUR),
      });
    }
    for (let i = 0; i < 5; i++) {
      const p = pick(allProducts, r);
      await prisma.wishlistItem.upsert({
        where: { userId_productId: { userId: you.id, productId: p.id } }, update: {}, create: { userId: you.id, productId: p.id },
      });
    }
  }
}

const counts = await Promise.all([
  prisma.user.count(), prisma.store.count(), prisma.product.count(), prisma.order.count(), prisma.rating.count(),
]);
console.log(`Done: ${counts[0]} users, ${counts[1]} stores, ${counts[2]} products, ${counts[3]} orders, ${counts[4]} reviews.`);
console.log(`Demo login: ${process.env.NEXT_PUBLIC_DEMO_EMAIL}`);
await prisma.$disconnect();
