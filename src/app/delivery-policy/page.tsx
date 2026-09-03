import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Delivery Policy",
  description: "Our delivery policy — areas, timeframes and fees for Clink & Co by HEIMSIGHT orders.",
  alternates: { canonical: "/delivery-policy" },
};

export default function DeliveryPolicyPage() {
  return <PolicyPageView content={getPolicyPage("delivery-policy")} />;
}
