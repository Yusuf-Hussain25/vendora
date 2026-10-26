import "./globals.css";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import prisma from "@/lib/prisma";
import { getCurrentUser, isSeller } from "@/lib/session";
import { themeInitScript } from "@/lib/theme";
import ThemeProvider from "@/components/providers/ThemeProvider";
import UserProvider from "@/components/providers/UserProvider";
import CartProvider from "@/components/providers/CartProvider";
import WishlistProvider from "@/components/providers/WishlistProvider";

export const metadata = {
  title: { default: "Vendora: shop independent stores in one cart", template: "%s · Vendora" },
  description:
    "Vendora is a multi-vendor marketplace for fashion, fresh groceries, electronics and home goods. One cart across independent stores, flash deals and live delivery tracking.",
  icons: { icon: "/icon.svg" },
};

export const viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#06090c" },
    { media: "(prefers-color-scheme: light)", color: "#f3f6f6" },
  ],
};

export default async function RootLayout({ children }) {
  const user = await getCurrentUser();
  const wishlist = user
    ? await prisma.wishlistItem.findMany({ where: { userId: user.id }, select: { productId: true } })
    : [];

  const summary = user && {
    id: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    isSeller: isSeller(user),
    store: user.store && { name: user.store.name, username: user.store.username, status: user.store.status },
  };

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="aurora" aria-hidden="true" />
        <ThemeProvider>
          <UserProvider user={summary}>
            <CartProvider key={user?.id || "guest"} signedIn={Boolean(user)} initialCart={user?.cart}>
              <WishlistProvider
                key={user?.id || "guest"}
                signedIn={Boolean(user)}
                initialIds={wishlist.map((w) => w.productId)}
              >
                {children}
              </WishlistProvider>
            </CartProvider>
          </UserProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
