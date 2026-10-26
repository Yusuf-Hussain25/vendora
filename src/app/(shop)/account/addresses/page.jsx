import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import AddressBook from "@/components/account/AddressBook";

export const metadata = { title: "Addresses" };

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await prisma.address.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
  });
  return <AddressBook addresses={addresses} userName={user.name} />;
}
