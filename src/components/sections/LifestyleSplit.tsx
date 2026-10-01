import Image from "next/image";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/Button";
import { Reveal } from "@/components/motion/Reveal";
import { cn } from "@/lib/utils";

export function LifestyleSplit({
  eyebrow,
  title,
  description,
  cta,
  image,
  imageAlt,
  reverse = false,
}: {
  eyebrow: string;
  title: string;
  description: string;
  cta: { label: string; href: string };
  image: string;
  imageAlt: string;
  reverse?: boolean;
}) {
  return (
    <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
      <div
        className={cn(
          "grid items-center gap-10 lg:grid-cols-2 lg:gap-16",
          reverse && "lg:[&>*:first-child]:order-2",
        )}
      >
        <Reveal>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
            {eyebrow}
          </p>
          <h2 className="font-display max-w-md text-display-xl text-charcoal">
            {title}
          </h2>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-stone">{description}</p>
          <Link href={cta.href} className={cn(buttonVariants({ size: "lg" }), "mt-8")}>
            {cta.label}
          </Link>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-3xl">
            <Image src={image} alt={imageAlt} fill sizes="(min-width: 1024px) 45vw, 90vw" className="object-cover" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
