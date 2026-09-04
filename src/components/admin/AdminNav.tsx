"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  FolderTree,
  Layers,
  ShoppingBag,
  Users,
  Percent,
  FileText,
  Image as ImageIcon,
  Settings,
  UserCog,
  ScrollText,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/admin/roles";
import { LogoutButton } from "@/components/account/LogoutButton";

const NAV_ITEMS: { href: string; label: string; icon: typeof LayoutDashboard; permission: Permission; exact?: boolean }[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard:view", exact: true },
  { href: "/admin/products", label: "Products", icon: Package, permission: "products:view" },
  { href: "/admin/categories", label: "Categories", icon: FolderTree, permission: "categories:view" },
  { href: "/admin/collections", label: "Collections", icon: Layers, permission: "collections:view" },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag, permission: "orders:view" },
  { href: "/admin/customers", label: "Customers", icon: Users, permission: "customers:view" },
  { href: "/admin/promotions", label: "Promotions", icon: Percent, permission: "promotions:view" },
  { href: "/admin/content", label: "Content", icon: FileText, permission: "content:view" },
  { href: "/admin/reviews", label: "Reviews", icon: Star, permission: "content:view" },
  { href: "/admin/media", label: "Media Library", icon: ImageIcon, permission: "media:view" },
  { href: "/admin/settings", label: "Store Settings", icon: Settings, permission: "settings:view" },
  { href: "/admin/team", label: "Admin Team", icon: UserCog, permission: "team:view" },
  { href: "/admin/audit-log", label: "Audit Log", icon: ScrollText, permission: "audit:view" },
];

export function AdminNav({ permissions, onNavigate, className }: { permissions: Permission[]; onNavigate?: () => void; className?: string }) {
  const pathname = usePathname();
  const items = NAV_ITEMS.filter((item) => permissions.includes(item.permission));

  return (
    <nav className={cn("flex flex-col gap-1", className)}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
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
