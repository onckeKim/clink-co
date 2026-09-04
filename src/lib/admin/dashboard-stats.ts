import type { Product } from "@/types/product";
import type { Order, OrderStatus } from "@/lib/orders/types";
import { getAllOrders } from "@/lib/orders/store";
import { listAdminProducts, getAdminProductById, getLowStockThreshold } from "@/lib/admin/products-store";
import { listProfiles } from "@/lib/account/profiles-store";
import { listReturnRequests } from "@/lib/account/returns-store";
import { listReviews, type AdminReview } from "@/lib/admin/reviews-store";
import { getOrderStatusChartColor, getOrderStatusLabel } from "@/lib/orders/status";

/** Orders that represent completed, actually-paid revenue — a pending/failed/cancelled order was never fulfilled or collected. */
const PAID_STATUSES = new Set<OrderStatus>(["paid", "fulfilled"]);
const TREND_DAYS = 30;
const RECENT_ORDERS_LIMIT = 8;
const BESTSELLERS_LIMIT = 5;
const LOW_STOCK_LIMIT = 8;
const PENDING_REVIEWS_LIMIT = 8;

export interface BestsellingProduct {
  product: Product;
  unitsSold: number;
}

export interface SalesTrendPoint {
  label: string;
  value: number;
}

export interface OrderStatusSlice {
  label: string;
  value: number;
  color: string;
}

export interface DashboardStats {
  totalSales: number;
  orderCount: number;
  averageOrderValue: number;
  /** Share of placed orders that actually completed payment — the honest, order-data-derived stand-in for a storefront-traffic conversion rate, which this app has no visit/session analytics to compute. */
  conversionRatePercent: number;
  lowStockProducts: Product[];
  lowStockCount: number;
  outOfStockProducts: Product[];
  outOfStockCount: number;
  recentOrders: Order[];
  bestsellingProducts: BestsellingProduct[];
  newCustomerCount30d: number;
  pendingReturnsCount: number;
  /** Reviews awaiting moderation (status = 'pending') — see src/lib/admin/reviews-store.ts / /admin/reviews. Not visible on any product page until a staff member publishes or rejects them. */
  pendingReviewsCount: number;
  pendingReviews: AdminReview[];
  salesTrend: SalesTrendPoint[];
  orderStatusDistribution: OrderStatusSlice[];
}

function daysAgo(days: number, from: Date): Date {
  const date = new Date(from);
  date.setDate(date.getDate() - days);
  return date;
}

export async function getDashboardStats(now: Date = new Date()): Promise<DashboardStats> {
  const orders = await getAllOrders();
  const paidOrders = orders.filter((o) => PAID_STATUSES.has(o.status));

  const totalSales = paidOrders.reduce((sum, o) => sum + o.total, 0);
  const orderCount = orders.length;
  const averageOrderValue = paidOrders.length > 0 ? totalSales / paidOrders.length : 0;
  const conversionRatePercent = orderCount > 0 ? (paidOrders.length / orderCount) * 100 : 0;

  const activeProducts = (await listAdminProducts()).filter((p) => !p.discontinued);
  const outOfStockProducts = activeProducts
    .filter((p) => p.stockQuantity <= 0)
    .sort((a, b) => a.name.localeCompare(b.name));
  const lowStockProducts = activeProducts
    .filter((p) => p.stockQuantity > 0 && p.stockQuantity <= getLowStockThreshold(p))
    .sort((a, b) => a.stockQuantity - b.stockQuantity);

  const recentOrders = orders.slice(0, RECENT_ORDERS_LIMIT);

  const unitsSoldByProductId = new Map<string, number>();
  for (const order of paidOrders) {
    for (const line of order.lines) {
      unitsSoldByProductId.set(line.productId, (unitsSoldByProductId.get(line.productId) ?? 0) + line.quantity);
    }
  }
  const bestsellingCandidates = await Promise.all(
    [...unitsSoldByProductId.entries()].map(async ([productId, unitsSold]) => ({
      product: await getAdminProductById(productId),
      unitsSold,
    })),
  );
  const bestsellingProducts: BestsellingProduct[] = bestsellingCandidates
    .filter((entry): entry is BestsellingProduct => Boolean(entry.product))
    .sort((a, b) => b.unitsSold - a.unitsSold)
    .slice(0, BESTSELLERS_LIMIT);

  const thirtyDaysAgo = daysAgo(TREND_DAYS, now);
  const allProfiles = await listProfiles();
  const newCustomerCount30d = allProfiles.filter(
    (p) => p.role === "customer" && new Date(p.createdAt) >= thirtyDaysAgo,
  ).length;

  const pendingReturnsCount = listReturnRequests().length;

  const pendingReviews = await listReviews("pending");

  const salesByDay = new Map<string, number>();
  for (const order of paidOrders) {
    const dayKey = order.createdAt.slice(0, 10);
    salesByDay.set(dayKey, (salesByDay.get(dayKey) ?? 0) + order.total);
  }
  const salesTrend: SalesTrendPoint[] = Array.from({ length: TREND_DAYS }, (_, i) => {
    const date = daysAgo(TREND_DAYS - 1 - i, now);
    const dayKey = date.toISOString().slice(0, 10);
    return {
      label: date.toLocaleDateString("en-ZA", { day: "numeric", month: "short" }),
      value: salesByDay.get(dayKey) ?? 0,
    };
  });

  const countsByStatus = new Map<OrderStatus, number>();
  for (const order of orders) {
    countsByStatus.set(order.status, (countsByStatus.get(order.status) ?? 0) + 1);
  }
  const orderStatusDistribution: OrderStatusSlice[] = [...countsByStatus.entries()]
    .map(([status, value]) => ({ label: getOrderStatusLabel(status), value, color: getOrderStatusChartColor(status) }))
    .sort((a, b) => b.value - a.value);

  return {
    totalSales,
    orderCount,
    averageOrderValue,
    conversionRatePercent,
    lowStockProducts: lowStockProducts.slice(0, LOW_STOCK_LIMIT),
    lowStockCount: lowStockProducts.length,
    outOfStockProducts: outOfStockProducts.slice(0, LOW_STOCK_LIMIT),
    outOfStockCount: outOfStockProducts.length,
    recentOrders,
    bestsellingProducts,
    newCustomerCount30d,
    pendingReturnsCount,
    pendingReviewsCount: pendingReviews.length,
    pendingReviews: pendingReviews.slice(0, PENDING_REVIEWS_LIMIT),
    salesTrend,
    orderStatusDistribution,
  };
}
