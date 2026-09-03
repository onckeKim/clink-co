import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { Disclosure } from "@/components/ui/Disclosure";
import { getFaqs } from "@/lib/admin/content-store";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about shipping, returns, product care and orders.",
};

export default function FaqPage() {
  const faqs = getFaqs();
  const categories = [...new Set(faqs.map((faq) => faq.category))];

  return (
    <div className="mx-auto max-w-3xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} className="mb-6" />

      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">Frequently Asked Questions</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Can&apos;t find what you&apos;re looking for? Get in touch and we&apos;ll help.
        </p>
      </div>

      <div className="flex flex-col gap-10">
        {categories.map((category) => (
          <div key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">{category}</h2>
            <div className="mt-3">
              {faqs
                .filter((faq) => faq.category === category)
                .map((faq) => (
                  <Disclosure key={faq.id} title={faq.question}>
                    <p className="text-sm leading-relaxed text-stone">{faq.answer}</p>
                  </Disclosure>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
