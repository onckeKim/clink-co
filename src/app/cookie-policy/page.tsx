import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Cookie Policy",
  description: "How Clink & Co by HEIMSIGHT uses cookies and how to manage your preferences.",
  alternates: { canonical: "/cookie-policy" },
};

export default function CookiePolicyPage() {
  return <PolicyPageView content={getPolicyPage("cookie-policy")} />;
}
