"use client";

import { Printer } from "lucide-react";
import type { Order } from "@/lib/orders/types";
import { InvoiceDocument } from "@/components/orders/InvoiceDocument";
import { Button } from "@/components/ui/Button";

export function AdminInvoiceView({ order, contactEmail }: { order: Order; contactEmail: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-end print:hidden">
        <Button type="button" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          Print / Save as PDF
        </Button>
      </div>

      <InvoiceDocument order={order} contactEmail={contactEmail} />
    </div>
  );
}
