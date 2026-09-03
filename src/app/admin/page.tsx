import type { Metadata } from "next";
import Link from "next/link";
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  Percent,
  PackageX,
  PackageMinus,
  UserPlus,
  Undo2,
} from "lucide-react";
import { requirePermission } from "@/lib/supabase/dal";
import { getDashboardStats } from "@/lib/admin/dashboard-stats";
import { getPaymentStatusLabel } from "@/lib/orders/status";
import { StatCard } from "@/components/admin/dashboard/StatCard";
import { AreaLineChart } from "@/components/admin/charts/AreaLineChart";
import { HorizontalBarChart } from "@/components/admin/charts/HorizontalBarChart";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/Table";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardPage() {
  await requirePermission("dashboard:view");
  const stats = getDashboardStats();

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl text-charcoal">Dashboard</h1>
        <p className="mt-1.5 text-sm text-stone">An overview of how the store is performing.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total sales" value={formatPrice(stats.totalSales)} icon={TrendingUp} />
        <StatCard label="Orders" value={stats.orderCount.toLocaleString("en-ZA")} icon={ShoppingBag} />
        <StatCard label="Average order value" value={formatPrice(stats.averageOrderValue)} icon={Receipt} />
        <StatCard
          label="Payment conversion"
          value={`${stats.conversionRatePercent.toFixed(0)}%`}
          icon={Percent}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          label="Out of stock"
          value={stats.outOfStockCount.toLocaleString("en-ZA")}
          icon={PackageX}
          href="/admin/products?stockLevel=out-of-stock"
          tone={stats.outOfStockCount > 0 ? "error" : "neutral"}
        />
        <StatCard
          label="Low stock"
          value={stats.lowStockCount.toLocaleString("en-ZA")}
          icon={PackageMinus}
          href="/admin/products?stockLevel=low-stock"
          tone={stats.lowStockCount > 0 ? "warning" : "neutral"}
        />
        <StatCard
          label="New customers (30d)"
          value={stats.newCustomerCount30d.toLocaleString("en-ZA")}
          icon={UserPlus}
          href="/admin/customers"
        />
        <StatCard
          label="Pending returns"
          value={stats.pendingReturnsCount.toLocaleString("en-ZA")}
          icon={Undo2}
          tone={stats.pendingReturnsCount > 0 ? "warning" : "neutral"}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Sales, last 30 days</CardTitle>
          </CardHeader>
          <CardContent>
            <AreaLineChart data={stats.salesTrend} formatValue={(v) => formatPrice(v)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Order status</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart data={stats.orderStatusDistribution} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent orders</CardTitle>
            <Link href="/admin/orders" className="text-xs font-medium text-charcoal underline-offset-2 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.recentOrders.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone">No orders yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentOrders.map((order) => {
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
                        <TableCell className="max-w-[160px] truncate">{order.customerName}</TableCell>
                        <TableCell>
                          <Badge
                            variant={payment.tone === "success" ? "success" : payment.tone === "error" ? "error" : payment.tone === "warning" ? "warning" : "neutral"}
                          >
                            {payment.label}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatPrice(order.total)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bestselling products</CardTitle>
          </CardHeader>
          <CardContent>
            <HorizontalBarChart
              data={stats.bestsellingProducts.map((b) => ({ label: b.product.name, value: b.unitsSold }))}
              formatValue={(v) => `${v} sold`}
              color="#1c1c1a"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Out of stock</CardTitle>
            <Link href="/admin/products?stockLevel=out-of-stock" className="text-xs font-medium text-charcoal underline-offset-2 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.outOfStockProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone">Nothing out of stock.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.outOfStockProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-porcelain"
                    >
                      <span className="truncate text-charcoal">{product.name}</span>
                      <Badge variant="error">0 in stock</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Low stock</CardTitle>
            <Link href="/admin/products?stockLevel=low-stock" className="text-xs font-medium text-charcoal underline-offset-2 hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="pt-0">
            {stats.lowStockProducts.length === 0 ? (
              <p className="py-6 text-center text-sm text-stone">Nothing running low.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {stats.lowStockProducts.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center justify-between rounded-lg px-2 py-1.5 text-sm hover:bg-porcelain"
                    >
                      <span className="truncate text-charcoal">{product.name}</span>
                      <Badge variant="warning">{product.stockQuantity} left</Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
