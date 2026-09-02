import type { Metadata } from "next";
import { Inter, Fraunces } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

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
  openGraph: {
    title: "Clink & Co by HEIMSIGHT",
    description:
      "Premium glassware, barware and tableware for entertaining, gifting and everyday living.",
    siteName: "Clink & Co",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-ivory text-ink">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
