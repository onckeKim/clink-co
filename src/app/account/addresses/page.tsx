import type { Metadata } from "next";
import { AddressesView } from "@/components/account/AddressesView";

export const metadata: Metadata = {
  title: "Address Book",
};

export default function AccountAddressesPage() {
  return <AddressesView />;
}
