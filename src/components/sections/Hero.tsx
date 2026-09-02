"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { buttonVariants } from "@/components/ui/Button";
import { HeroWaypoint } from "@/components/sections/HeroWaypoint";
import { cn } from "@/lib/utils";

export function Hero() {
  return (
    <section className="-mt-24 px-3 pt-3 sm:px-5">
      <div className="relative mx-auto flex min-h-[560px] max-w-7xl items-end overflow-hidden rounded-3xl bg-charcoal sm:min-h-[640px]">
        <Image
          src="/images/hero-table.svg"
          alt="A table set with Clink & Co glassware, catching warm evening light"
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-90"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/10 to-charcoal/5" />

        <div className="relative flex w-full flex-col gap-6 p-6 sm:p-12 lg:p-16">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="text-xs font-semibold uppercase tracking-[0.3em] text-warm-white/70"
          >
            The Autumn Edit
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="font-display max-w-2xl text-display-2xl text-warm-white"
          >
            Made for moments worth raising a glass to.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md text-sm text-warm-white/75 sm:text-base"
          >
            Considered glassware, barware and tableware — designed for the dinners that run late
            and the Tuesdays that deserve a little ceremony too.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap gap-3 pt-2"
          >
            <Link href="/shop" className={cn(buttonVariants({ variant: "inverse", size: "lg" }))}>
              Shop the Edit
            </Link>
            <Link
              href="/our-story"
              className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "border-warm-white/40 text-warm-white hover:bg-warm-white hover:text-charcoal")}
            >
              Our Story
            </Link>
          </motion.div>
        </div>

        <HeroWaypoint />
      </div>
    </section>
  );
}
