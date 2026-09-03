import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Returns and Refund Policy",
  description: "Our returns and refund policy for Clink & Co by HEIMSIGHT orders.",
  alternates: { canonical: "/returns-policy" },
};

export default function ReturnsPolicyPage() {
  return <PolicyPageView content={getPolicyPage("returns-policy")} />;
}
