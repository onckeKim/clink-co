"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package, MapPin, User as UserIcon, Heart, PartyPopper, ArrowRight } from "lucide-react";
import type { Order } from "@/lib/orders/types";
import { getPaymentStatusLabel } from "@/lib/orders/status";
import { Badge } from "@/components/ui/Badge";
import { buttonVariants } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";

interface ProfileResponse {
  firstName: string;
  lastName: string;
  email: string;
}

const QUICK_LINKS = [
  { href: "/account/orders", label: "Order History", description: "Track and review past orders", icon: Package },
  { href: "/account/addresses", label: "Address Book", description: "Manage delivery & billing addresses", icon: MapPin },
  { href: "/account/profile", label: "Profile", description: "Update your personal details", icon: UserIcon },
  { href: "/wishlist", label: "Wishlist", description: "Items you're saving for later", icon: Heart },
];

export function DashboardView() {
  const searchParams = useSearchParams();
  const justVerified = searchParams.get("welcome") === "1";

  const [profile, setProfile] = React.useState<ProfileResponse | null>(null);
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [linkedOrders, setLinkedOrders] = React.useState(0);

  React.useEffect(() => {
    fetch("/api/account/profile")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profile?: ProfileResponse } | null) => setProfile(data?.profile ?? null));

    fetch("/api/account/orders")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { orders?: Order[] } | null) => setOrders(data?.orders ?? []));

    fetch("/api/account/claim-orders", { method: "POST" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { linkedOrders?: number } | null) => {
        if (data?.linkedOrders) setLinkedOrders(data.linkedOrders);
      });
  }, []);

  const recentOrders = orders?.slice(0, 3) ?? [];
  const firstName = profile?.firstName || "there";

  return (
    <div className="flex flex-col gap-8">
      {justVerified && (
        <div className="flex items-center gap-2.5 rounded-2xl bg-success/10 px-5 py-4 text-sm text-success">
          <PartyPopper className="h-4 w-4 shrink-0" aria-hidden />
          Your email is verified — welcome to Clink &amp; Co.
        </div>
      )}
      {linkedOrders > 0 && (
        <div className="rounded-2xl bg-porcelain px-5 py-4 text-sm text-stone">
          We&apos;ve linked {linkedOrders} previous {linkedOrders === 1 ? "order" : "orders"} placed with this email
          address to your account.
        </div>
      )}

      <div>
        <h1 className="font-display text-3xl text-charcoal">Welcome back{profile ? `, ${firstName}` : ""}</h1>
        <p className="mt-1.5 text-sm text-stone">Here&apos;s what&apos;s happening with your account.</p>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-charcoal">Recent orders</h2>
          <Link
            href="/account/orders"
            className="focus-ring flex items-center gap-1 text-sm text-stone underline-offset-2 hover:text-charcoal hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {orders === null ? (
          <div className="flex flex-col gap-3">
            {[0, 1].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-sand/40" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-sand p-8 text-center">
            <p className="text-sm text-stone">You haven&apos;t placed any orders yet.</p>
            <Link href="/shop" className={cn(buttonVariants({ size: "sm" }), "mt-4")}>
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-3">
            {recentOrders.map((order) => {
              const payment = getPaymentStatusLabel(order.status);
              return (
                <li key={order.id}>
                  <Link
                    href={`/account/orders/${order.orderNumber}`}
                    className="focus-ring flex items-center justify-between gap-4 rounded-2xl border border-sand p-5 transition-colors hover:border-charcoal/40"
                  >
                    <div>
                      <p className="text-sm font-medium text-charcoal">{order.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-stone">
                        {new Date(order.createdAt).toLocaleDateString("en-ZA", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}{" "}
                        · {order.lines.length} {order.lines.length === 1 ? "item" : "items"}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={payment.tone}>{payment.label}</Badge>
                      <p className="text-sm font-medium text-charcoal">{formatPrice(order.total)}</p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div>
        <h2 className="mb-3 font-display text-lg text-charcoal">Quick links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {QUICK_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring flex items-center gap-4 rounded-2xl border border-sand p-5 transition-colors hover:border-charcoal/40"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-porcelain">
                <link.icon className="h-4.5 w-4.5 text-charcoal" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-medium text-charcoal">{link.label}</p>
                <p className="text-xs text-stone">{link.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
