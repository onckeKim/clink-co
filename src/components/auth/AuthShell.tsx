import type * as React from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/layout/Logo";

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** A "New here? Create an account" style link under the card. */
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-porcelain px-6 py-16 sm:px-8">
      <div className="mb-8">
        <Logo />
      </div>

      <div className="w-full max-w-md rounded-3xl border border-sand bg-warm-white p-8 shadow-soft sm:p-10">
        <div className="mb-7 text-center">
          <h1 className="font-display text-2xl text-charcoal">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-stone">{subtitle}</p>}
        </div>

        {children}
      </div>

      {footer && <div className="mt-6 text-sm text-stone">{footer}</div>}

      <div className="mt-8 flex items-center gap-1.5 text-xs text-stone">
        <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
        Your details are encrypted and never shared.
      </div>

      <Link href="/" className="focus-ring mt-4 text-xs text-stone underline-offset-2 hover:text-charcoal hover:underline">
        Back to shop
      </Link>
    </div>
  );
}
