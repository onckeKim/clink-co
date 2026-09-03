import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How Clink & Co by HEIMSIGHT collects, uses and protects your personal information.",
};

export default function PrivacyPage() {
  return <PolicyPageView content={getPolicyPage("privacy")} />;
}
