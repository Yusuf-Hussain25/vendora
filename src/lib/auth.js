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

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
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
