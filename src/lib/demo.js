// The demo logins share a public password, so anyone can use them. They can browse, shop,
// order and open every dashboard, but can't change what other visitors see (stores,
// products, coupons, reviews) or lock everyone out (password, email, profile, sessions).

const DEMO_EMAILS = [
  process.env.NEXT_PUBLIC_DEMO_EMAIL,
  process.env.NEXT_PUBLIC_DEMO_ADMIN_EMAIL,
  process.env.NEXT_PUBLIC_DEMO_RIDER_EMAIL,
]
  .filter(Boolean)
  .map((email) => email.toLowerCase());

export const DEMO_BLOCKED_MESSAGE = "Demo accounts can look around but can't change this. Create your own account to try it.";

export const isDemoEmail = (email) => Boolean(email) && DEMO_EMAILS.includes(String(email).toLowerCase());
