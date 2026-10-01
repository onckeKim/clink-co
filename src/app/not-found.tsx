import type { Metadata } from "next";
import Link from "next/link";
import { Compass } from "lucide-react";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center gap-5 px-6 py-24 text-center sm:px-8">
      <Compass className="h-10 w-10 text-stone" strokeWidth={1.5} aria-hidden />
      <div>
        <h1 className="font-display text-display-lg text-charcoal">We couldn&apos;t find that page</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-stone">
          The page you&apos;re looking for may have moved or no longer exists. Let&apos;s get you back to
          browsing the collection.
        </p>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Link href="/shop" className={cn(buttonVariants({ size: "lg" }))}>
          Shop all
        </Link>
        <Link href="/" className={cn(buttonVariants({ variant: "secondary", size: "lg" }))}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
