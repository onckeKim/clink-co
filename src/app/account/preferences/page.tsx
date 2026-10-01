import type { Metadata } from "next";
import { PreferencesView } from "@/components/account/PreferencesView";

export const metadata: Metadata = {
  title: "Preferences",
  robots: { index: false, follow: false },
};

export default function AccountPreferencesPage() {
  return <PreferencesView />;
}
