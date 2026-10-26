import CartView from "@/components/cart/CartView";

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container-x pt-8">
      <h1 className="font-display text-[44px] sm:text-[52px] mb-8">Your cart</h1>
      <CartView />
    </div>
  );
}
