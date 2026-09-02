"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, MapPin, User, ShieldCheck, Bell, CreditCard, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoutButton } from "@/components/account/LogoutButton";

const NAV_ITEMS = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/orders", label: "Order History", icon: Package },
  { href: "/account/addresses", label: "Address Book", icon: MapPin },
  { href: "/account/profile", label: "Profile", icon: User },
  { href: "/account/security", label: "Password & Security", icon: ShieldCheck },
  { href: "/account/preferences", label: "Preferences", icon: Bell },
  { href: "/account/payment-methods", label: "Payment Methods", icon: CreditCard },
  { href: "/wishlist", label: "Wishlist", icon: Heart },
];

export function AccountNav({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {NAV_ITEMS.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "focus-ring flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors",
              active ? "bg-charcoal text-warm-white" : "text-charcoal hover:bg-porcelain",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <div className="mt-2 border-t border-sand pt-2">
        <LogoutButton />
      </div>
    </nav>
  );
}
