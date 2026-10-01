import { Suspense } from "react";
import type { Metadata } from "next";
import { ConfirmationView } from "@/components/checkout/ConfirmationView";

export const metadata: Metadata = {
  title: "Order Confirmed",
  robots: { index: false, follow: false },
};

export default async function ConfirmationPage({ params }: PageProps<"/checkout/confirmation/[orderNumber]">) {
  const { orderNumber } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-2xl px-6 py-24" />}>
      <ConfirmationView orderNumber={orderNumber} />
    </Suspense>
  );
}
