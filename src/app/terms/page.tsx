import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The terms that govern your use of the Clink & Co by HEIMSIGHT website and your purchases from us.",
};

export default function TermsPage() {
  return <PolicyPageView content={getPolicyPage("terms")} />;
}
