import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import { APIError, createAuthMiddleware, getSessionFromCtx } from "better-auth/api";
import prisma from "@/lib/prisma";
import { DEMO_BLOCKED_MESSAGE, isDemoEmail } from "@/lib/demo";

const DEMO_LOCKED_ROUTES = new Set([
  "/change-password",
  "/change-email",
  "/update-user",
  "/delete-user",
  "/revoke-sessions",
  "/revoke-other-sessions",
  "/link-social",
  "/unlink-account",
]);

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set. Add a long random string to .env (openssl rand -base64 32).");
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {};

// BETTER_AUTH_URL is the main (custom) domain. Also trust this deployment's own Vercel URLs,
// so logging in works on preview deployments, plus any extra addresses listed in
// TRUSTED_ORIGINS (comma-separated, e.g. the project's vercel.app alias).
const trustedOrigins = [
  ...[process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
    .filter(Boolean)
    .map((host) => `https://${host}`),
  ...(process.env.TRUSTED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
];

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: google,
  user: {
    additionalFields: {
      // Roles are only ever set by the seeder or an admin, never by sign-up input
      role: { type: "string", defaultValue: "CUSTOMER", input: false },
    },
  },
  hooks: {
    // Everyone shares the demo logins, so nobody may change their password, email or
    // profile, or sign the other visitors out.
    before: createAuthMiddleware(async (ctx) => {
      if (!DEMO_LOCKED_ROUTES.has(ctx.path)) return;
      const session = await getSessionFromCtx(ctx);
      if (isDemoEmail(session?.user?.email)) throw new APIError("FORBIDDEN", { message: DEMO_BLOCKED_MESSAGE });
    }),
  },
  plugins: [nextCookies()],
});

export const googleEnabled = Boolean(google.google);
