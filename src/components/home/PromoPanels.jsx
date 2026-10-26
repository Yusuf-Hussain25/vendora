import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import groceries from "../../../public/images/editorial/groceries.jpg";
import workspace from "../../../public/images/editorial/workspace.jpg";

export default function PromoPanels({ groceryCount, electronicsCount }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <Link href="/shop?category=grocery" className="group relative overflow-hidden rounded-lg bg-forest text-ivory min-h-[300px] sm:min-h-[340px] flex">
        <Image src={groceries} alt="Fresh vegetables and fruit on a wooden board" fill placeholder="blur" sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-right transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-forest/80 md:bg-transparent md:bg-gradient-to-r md:from-forest md:via-forest/85 md:to-transparent" />
        <div className="relative self-center p-7 sm:p-10 max-w-[330px]">
          <h3 className="font-display text-[34px] sm:text-[40px] leading-[1.05]">Fresh groceries from local stores.</h3>
          <p className="mt-3 text-[15px] text-ivory/80">Fresh produce, dairy and your favourite Indian brands from neighbourhood stores. {groceryCount} items in stock.</p>
          <span className="btn btn-light mt-6">
            Shop groceries
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>

      <Link href="/shop?category=electronics" className="group relative overflow-hidden rounded-lg bg-cream min-h-[300px] sm:min-h-[340px] flex">
        <Image src={workspace} alt="A tidy desk with a laptop, monitor and plants" fill placeholder="blur" sizes="(max-width: 768px) 100vw, 50vw" className="object-cover object-right transition-transform duration-700 ease-out group-hover:scale-[1.03]" />
        <div className="absolute inset-0 bg-[#eee9df]/85 md:bg-transparent md:bg-gradient-to-r md:from-[#eee9df] md:via-[#eee9df]/85 md:to-transparent" />
        <div className="relative self-center p-7 sm:p-10 max-w-[330px] text-[#171916]">
          <h3 className="font-display text-[34px] sm:text-[40px] leading-[1.05]">Upgrade your workspace.</h3>
          <p className="mt-3 text-[15px] text-[#656761]">Laptops, phones and accessories from trusted local stores. {electronicsCount} items to explore.</p>
          <span className="btn mt-6 bg-white text-[#171916] border-[#ddd9d0] group-hover:border-[#171916]">
            Shop electronics
            <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </Link>
    </div>
  );
}
