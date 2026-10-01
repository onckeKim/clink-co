/**
 * Role and permission definitions for the admin dashboard. Every account is
 * a "customer" by default (the storefront role, unrelated to admin access);
 * the six admin roles below are additive — granting one turns on `/admin`
 * access scoped to that role's permissions, nothing else changes about the
 * account's ability to shop as a customer too.
 */

export const ADMIN_ROLES = [
  "super_admin",
  "store_admin",
  "product_manager",
  "order_fulfilment",
  "content_editor",
  "customer_support",
] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type Role = "customer" | AdminRole;

export function isAdminRole(role: Role): role is AdminRole {
  return (ADMIN_ROLES as readonly string[]).includes(role);
}

export const ROLE_LABELS: Record<Role, string> = {
  customer: "Customer",
  super_admin: "Super Administrator",
  store_admin: "Store Administrator",
  product_manager: "Product Manager",
  order_fulfilment: "Order Fulfilment",
  content_editor: "Content Editor",
  customer_support: "Customer Support",
};

/** One entry per manageable resource; `view` implies read access, `write` implies create/update/delete for that resource (fine-grained enough for six roles without exploding into per-field permissions). */
export const PERMISSIONS = [
  "dashboard:view",
  "products:view",
  "products:write",
  "categories:view",
  "categories:write",
  "collections:view",
  "collections:write",
  "orders:view",
  "orders:fulfil",
  "orders:export",
  "customers:view",
  "customers:write",
  "promotions:view",
  "promotions:write",
  "content:view",
  "content:write",
  "media:view",
  "media:write",
  "settings:view",
  "settings:write",
  "team:view",
  "team:write",
  "audit:view",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

const ALL_PERMISSIONS = [...PERMISSIONS];

/**
 * The permission matrix. Deliberately a plain object (not a database table)
 * — these are fixed role definitions the business doesn't need to
 * reconfigure themselves; only *who holds which role* is admin-editable
 * (see /admin/team, super_admin-only).
 */
export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  super_admin: ALL_PERMISSIONS,
  store_admin: ALL_PERMISSIONS.filter((p) => p !== "team:write"),
  product_manager: ["dashboard:view", "products:view", "products:write", "categories:view", "categories:write", "collections:view", "collections:write", "media:view", "media:write"],
  order_fulfilment: ["dashboard:view", "orders:view", "orders:fulfil", "orders:export", "customers:view", "products:view"],
  content_editor: ["dashboard:view", "content:view", "content:write", "media:view", "media:write", "categories:view"],
  customer_support: ["dashboard:view", "customers:view", "customers:write", "orders:view"],
};

export function getPermissions(role: Role): Permission[] {
  return isAdminRole(role) ? ROLE_PERMISSIONS[role] : [];
}

export function hasPermission(role: Role, permission: Permission): boolean {
  return getPermissions(role).includes(permission);
}

/** Parses the comma-separated ADMIN_BOOTSTRAP_EMAILS env var into a normalized (lowercase, trimmed) set. */
export function getBootstrapAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_BOOTSTRAP_EMAILS ?? "";
  return new Set(
    raw
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
