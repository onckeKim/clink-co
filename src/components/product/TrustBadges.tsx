"use client";

import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { paymentIcons } from "@/components/icons/PaymentIcons";
import { useStoreSettings } from "@/components/providers/StoreSettingsProvider";

export function TrustBadges() {
  const settings = useStoreSettings();
  const signals = [
    { Icon: ShieldCheck, label: "Secure checkout" },
    { Icon: Truck, label: "Delivered across South Africa" },
    { Icon: RotateCcw, label: `${settings.returnWindowDays}-day returns` },
    { Icon: BadgeCheck, label: "Verified customer reviews" },
  ];

  return (
    <div className="flex flex-col gap-5 border-t border-sand pt-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {signals.map(({ Icon, label }) => (
          <div key={label} className="flex items-center gap-2 text-xs text-stone">
            <Icon className="h-4 w-4 shrink-0 text-charcoal" />
            {label}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-2.5" aria-label="Accepted payment methods">
        {paymentIcons.map(({ label, Icon }) => (
          <Icon key={label} className="h-6 w-9 text-stone" />
        ))}
      </div>
    </div>
  );
}
