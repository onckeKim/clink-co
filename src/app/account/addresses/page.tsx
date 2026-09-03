import type { Metadata } from "next";
import { AddressesView } from "@/components/account/AddressesView";

export const metadata: Metadata = {
  title: "Address Book",
  robots: { index: false, follow: false },
};

export default function AccountAddressesPage() {
  return <AddressesView />;
}
