"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Carousel } from "@/components/ui/Carousel";
import { buttonVariants } from "@/components/ui/Button";
import { HeroWaypoint } from "@/components/sections/HeroWaypoint";
import { getHeroSlides, type HeroSlide } from "@/data/hero-slides";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

function HeroSlideContent({ slide, animate }: { slide: HeroSlide; animate: boolean }) {
  return (
    <div className="relative min-h-[560px] w-full shrink-0 overflow-hidden sm:min-h-[640px]">
      <Image
        src={slide.image}
        alt={slide.imageAlt}
        fill
        priority={animate}
        sizes="100vw"
        className="object-cover opacity-90"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-charcoal/5" />

      <div className="relative flex h-full w-full flex-col justify-end gap-6 px-6 pb-6 pt-24 sm:px-12 sm:pb-12 sm:pt-28 lg:px-16 lg:pb-16 lg:pt-32">
        <motion.p
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-xs font-semibold uppercase tracking-[0.3em] text-warm-white/70"
        >
          {slide.eyebrow}
        </motion.p>
        <motion.h1
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
          className="font-display max-w-2xl text-display-2xl text-warm-white"
        >
          {slide.heading}
        </motion.h1>
        <motion.p
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
          className="max-w-md text-sm text-warm-white/75 sm:text-base"
        >
          {slide.copy}
        </motion.p>
        <motion.div
          initial={animate ? { opacity: 0, y: 20 } : false}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="flex flex-wrap gap-3 pt-2"
        >
          <Link
            href={slide.primaryCta.href}
            className={cn(buttonVariants({ variant: "inverse", size: "lg" }))}
          >
            {slide.primaryCta.label}
          </Link>
          <Link
            href={slide.secondaryCta.href}
            className={cn(
              buttonVariants({ variant: "secondary", size: "lg" }),
              "border-warm-white/40 text-warm-white hover:bg-warm-white hover:text-charcoal",
            )}
          >
            {slide.secondaryCta.label}
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export function Hero() {
  const slides = getHeroSlides().map((slide, i) => (
    <HeroSlideContent key={slide.id} slide={slide} animate={i === 0} />
  ));

  return (
    <section className="-mt-24 px-3 pt-3 sm:px-5">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-3xl bg-charcoal">
        <Carousel
          slides={slides}
          autoplayInterval={7000}
          inverse
          ariaLabel="Featured collections"
        />
        <HeroWaypoint />
      </div>
    </section>
  );
}
