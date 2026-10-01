import { Suspense } from "react";
import type { Metadata } from "next";
import { DashboardView } from "@/components/account/DashboardView";

export const metadata: Metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <Suspense fallback={<div className="h-96" />}>
      <DashboardView />
    </Suspense>
  );
}
