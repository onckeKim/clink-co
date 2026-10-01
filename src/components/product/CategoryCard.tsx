import Image from "next/image";
import Link from "next/link";
import type { Category } from "@/types/category";
import { cn } from "@/lib/utils";

export function CategoryCard({
  category,
  className,
  priority = false,
}: {
  category: Category;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/shop/${category.slug}`}
      className={cn(
        "focus-ring group relative block aspect-[3/4] overflow-hidden rounded-2xl",
        className,
      )}
    >
      <Image
        src={category.image}
        alt={category.name}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 24vw, (min-width: 640px) 45vw, 90vw"
        className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/70 via-charcoal/0 to-charcoal/0" />
      <div className="absolute inset-x-0 bottom-0 p-5">
        <p className="font-display text-lg text-warm-white">{category.name}</p>
        <p className="text-xs uppercase tracking-wide text-warm-white/70">
          {category.itemCount} items
        </p>
      </div>
    </Link>
  );
}
