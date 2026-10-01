"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ExternalLink } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { AdminNav } from "@/components/admin/AdminNav";
import { Toaster } from "@/components/ui/Toast";
import { ROLE_LABELS, type Permission, type Role } from "@/lib/admin/roles";
import { cn } from "@/lib/utils";

export function AdminShell({
  permissions,
  role,
  name,
  children,
}: {
  permissions: Permission[];
  role: Role;
  name: string;
  children: React.ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  React.useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-screen bg-porcelain">
      <div className="flex">
        <aside className="hidden w-64 shrink-0 border-r border-sand bg-warm-white lg:block print:hidden">
          <div className="sticky top-0 flex h-screen flex-col p-4">
            <div className="mb-6 px-2 pt-2">
              <Logo compact />
              <p className="mt-1 text-xs text-stone">Admin</p>
            </div>
            <AdminNav permissions={permissions} className="flex-1" />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-sand bg-warm-white px-4 py-3 sm:px-6 print:hidden">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="Open admin menu"
                className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-porcelain lg:hidden"
              >
                <Menu className="h-5 w-5" />
              </button>
              <div className="lg:hidden">
                <Logo compact />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/"
                target="_blank"
                className="focus-ring hidden items-center gap-1.5 text-xs text-stone underline-offset-2 hover:text-charcoal hover:underline sm:flex"
              >
                View storefront <ExternalLink className="h-3 w-3" />
              </Link>
              <div className="text-right">
                <p className="text-sm font-medium text-charcoal">{name}</p>
                <p className="text-xs text-stone">{ROLE_LABELS[role]}</p>
              </div>
            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 print:p-0">{children}</main>
        </div>
      </div>

      <AnimatePresence>
        {drawerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex lg:hidden"
            role="dialog"
            aria-modal="true"
            aria-label="Admin menu"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
              onClick={() => setDrawerOpen(false)}
              aria-hidden
            />
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={cn("relative flex h-full w-72 max-w-[85vw] flex-col bg-warm-white p-4 shadow-lifted")}
            >
              <div className="mb-6 flex items-center justify-between px-2 pt-2">
                <Logo compact />
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close menu"
                  className="focus-ring flex h-9 w-9 items-center justify-center rounded-full text-charcoal transition-colors hover:bg-porcelain"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <AdminNav permissions={permissions} onNavigate={() => setDrawerOpen(false)} className="flex-1 overflow-y-auto" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Toaster />
    </div>
  );
}
