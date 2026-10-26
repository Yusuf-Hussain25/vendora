import CartView from "@/components/cart/CartView";

export const metadata = { title: "Your cart" };

export default function CartPage() {
  return (
    <div className="container-x pt-8">
      <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mb-8">Your cart</h1>
      <CartView />
    </div>
  );
}
