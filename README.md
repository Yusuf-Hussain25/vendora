# Vendora

A multi-vendor marketplace for fashion, fresh groceries, electronics and home goods. Shoppers check out across many independent stores in one cart and follow their rider live on a map. Sellers run their own storefronts, admins approve stores, and riders deliver with a door code.

Built with Next.js 16, Prisma, Postgres (Neon) and Better Auth.

## Quick start

```bash
npm install
cp .env.example .env     # fill in DATABASE_URL, DIRECT_URL and BETTER_AUTH_SECRET
npx prisma db push       # create the tables
npm run seed             # demo stores, products, orders and accounts
npm run dev              # http://localhost:3000
```

A full write-up with screenshots follows once the main screens are done.

## Author

Yusuf Hussain · https://github.com/Yusuf-Hussain25
