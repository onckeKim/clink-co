import type { Metadata } from "next";
import { PolicyPageView } from "@/components/content/PolicyPageView";
import { getPolicyPage } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "Website Disclaimer",
  description: "The disclaimer that applies to your use of the Keeps by HEIMSIGHT website.",
  alternates: { canonical: "/disclaimer" },
};

export default function DisclaimerPage() {
  return <PolicyPageView content={getPolicyPage("disclaimer")} />;
}
