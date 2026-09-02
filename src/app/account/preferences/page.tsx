import type { Metadata } from "next";
import { PreferencesView } from "@/components/account/PreferencesView";

export const metadata: Metadata = {
  title: "Preferences",
};

export default function AccountPreferencesPage() {
  return <PreferencesView />;
}
