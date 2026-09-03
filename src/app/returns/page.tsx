import type { Metadata } from "next";
import Link from "next/link";
import { RotateCcw, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { ReturnsPageClient } from "@/components/account/ReturnsPageClient";
import { getStoreSettings } from "@/lib/admin/settings-store";

export const metadata: Metadata = {
  title: "Returns",
  description: "Our returns policy, eligibility conditions and how to request a return for your Clink & Co by HEIMSIGHT order.",
};

export default function ReturnsPage() {
  const settings = getStoreSettings();

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Returns" }]} className="mb-6" />

      <h1 className="font-display text-display-2xl text-charcoal">Returns</h1>
      <p className="mt-4 text-sm leading-relaxed text-stone">
        Not quite right? Here&apos;s how our returns process works, what&apos;s eligible, and how to start a request.
      </p>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <RotateCcw className="h-5 w-5 text-stone" />
          Return window
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          You have <strong className="text-charcoal">{settings.returnWindowDays} days</strong> from the date your
          order is delivered to request a return. Items must be received back with us within this window, unless
          your item arrived damaged or incorrect — see below.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <CheckCircle2 className="h-5 w-5 text-stone" />
          Eligibility conditions
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-stone">
          <li>• Unused, unwashed and in its original condition, including any protective packaging or inserts.</li>
          <li>• Returned in the original (or equivalent protective) packaging to prevent damage in transit.</li>
          <li>• Accompanied by your order number.</li>
          <li>• Requested within the return window above.</li>
        </ul>
      </section>

      <section className="mt-12 rounded-2xl border border-sand bg-porcelain p-6">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <XCircle className="h-5 w-5 text-stone" />
          Excluded from returns
        </h2>
        <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-stone">
          <li>• Gift cards.</li>
          <li>• Personalised or custom-engraved items.</li>
          <li>• Items marked as final sale at the time of purchase.</li>
          <li>• Items that show signs of use, or are missing original packaging, for reasons other than a damaged or incorrect delivery.</li>
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <AlertTriangle className="h-5 w-5 text-stone" />
          Damaged or incorrect items
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          If an item arrives damaged or isn&apos;t what you ordered, please get in touch within 48 hours of delivery
          with photos of the item and packaging attached to your return request below — we&apos;ll arrange a
          replacement or full refund, including delivery costs, at no cost to you.
        </p>
      </section>

      <section className="mt-12">
        <h2 className="font-display flex items-center gap-2 text-display-sm text-charcoal">
          <Clock className="h-5 w-5 text-stone" />
          Refund timelines
        </h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Once your returned item is received and inspected, we&apos;ll process your refund to your original payment
          method within 5–7 business days. You&apos;ll receive an email confirmation once your refund has been
          issued — please allow a few additional days for it to reflect, depending on your bank.
        </p>
      </section>

      <section className="mt-16">
        <h2 className="font-display text-display-lg text-charcoal">Start or track a return</h2>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Return requests are managed from your account, so we can match them to your order history and keep you
          updated on status.
        </p>
        <div className="mt-6">
          <ReturnsPageClient />
        </div>
      </section>

      <p className="mt-12 text-xs leading-relaxed text-stone">
        Have a question before requesting a return?{" "}
        <Link href="/contact?category=Returns%20%26%20Refunds" className="link-underline text-charcoal">
          Contact our team
        </Link>{" "}
        or check our{" "}
        <Link href="/faq" className="link-underline text-charcoal">
          FAQ
        </Link>
        .
      </p>
    </div>
  );
}
