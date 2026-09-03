"use client";

import * as React from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import type { AdminCustomerSummary } from "@/lib/admin/customers-store";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatPrice } from "@/lib/utils";

export function AdminCustomersListView() {
  const [customers, setCustomers] = React.useState<AdminCustomerSummary[] | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    const id = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      fetch(`/api/admin/customers?${params.toString()}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { customers?: AdminCustomerSummary[] } | null) => setCustomers(data?.customers ?? []));
    }, 250);
    return () => window.clearTimeout(id);
  }, [search]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Customers</h1>
        <p className="mt-1.5 text-sm text-stone">Every registered customer account.</p>
      </div>

      <div className="relative max-w-md">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone" />
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email" className="pl-11" />
      </div>

      {customers === null ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-stone" />
        </div>
      ) : customers.length === 0 ? (
        <p className="py-16 text-center text-sm text-stone">No customers match this search.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total spend</TableHead>
              <TableHead>Marketing</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {customers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell className="max-w-[220px]">
                  <Link
                    href={`/admin/customers/${customer.id}`}
                    className="font-medium text-charcoal underline-offset-2 hover:underline"
                  >
                    {customer.firstName} {customer.lastName}
                  </Link>
                  <p className="truncate text-xs text-stone">{customer.email}</p>
                </TableCell>
                <TableCell>{customer.orderCount}</TableCell>
                <TableCell>{formatPrice(customer.totalSpend)}</TableCell>
                <TableCell>
                  {customer.marketingConsent ? (
                    <Badge variant="success">Subscribed</Badge>
                  ) : (
                    <Badge variant="neutral">Not subscribed</Badge>
                  )}
                </TableCell>
                <TableCell>
                  {customer.isDisabled ? <Badge variant="error">Disabled</Badge> : <Badge variant="success">Active</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
