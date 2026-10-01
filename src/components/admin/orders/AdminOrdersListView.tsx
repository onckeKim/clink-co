"use client";

import * as React from "react";
import Link from "next/link";
import { Download, Loader2, Search } from "lucide-react";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getPaymentStatusLabel } from "@/lib/orders/status";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { buttonVariants } from "@/components/ui/Button";
import { cn, formatPrice } from "@/lib/utils";

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: "pending_payment", label: "Payment pending" },
  { value: "paid", label: "Paid" },
  { value: "fulfilled", label: "Fulfilled" },
  { value: "payment_failed", label: "Payment failed" },
  { value: "cancelled", label: "Cancelled" },
];

function badgeVariantFor(tone: ReturnType<typeof getPaymentStatusLabel>["tone"]) {
  if (tone === "success") return "success" as const;
  if (tone === "error") return "error" as const;
  if (tone === "warning") return "warning" as const;
  return "neutral" as const;
}

export function AdminOrdersListView() {
  const [orders, setOrders] = React.useState<Order[] | null>(null);
  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");

  const queryString = React.useMemo(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    return params.toString();
  }, [search, status]);

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      fetch(`/api/admin/orders?${queryString}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { orders?: Order[] } | null) => setOrders(data?.orders ?? []));
    }, 250);
    return () => window.clearTimeout(id);
  }, [queryString]);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-charcoal">Orders</h1>
          <p className="mt-1.5 text-sm text-stone">Every order placed on the storefront.</p>
        </div>
        <a href={`/api/admin/orders/export?${queryString}`} className={cn(buttonVariants({ variant: "secondary", size: "sm" }))}>
          <Download className="h-4 w-4" />
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative min-w-[240px] flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by order number, customer or email"
            className="pl-11"
          />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-auto min-w-[180px]">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      </div>

      {orders === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : orders.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No orders match these filters.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => {
              const payment = getPaymentStatusLabel(order.status);
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <Link
                      href={`/admin/orders/${order.orderNumber}`}
                      className="font-medium text-charcoal underline-offset-2 hover:underline"
                    >
                      {order.orderNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-[200px]">
                    <p className="truncate text-charcoal">{order.customerName}</p>
                    <p className="truncate text-xs text-stone">{order.customerEmail}</p>
                  </TableCell>
                  <TableCell className="text-stone">
                    {new Date(order.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" })}
                  </TableCell>
                  <TableCell>
                    <Badge variant={badgeVariantFor(payment.tone)}>{payment.label}</Badge>
                  </TableCell>
                  <TableCell>{formatPrice(order.total)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
