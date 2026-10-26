import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";

// The signed-in user with their store, read fresh from the database once per request.
// Roles come from the database (not the session cookie) so changes apply immediately.
export const getCurrentUser = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    include: { store: true },
  });
});

export const isSeller = (user) => user?.store?.status === "APPROVED" && user.store.isActive;

// Page guards: redirect when the visitor isn't allowed in.
export async function requireUser(next = "/") {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return user;
}

export async function requireRole(role, next = "/") {
  const user = await requireUser(next);
  if (user.role !== role) redirect("/");
  return user;
}

export async function requireSeller() {
  const user = await requireUser("/seller");
  if (!isSeller(user)) redirect("/sell");
  return user;
}

// Action guards: throw instead of redirecting, so server actions can return the message.
export class AuthError extends Error {}

export async function assertUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Please log in to continue.");
  return user;
}

export async function assertRole(role) {
  const user = await assertUser();
  if (user.role !== role) throw new AuthError("You don't have access to do that.");
  return user;
}

export async function assertSeller() {
  const user = await assertUser();
  if (!isSeller(user)) throw new AuthError("Your store isn't approved yet.");
  return user;
}
