import type { Metadata } from "next";
import { SecurityView } from "@/components/account/SecurityView";

export const metadata: Metadata = {
  title: "Password & Security",
};

export default function AccountSecurityPage() {
  return <SecurityView />;
}
