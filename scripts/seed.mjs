// Fills Vendora with realistic Indian demo data: stores in Bengaluru and Mumbai, 280+ products
// priced in rupees (including the latest iPhone, Mac and Galaxy line-up and Indian pantry
// brands), shoppers, riders, coupons, orders across the last 30 days and reviews.
// Safe to re-run: existing records are reused, and flash deals are refreshed so they're always live.
//
//   npm run seed                       seed everything
//   npm run seed -- --with you@mail    also add orders, wishlist and an address to your own account
//
// Sources: DummyJSON (general catalog), data/electronics.json (Wikimedia Commons photos) and
// data/grocery-india.json (Open Food Facts). Image credits live in public/products/CREDITS-*.json.

import "dotenv/config";
import { readFileSync, existsSync } from "node:fs";
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
const round4 = (n) => Math.round(n * 1e4) / 1e4;

// Rupee price points shoppers expect: ₹49, ₹499, ₹2,499, ₹24,999 ...
function rupees(usd) {
  const v = usd * 84;
  if (v < 100) return Math.max(19, Math.ceil(v / 10) * 10 - 1);
  if (v < 1000) return Math.round(v / 50) * 50 - 1;
  if (v < 10000) return Math.round(v / 100) * 100 - 1;
  if (v < 100000) return Math.round(v / 1000) * 1000 - 1;
  return Math.round(v / 5000) * 5000 - 1;
}

// Deal prices land on the same familiar endings (₹1,699 rather than ₹1,698)
const dealPriceFor = (price, factor) => {
  const v = price * factor;
  if (v < 100) return Math.max(9, Math.round(v));
  const step = v < 1000 ? 10 : v < 10000 ? 100 : 1000;
  return Math.round(v / step) * step - 1;
};

// ------------------------------------------------------------------ places
const CITIES = {
  Bengaluru: {
    state: "Karnataka",
    center: { lat: 12.9716, lng: 77.5946 },
    areas: [
      ["Indiranagar", "560038", 12.9784, 77.6408], ["Koramangala", "560034", 12.9352, 77.6245], ["HSR Layout", "560102", 12.9116, 77.6474],
      ["Jayanagar", "560041", 12.925, 77.5938], ["Whitefield", "560066", 12.9698, 77.75], ["Malleshwaram", "560003", 13.0035, 77.5709],
    ],
    streets: ["100 Feet Road", "12th Main Road", "17th Cross", "80 Feet Road", "4th Block", "Sampige Road"],
  },
  Mumbai: {
    state: "Maharashtra",
    center: { lat: 19.076, lng: 72.8777 },
    areas: [
      ["Bandra West", "400050", 19.0596, 72.8295], ["Andheri West", "400053", 19.1364, 72.8296], ["Powai", "400076", 19.1176, 72.906],
      ["Lower Parel", "400013", 18.9984, 72.8272], ["Colaba", "400005", 18.9067, 72.8147], ["Juhu", "400049", 19.1075, 72.8263],
    ],
    streets: ["Hill Road", "Linking Road", "Carter Road", "Senapati Bapat Marg", "Lokhandwala Road", "Hiranandani Gardens"],
  },
  Pune: {
    state: "Maharashtra",
    center: { lat: 18.5204, lng: 73.8567 },
    areas: [["Koregaon Park", "411001", 18.5362, 73.894], ["Baner", "411045", 18.559, 73.7868]],
    streets: ["North Main Road", "Baner Road"],
  },
};

function placeIn(cityName, r) {
  const city = CITIES[cityName];
  const [area, pin, lat, lng] = pick(city.areas, r);
  return {
    area, pin, city: cityName, state: city.state,
    lat: round4(lat + between(-0.006, 0.006, r)), lng: round4(lng + between(-0.006, 0.006, r)),
    street: `${Math.floor(between(1, 480, r))}, ${pick(city.streets, r)}, ${area}`,
  };
}

const phoneFor = (r) => `+91 ${Math.floor(between(70000, 99999, r))} ${String(Math.floor(between(10000, 99999, r)))}`;

// ------------------------------------------------------------------ people
const SHOPPERS = [
  ["Aarav Mehta", "men", 32, "Bengaluru"], ["Diya Nair", "women", 44, "Bengaluru"], ["Kabir Rao", "men", 75, "Bengaluru"],
  ["Ishita Reddy", "women", 68, "Bengaluru"], ["Rohan Kulkarni", "men", 52, "Bengaluru"], ["Meera Pillai", "women", 21, "Bengaluru"],
  ["Vihaan Shah", "men", 11, "Mumbai"], ["Saanvi Desai", "women", 90, "Mumbai"], ["Arjun Kapoor", "men", 64, "Mumbai"],
  ["Anika Joshi", "women", 33, "Mumbai"], ["Neel Banerjee", "men", 46, "Mumbai"], ["Tara Menon", "women", 57, "Pune"],
];
const RIDERS = [
  ["Ravi Kumar", "men", 85, "Electric scooter", true, "Bengaluru"],
  ["Pooja Yadav", "women", 12, "Scooter", true, "Bengaluru"],
  ["Imran Sheikh", "men", 29, "Motorbike", false, "Mumbai"],
];

const STORES = [
  {
    username: "threadline", name: "Threadline Studio", owner: "demo", city: "Bengaluru", area: "Indiranagar",
    tagline: "Easy shirts, tops and dresses for every day",
    description: "A small Indiranagar studio of wardrobe staples. Breathable cottons, relaxed fits and colours that go with everything you already own.",
    sources: ["mens-shirts", "tops", "womens-dresses"],
  },
  {
    username: "freshfields", name: "Fresh Fields Market", owner: ["Lakshmi Iyer", "women", 26], city: "Bengaluru", area: "Koramangala",
    tagline: "Fruit, vegetables and dairy from Karnataka farms",
    description: "Seasonal produce, eggs, dairy and staples sourced from farms around Bengaluru. Orders before 4 pm arrive the same evening.",
    sources: ["groceries"],
  },
  {
    username: "voltline", name: "Voltline", owner: ["Karthik Subramanian", "men", 41], city: "Bengaluru", area: "Koramangala",
    tagline: "The latest iPhone, Mac, Galaxy and Pixel, plus the accessories that make them better",
    description: "Authorised reseller for Apple, Samsung, Google and OnePlus, with GST invoices, brand warranty and the chargers, cases and earbuds we actually use.",
    sources: ["smartphones", "laptops", "tablets", "mobile-accessories"],
  },
  {
    username: "glowlab", name: "Glow Lab", owner: ["Nandini Rao", "women", 63], city: "Bengaluru", area: "Jayanagar",
    tagline: "Skincare, makeup and fragrance, honestly reviewed",
    description: "A tight edit of beauty products we'd recommend to friends, with ingredients listed and shades swatched on Indian skin tones.",
    sources: ["beauty", "fragrances", "skin-care"],
  },
  {
    username: "peakmotion", name: "Peak Motion", owner: ["Siddharth Menon", "men", 15], city: "Bengaluru", area: "HSR Layout",
    tagline: "Cricket, football and gym gear for every sport",
    description: "Bats, balls, rackets and training kit for weekend players and serious athletes, tested on Bengaluru's turf grounds.",
    sources: ["sports-accessories"],
  },
  {
    username: "kiranacorner", name: "Kirana Corner", owner: ["Suresh Patil", "men", 58], city: "Mumbai", area: "Andheri West",
    tagline: "Your neighbourhood kirana, now with an app",
    description: "Biscuits, namkeen, masalas, dairy and drinks from the brands every Indian kitchen trusts. Family-run in Andheri since 1998.",
    sources: [],
  },
  {
    username: "stride", name: "Stride & Co.", owner: ["Zoya Qureshi", "women", 22], city: "Mumbai", area: "Bandra West",
    tagline: "Sneakers, heels and bags built to be walked in",
    description: "Footwear and bags picked for comfort first. Every pair is tested on Bandra's promenade before it makes the shelf.",
    sources: ["mens-shoes", "womens-shoes", "womens-bags"],
  },
  {
    username: "hearthoak", name: "Hearth & Oak", owner: ["Farhan Ali", "men", 49], city: "Mumbai", area: "Lower Parel",
    tagline: "Furniture, decor and cookware for a home you love",
    description: "Solid furniture, warm decor and kitchen tools that last. We pack everything flat and plastic-free.",
    sources: ["furniture", "home-decoration", "kitchen-accessories"],
  },
  {
    username: "tickgleam", name: "Tick & Gleam", owner: ["Rhea Malhotra", "women", 36], city: "Mumbai", area: "Colaba",
    tagline: "Watches, jewellery and sunglasses with a story",
    description: "Everyday watches, fine jewellery and sunglasses, each checked and polished in our Colaba workshop.",
    sources: ["mens-watches", "womens-watches", "womens-jewellery", "sunglasses"],
  },
];

const PENDING_STORE = {
  username: "urbansprout", name: "Urban Sprout", owner: ["Aditya Deshpande", "men", 58], city: "Pune", area: "Koregaon Park",
  tagline: "Houseplants and planters for small spaces",
  description: "Low-maintenance plants grown in Pune nurseries, potted in terracotta and delivered by cycle.",
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

// Pack sizes and Indian MRPs for the fresh section
const GROCERY = {
  Apple: ["Fruits & veg", "1 kg", 220], Cucumber: ["Fruits & veg", "500 g", 30], "Green Bell Pepper": ["Fruits & veg", "250 g", 40],
  "Green Chili Pepper": ["Fruits & veg", "100 g", 15], Kiwi: ["Fruits & veg", "3 pcs", 99], Lemon: ["Fruits & veg", "6 pcs", 40],
  Mulberry: ["Fruits & veg", "200 g", 120], Potatoes: ["Fruits & veg", "1 kg", 45], "Red Onions": ["Fruits & veg", "1 kg", 50],
  Strawberry: ["Fruits & veg", "200 g", 99], "Chicken Meat": ["Meat & fish", "500 g", 189], "Fish Steak": ["Meat & fish", "500 g", 449],
  Eggs: ["Dairy & eggs", "12 pcs", 96], Milk: ["Dairy & eggs", "1 L", 56], "Ice Cream": ["Dairy & eggs", "700 ml", 249],
  "Cooking Oil": ["Staples & masala", "1 L", 189], "Honey Jar": ["Spreads & sauces", "500 g", 299], "Nescafe Coffee": ["Beverages", "200 g", 699],
  Rice: ["Staples & masala", "5 kg", 549], "Protein Powder": ["Pantry", "1 kg", 2499], Juice: ["Beverages", "1 L", 120],
  "Soft Drinks": ["Beverages", "6 x 300 ml", 240], Water: ["Beverages", "6 x 1 L", 120], "Cat Food": ["Pets", "1.2 kg", 599],
  "Dog Food": ["Pets", "3 kg", 1299], "Tissue Paper Box": ["Household", "3 boxes", 249],
};
const SKIP = new Set(["Beef Steak"]);

const SIZES = {
  "mens-shirts": ["S", "M", "L", "XL"], tops: ["XS", "S", "M", "L", "XL"], "womens-dresses": ["XS", "S", "M", "L"],
  "mens-shoes": ["7", "8", "9", "10", "11"], "womens-shoes": ["4", "5", "6", "7", "8"],
};

const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : []);
const EXTRA = [...readJson("data/electronics.json"), ...readJson("data/grocery-india.json")];

// ------------------------------------------------------------------ helpers
const portrait = (gender, n) => `https://randomuser.me/api/portraits/${gender}/${n}.jpg`;
const emailFor = (name) => `${name.toLowerCase().replace(/[^a-z]+/g, ".")}@${DOMAIN}`;

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

async function upsertAddress(user, { label, place, isDefault }) {
  const existing = await prisma.address.findFirst({ where: { userId: user.id, label } });
  if (existing) return existing;
  return prisma.address.create({
    data: {
      userId: user.id, label, name: user.name, phone: user.phone || "+91 98450 12345", street: place.street,
      city: place.city, state: place.state, zip: place.pin, country: "India", lat: place.lat, lng: place.lng, isDefault,
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
  const deliveryFee = subtotal >= 499 ? 0 : 49;
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
    if (!chosen.has(p.id)) chosen.set(p.id, { ...p, quantity: p.price > 20000 ? 1 : 1 + Math.floor(r() * 2), size: p.sizes.length ? pick(p.sizes, r) : null });
  }
  return [...chosen.values()];
};

async function upsertProduct(storeId, data, dealFields) {
  const existing = await prisma.product.findFirst({ where: { storeId, name: data.name } });
  return existing
    ? prisma.product.update({ where: { id: existing.id }, data: { ...dealFields, images: data.images } })
    : prisma.product.create({ data: { ...data, storeId, ...dealFields } });
}

// ------------------------------------------------------------------ run
console.log("Fetching catalog from DummyJSON…");
const res = await fetch("https://dummyjson.com/products?limit=0");
if (!res.ok) throw new Error(`DummyJSON returned ${res.status}`);
const { products: source } = await res.json();

console.log("Accounts…");
const demo = await upsertUser({
  email: process.env.NEXT_PUBLIC_DEMO_EMAIL.toLowerCase(), name: "Ananya Iyer", image: portrait("women", 79),
  phone: "+91 98450 12345", passwordHash: demoPasswordHash,
});

if (process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL) {
  await upsertUser({ email: process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL.toLowerCase(), name: "Vikram Admin", image: portrait("men", 3), role: "ADMIN", passwordHash: demoPasswordHash });
}
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  await upsertUser({ email: process.env.ADMIN_EMAIL.toLowerCase(), name: "Vendora Admin", role: "ADMIN", passwordHash: await hashPassword(process.env.ADMIN_PASSWORD), syncPassword: true });
}

const riders = [];
for (const [index, [name, gender, n, vehicle, online, city]] of RIDERS.entries()) {
  const email = index === 0 && process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL ? process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL.toLowerCase() : emailFor(name);
  const rider = await upsertUser({
    email, name, image: portrait(gender, n), role: "RIDER", vehicle, isOnline: online, phone: phoneFor(rand),
    passwordHash: index === 0 ? demoPasswordHash : seedPasswordHash,
  });
  riders.push({ ...rider, city });
}

const shoppers = [];
for (const [name, gender, n, city] of SHOPPERS) {
  const user = await upsertUser({ email: emailFor(name), name, image: portrait(gender, n), phone: phoneFor(rand), passwordHash: seedPasswordHash });
  const r = rng(user.email.length * 97 + n);
  const address = await upsertAddress(user, { label: "Home", place: placeIn(city, r), isDefault: true });
  shoppers.push({ ...user, city, address });
}

console.log("Stores and products…");
const storeRecords = [];
const allProducts = [];
for (const [index, def] of [...STORES, PENDING_STORE].entries()) {
  const r = rng(index * 131 + 7);
  const owner = def.owner === "demo"
    ? demo
    : await upsertUser({ email: emailFor(def.owner[0]), name: def.owner[0], image: portrait(def.owner[1], def.owner[2]), phone: phoneFor(r), passwordHash: seedPasswordHash });
  const city = CITIES[def.city];
  const [, pin, lat, lng] = city.areas.find((a) => a[0] === def.area) || city.areas[0];
  const pending = def === PENDING_STORE;
  // Monogram logos and banner photos ship with the app in /public
  const artwork = {
    logo: `/stores/${def.username}.svg`, banner: `/images/stores/${def.username}.jpg`,
    city: def.city, address: `${Math.floor(between(1, 300, r))}, ${pick(city.streets, r)}, ${def.area} ${pin}`, lat, lng,
    tagline: def.tagline, description: def.description, phone: phoneFor(r),
  };

  const store = await prisma.store.upsert({
    where: { username: def.username },
    update: artwork,
    create: {
      ownerId: owner.id, name: def.name, username: def.username, ...artwork,
      email: `hello@${def.username}.${DOMAIN}`, status: pending ? "PENDING" : "APPROVED", isActive: true,
      createdAt: new Date(now - (pending ? 1 : between(60, 200, r)) * DAY),
    },
  });
  storeRecords.push({ ...store, cityName: def.city });
  if (pending) continue;

  const items = source.filter((p) => def.sources.includes(p.category) && !SKIP.has(p.title));
  for (const [i, item] of items.entries()) {
    const [category, sub] = CATEGORY_MAP[item.category];
    const grocery = GROCERY[item.title];
    const price = grocery ? grocery[2] : rupees(item.price);
    const mrp = grocery ? Math.round(price * 1.12) : rupees(item.price / (1 - Math.min(item.discountPercentage, 40) / 100));
    const deal = i % 6 === 2;
    const data = {
      name: item.title, description: item.description, brand: item.brand || null,
      category, subCategory: grocery ? grocery[0] : sub, images: item.images.slice(0, 4).map(encodeURI),
      mrp: Math.max(mrp, price), price, unit: grocery ? grocery[1] : null, sizes: SIZES[item.category] || [],
      tags: [...new Set([...(item.tags || []), ...(grocery?.[0] === "Fruits & veg" ? ["organic"] : [])])],
      stock: i % 9 === 4 ? 3 : Math.max(8, item.stock), createdAt: new Date(now - between(2, 90, r) * DAY),
    };
    const dealFields = deal
      ? { dealPrice: dealPriceFor(price, 0.8), dealEndsAt: new Date(now + between(5, 52, r) * HOUR) }
      : { dealPrice: null, dealEndsAt: null };
    const product = await upsertProduct(store.id, data, dealFields);
    allProducts.push({ ...product, reviews: item.reviews || [] });
  }

  // Curated Indian catalog: the latest phones and Macs, and pantry brands
  for (const [i, item] of EXTRA.filter((p) => p.store === def.username).entries()) {
    const data = {
      name: item.name, description: item.description, brand: item.brand, category: item.category, subCategory: item.subCategory,
      images: item.images, mrp: item.mrp, price: item.price, unit: item.unit || null, sizes: [], tags: item.tags || [],
      stock: i % 7 === 3 ? 4 : 15 + Math.floor(between(0, 60, r)), createdAt: new Date(now - between(1, 40, r) * DAY),
    };
    const deal = item.category === "grocery" ? i % 5 === 1 : i % 8 === 5;
    const dealFields = deal
      ? { dealPrice: dealPriceFor(item.price, item.category === "grocery" ? 0.85 : 0.93), dealEndsAt: new Date(now + between(6, 60, r) * HOUR) }
      : { dealPrice: null, dealEndsAt: null };
    const product = await upsertProduct(store.id, data, dealFields);
    allProducts.push({ ...product, reviews: [] });
  }
}

const productsByStore = Object.groupBy(allProducts, (p) => p.storeId);
const liveStores = storeRecords.filter((s) => s.status === "APPROVED");
// Orders can only come from stores that have something to sell
const sellingStores = liveStores.filter((s) => productsByStore[s.id]?.length);

console.log("Coupons…");
const coupons = [
  { code: "WELCOME10", description: "10% off your first order", discount: 10, forNewUser: true, expiresAt: new Date(now + 60 * DAY) },
  { code: "FRESH15", description: "15% off orders above ₹999", discount: 15, minOrder: 999, expiresAt: new Date(now + 21 * DAY) },
  { code: "BIGCART20", description: "20% off orders above ₹9,999", discount: 20, minOrder: 9999, expiresAt: new Date(now + 14 * DAY) },
  { code: "DIWALI5", description: "5% off, festive promotion", discount: 5, isPublic: false, expiresAt: new Date(now - 10 * DAY) },
];
for (const c of coupons) await prisma.coupon.upsert({ where: { code: c.code }, update: { expiresAt: c.expiresAt, description: c.description, minOrder: c.minOrder || 0 }, create: c });

console.log("Order history…");
let seq = 0;
const orderNo = () => `VND-${String(31000 + ++seq)}`;
const statusForAge = (days, r) => {
  if (days > 4) return r() < 0.06 ? "CANCELLED" : "DELIVERED";
  if (days > 2) return pick(["DELIVERED", "DELIVERED", "OUT_FOR_DELIVERY"], r);
  return pick(["PLACED", "CONFIRMED", "PACKED", "PACKED"], r);
};

const orderRng = rng(4242);
for (let i = 0; i < 110; i++) {
  const store = pick(sellingStores, orderRng);
  // Riders deliver within a city, so shoppers order from stores in their own city
  const locals = shoppers.filter((s) => s.city === store.cityName);
  const buyer = pick(locals.length ? locals : shoppers, orderRng);
  const days = Math.pow(orderRng(), 1.6) * 30;
  const status = statusForAge(days, orderRng);
  const cityRiders = riders.filter((r) => r.city === store.cityName);
  const rider = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(status) ? pick(cityRiders.length ? cityRiders : riders, orderRng) : null;
  await seedOrder({
    number: orderNo(), user: buyer, address: buyer.address, store, lines: linesFrom(productsByStore[store.id], orderRng),
    status, rider, createdAt: new Date(now - days * DAY), paymentMethod: orderRng() < 0.35 ? "STRIPE" : "COD",
  });
}

console.log("Demo account…");
const home = await upsertAddress(demo, {
  label: "Home", isDefault: true,
  place: { street: "Flat 4B, Lakeview Residency, 12th Main Road, Indiranagar", city: "Bengaluru", state: "Karnataka", pin: "560038", lat: 12.9719, lng: 77.6412 },
});
await upsertAddress(demo, {
  label: "Work", isDefault: false,
  place: { street: "3rd Floor, Prestige Tech Hub, 80 Feet Road, Koramangala", city: "Bengaluru", state: "Karnataka", pin: "560034", lat: 12.9339, lng: 77.6229 },
});

const storeNamed = (u) => liveStores.find((s) => s.username === u);
const demoRng = rng(777);
const demoOrders = [
  { store: "freshfields", status: "OUT_FOR_DELIVERY", hours: 2, rider: riders[0] },
  { store: "voltline", status: "PACKED", hours: 20 },
  { store: "glowlab", status: "CONFIRMED", hours: 6 },
  { store: "peakmotion", status: "DELIVERED", hours: 24 * 4 },
  { store: "stride", status: "DELIVERED", hours: 24 * 9 },
  { store: "kiranacorner", status: "DELIVERED", hours: 24 * 16 },
];
for (const o of demoOrders) {
  const store = storeNamed(o.store);
  if (!productsByStore[store.id]?.length) continue;
  await seedOrder({
    number: orderNo(), user: demo, address: home, store, lines: linesFrom(productsByStore[store.id], demoRng, 2),
    status: o.status, rider: o.rider || (o.status === "DELIVERED" ? riders[1] : null),
    createdAt: new Date(now - o.hours * HOUR), paymentMethod: o.status === "PACKED" ? "STRIPE" : "COD",
  });
}

// The demo shopper's own store gets fresh orders to manage
const threadline = liveStores.find((s) => s.ownerId === demo.id);
const bengaluruShoppers = shoppers.filter((s) => s.city === "Bengaluru");
for (const [i, status] of ["PLACED", "PLACED", "CONFIRMED", "PACKED"].entries()) {
  const buyer = bengaluruShoppers[i % bengaluruShoppers.length];
  await seedOrder({
    number: orderNo(), user: buyer, address: buyer.address, store: threadline, lines: linesFrom(productsByStore[threadline.id], demoRng, 2),
    status, createdAt: new Date(now - (i * 3 + 1) * HOUR),
  });
}

// Wishlist and a few items waiting in the cart (an iPhone, groceries and shoes)
const wishRng = rng(99);
const newest = allProducts.filter((p) => p.tags.includes("new launch"));
for (const p of [...newest.slice(0, 4), ...Array.from({ length: 5 }, () => pick(allProducts.filter((x) => x.storeId !== threadline.id), wishRng))]) {
  await prisma.wishlistItem.upsert({
    where: { userId_productId: { userId: demo.id, productId: p.id } }, update: {}, create: { userId: demo.id, productId: p.id },
  });
}
const kirana = productsByStore[storeNamed("kiranacorner").id] || [];
const cartPicks = [newest.find((p) => p.name === "iPhone 17") || newest[0], pick(kirana.length ? kirana : productsByStore[storeNamed("freshfields").id], wishRng), pick(productsByStore[storeNamed("freshfields").id], wishRng)].filter(Boolean);
const cart = Object.fromEntries(cartPicks.map((p) => [p.sizes.length ? `${p.id}:${p.sizes[1]}` : p.id, p.unit ? 2 : 1]));
await prisma.user.update({ where: { id: demo.id }, data: { cart } });

console.log("Reviews…");
const delivered = await prisma.order.findMany({ where: { status: "DELIVERED" }, include: { items: true } });
const reviewText = [
  "Exactly as described and arrived quickly.", "Great quality for the price. Would buy again.",
  "Good, but the colour is slightly different from the photos.", "Rider was polite and delivery was on time.",
  "Genuine product with a proper GST invoice.", "Packaging could be better, product itself is great.",
  "Delivered the same evening. Very happy.", "Value for money, recommended to my family.",
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

console.log("Inventory history…");
// SKUs for every product, then a stock history that adds up to today's stock:
// opening stock (today's stock plus everything sold since), then each sale in date order.
const unskued = await prisma.product.findMany({ where: { sku: null }, select: { id: true }, orderBy: { createdAt: "asc" } });
const skuStart = (await prisma.product.count({ where: { sku: { not: null } } })) + 1001;
for (const [i, p] of unskued.entries()) await prisma.product.update({ where: { id: p.id }, data: { sku: `VND-${skuStart + i}` } });

const withHistory = new Set((await prisma.stockMovement.findMany({ distinct: ["productId"], select: { productId: true } })).map((m) => m.productId));
const fresh = await prisma.product.findMany({ where: { id: { notIn: [...withHistory] } }, select: { id: true, storeId: true, stock: true, createdAt: true } });
if (fresh.length) {
  const sold = await prisma.orderItem.findMany({
    where: { productId: { in: fresh.map((p) => p.id) }, order: { status: { not: "CANCELLED" } } },
    select: { productId: true, quantity: true, order: { select: { id: true, number: true, createdAt: true, userId: true } } },
    orderBy: { order: { createdAt: "asc" } },
  });
  const soldBy = Object.groupBy(sold, (s) => s.productId);
  const rows = [];
  for (const p of fresh) {
    const sales = soldBy[p.id] || [];
    let balance = p.stock + sales.reduce((sum, s) => sum + s.quantity, 0);
    // A product can't be sold before it was listed: open the stock an hour before the first sale
    const openedAt = sales.length && sales[0].order.createdAt < p.createdAt ? new Date(sales[0].order.createdAt.getTime() - HOUR) : p.createdAt;
    if (openedAt !== p.createdAt) await prisma.product.update({ where: { id: p.id }, data: { createdAt: openedAt } });
    rows.push({ productId: p.id, storeId: p.storeId, change: balance, balance, reason: "INITIAL", note: "Opening stock", createdAt: openedAt });
    for (const s of sales) {
      balance -= s.quantity;
      rows.push({
        productId: p.id, storeId: p.storeId, change: -s.quantity, balance, reason: "SALE", note: `Order ${s.order.number}`,
        orderId: s.order.id, userId: s.order.userId, createdAt: s.order.createdAt,
      });
    }
  }
  await prisma.stockMovement.createMany({ data: rows });
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
    const address = await upsertAddress(you, { label: "Home", place: placeIn("Bengaluru", r), isDefault: true });
    const tag = withEmail.replace(/[^a-z0-9]/g, "").slice(0, 6).toUpperCase();
    const plan = [["freshfields", "OUT_FOR_DELIVERY", 1], ["voltline", "PACKED", 10], ["peakmotion", "DELIVERED", 24 * 5]];
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
