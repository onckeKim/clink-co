"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/catalogue/ErrorState";
import { buttonVariants } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function GlobalPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl px-6 py-24 sm:px-8">
      <ErrorState
        title="Something went wrong"
        description="We hit a snag loading this page. Please try again, or head back to the homepage."
        onRetry={reset}
      />
      <div className="mt-6 text-center">
        <Link href="/" className={cn(buttonVariants({ variant: "ghost" }))}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
