"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ErrorState } from "@/components/catalogue/ErrorState";

export default function ProductError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8">
      <ErrorState
        title="We couldn't load this product"
        description="Something went wrong loading this product's details. Try again, or head back to the shop."
        onRetry={retry}
      />
      <div className="mt-6 text-center">
        <Link href="/shop" className="text-sm font-medium text-charcoal underline-offset-4 hover:underline">
          Back to shop
        </Link>
      </div>
    </div>
  );
}
