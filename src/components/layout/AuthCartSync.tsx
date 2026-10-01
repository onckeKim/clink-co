"use client";

import { useAuthCartSync } from "@/lib/hooks/use-auth-cart-sync";

/** Mounts the guest/account cart+wishlist merge listener globally. Renders nothing. */
export function AuthCartSync() {
  useAuthCartSync();
  return null;
}
