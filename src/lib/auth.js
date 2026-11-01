import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";
import prisma from "@/lib/prisma";

if (!process.env.BETTER_AUTH_SECRET) {
  throw new Error("BETTER_AUTH_SECRET is not set. Add a long random string to .env (openssl rand -base64 32).");
}

const google =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? { google: { clientId: process.env.GOOGLE_CLIENT_ID, clientSecret: process.env.GOOGLE_CLIENT_SECRET } }
    : {};

// BETTER_AUTH_URL is the custom domain. Also trust this deployment's own Vercel URLs, so
// logging in works on the vercel.app address and on preview deployments too.
const vercelOrigins = [process.env.VERCEL_URL, process.env.VERCEL_BRANCH_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL]
  .filter(Boolean)
  .map((host) => `https://${host}`);

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  trustedOrigins: vercelOrigins,
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
  plugins: [nextCookies()],
});

export const googleEnabled = Boolean(google.google);
