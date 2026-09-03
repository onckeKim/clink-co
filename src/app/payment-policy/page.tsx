import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Payment Policy",
  description: "How payments are processed and secured on the Clink & Co by HEIMSIGHT website.",
  alternates: { canonical: "/payment-policy" },
};

export default function PaymentPolicyPage() {
  return <PolicyPageView content={getPolicyPage("payment-policy")} />;
}
