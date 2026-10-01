import { Suspense } from "react";
import type { Metadata } from "next";
import { PaymentSimulatorView } from "@/components/checkout/PaymentSimulatorView";

export const metadata: Metadata = {
  title: "Complete Payment",
  robots: { index: false, follow: false },
};

export default async function PayPage({ params }: PageProps<"/checkout/pay/[orderNumber]">) {
  const { orderNumber } = await params;
  return (
    <Suspense fallback={<div className="mx-auto max-w-md px-6 py-24" />}>
      <PaymentSimulatorView orderNumber={orderNumber} />
    </Suspense>
  );
}
