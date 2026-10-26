import { requireUser } from "@/lib/session";
import AccountNav from "@/components/account/AccountNav";
import Avatar from "@/components/ui/Avatar";

export default async function AccountLayout({ children }) {
  const user = await requireUser("/account/orders");
  return (
    <div className="container-x pt-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar src={user.image} name={user.name} size={56} />
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">{user.name}</h1>
          <p className="text-sm text-text-3 truncate">{user.email}</p>
        </div>
      </div>
      <AccountNav />
      <div className="mt-6">{children}</div>
    </div>
  );
}
