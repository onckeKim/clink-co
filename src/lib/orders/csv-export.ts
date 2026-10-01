import type { Order } from "./types";

const COLUMNS = [
  "Order Number",
  "Date",
  "Status",
  "Customer Name",
  "Email",
  "Payment Method",
  "Items",
  "Subtotal",
  "Discount",
  "Delivery Fee",
  "Tax",
  "Total",
  "Tracking Number",
] as const;

/** Escapes a CSV field per RFC 4180 — wraps in quotes and doubles any embedded quote whenever the value contains a comma, quote or newline. */
function csvField(value: string | number): string {
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/** Renders orders as a CSV string (with a header row) — the admin order list's "Export to CSV" action. */
export function ordersToCsv(orders: Order[]): string {
  const rows = orders.map((order) =>
    [
      order.orderNumber,
      new Date(order.createdAt).toISOString().slice(0, 10),
      order.status,
      order.customerName,
      order.customerEmail,
      order.paymentMethod,
      order.lines.reduce((sum, line) => sum + line.quantity, 0),
      order.subtotal,
      order.discountAmount,
      order.deliveryFee,
      order.taxAmount,
      order.total,
      order.trackingNumber ?? "",
    ]
      .map(csvField)
      .join(","),
  );

  return [COLUMNS.join(","), ...rows].join("\r\n");
}
