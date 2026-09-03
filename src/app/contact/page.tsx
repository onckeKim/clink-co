import type { Metadata } from "next";
import Link from "next/link";
import { Mail, MessageCircle, Clock, HelpCircle } from "lucide-react";
import { Breadcrumbs } from "@/components/catalogue/Breadcrumbs";
import { ContactForm } from "@/components/contact/ContactForm";
import { getContactInfo } from "@/components/layout/nav-data";
import { getStoreSettings } from "@/lib/admin/settings-store";
import { ENQUIRY_CATEGORIES } from "@/lib/validations/contact";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Clink & Co by HEIMSIGHT team — order questions, product questions, returns and more.",
};

function isEnquiryCategory(value: string | undefined): value is (typeof ENQUIRY_CATEGORIES)[number] {
  return !!value && (ENQUIRY_CATEGORIES as readonly string[]).includes(value);
}

export default async function ContactPage({ searchParams }: PageProps<"/contact">) {
  const params = await searchParams;
  const categoryParam = typeof params.category === "string" ? params.category : undefined;
  const defaultCategory = isEnquiryCategory(categoryParam) ? categoryParam : undefined;

  const contactInfo = getContactInfo();
  const settings = getStoreSettings();

  return (
    <div className="mx-auto max-w-5xl px-6 py-10 sm:px-8">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Contact" }]} className="mb-6" />

      <div className="mb-10 max-w-2xl">
        <h1 className="font-display text-display-2xl text-charcoal">Get in Touch</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone">
          Have a question about an order, a product, or anything else? Send us a message and our team will get back to you.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_360px]">
        <ContactForm defaultCategory={defaultCategory} />

        <aside className="flex flex-col gap-8">
          <div className="rounded-2xl border border-sand bg-porcelain p-6">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-stone">Reach us directly</h2>
            <div className="mt-4 flex flex-col gap-4 text-sm text-charcoal">
              <a href={`mailto:${contactInfo.email}`} className="link-underline focus-ring flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                <span>{contactInfo.email}</span>
              </a>
              {contactInfo.whatsappHref && (
                <a
                  href={contactInfo.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="link-underline focus-ring flex items-start gap-3"
                >
                  <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                  <span>Chat with us on WhatsApp</span>
                </a>
              )}
              <div className="flex items-start gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-stone" />
                <div>
                  <p>Monday – Friday: 9am – 5pm SAST</p>
                  <p>Saturday: 9am – 1pm SAST</p>
                  <p className="text-stone">Closed Sundays and public holidays</p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-sand p-6">
            <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone">
              <HelpCircle className="h-3.5 w-3.5" />
              Quick answers
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone">
              Delivery times, returns, payments and more — check our FAQ before you write in, you might find your answer faster there.
            </p>
            <Link href="/faq" className="link-underline focus-ring mt-3 inline-block text-sm font-medium text-charcoal">
              Visit the FAQ →
            </Link>
          </div>

          <p className="text-xs leading-relaxed text-stone">
            We aim to respond to every enquiry within one business day. For order-related questions, including your order number helps us help you faster.
          </p>
          {settings.returnWindowDays > 0 && (
            <p className="text-xs leading-relaxed text-stone">
              Looking to start a return?{" "}
              <Link href="/returns" className="link-underline text-charcoal">
                Visit our Returns page
              </Link>
              .
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
