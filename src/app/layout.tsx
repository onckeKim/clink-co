import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieBannerLoader } from "@/components/layout/CookieBannerLoader";
import { AuthCartSync } from "@/components/layout/AuthCartSync";
import { PromoBannerBar } from "@/components/layout/PromoBannerBar";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { Analytics } from "@/components/analytics/Analytics";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
  display: "swap",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://clinkandco.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Clink & Co by HEIMSIGHT | Premium Drinkware & Barware",
    template: "%s | Clink & Co",
  },
  description:
    "Clink & Co by HEIMSIGHT — premium glassware, barware, tableware and gifting essentials made for moments worth raising a glass to.",
  keywords: [
    "Clink & Co",
    "HEIMSIGHT",
    "premium glassware",
    "barware",
    "drinkware",
    "tableware",
    "gift sets",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Clink & Co by HEIMSIGHT",
    description:
      "Premium glassware, barware and tableware for entertaining, gifting and everyday living.",
    siteName: "Clink & Co",
    type: "website",
    url: "/",
    locale: "en_ZA",
  },
  twitter: {
    card: "summary_large_image",
    title: "Clink & Co by HEIMSIGHT",
    description:
      "Premium glassware, barware and tableware for entertaining, gifting and everyday living.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-porcelain text-charcoal">
        <SiteChrome
          skipLink={
            <a
              href="#main-content"
              className="focus-ring sr-only rounded-full bg-charcoal px-5 py-2.5 text-sm font-medium text-warm-white focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[100]"
            >
              Skip to content
            </a>
          }
          header={<Header />}
          banners={<PromoBannerBar />}
          footer={<Footer />}
          cookieBanner={<CookieBannerLoader />}
          authCartSync={<AuthCartSync />}
        >
          {children}
        </SiteChrome>
        <Analytics />
      </body>
    </html>
  );
}
