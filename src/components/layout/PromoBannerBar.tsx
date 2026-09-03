import Link from "next/link";
import { getActiveBanners } from "@/lib/admin/content-store";

/** The storefront's top-of-page announcement bar — every currently-active promotional banner (Content → Banners), stacked if more than one is active. */
export function PromoBannerBar() {
  const banners = getActiveBanners();
  if (banners.length === 0) return null;

  return (
    <div className="flex flex-col">
      {banners.map((banner) =>
        banner.href ? (
          <Link
            key={banner.id}
            href={banner.href}
            className="focus-ring block bg-charcoal px-4 py-2 text-center text-xs font-medium text-warm-white transition-colors hover:bg-charcoal-soft sm:text-sm"
          >
            {banner.message}
          </Link>
        ) : (
          <p key={banner.id} className="bg-charcoal px-4 py-2 text-center text-xs font-medium text-warm-white sm:text-sm">
            {banner.message}
          </p>
        ),
      )}
    </div>
  );
}
