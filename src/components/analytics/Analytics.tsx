"use client";

import * as React from "react";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useConsentStore } from "@/store/consent-store";
import { useMounted } from "@/lib/hooks/use-mounted";
import { analyticsConfig } from "@/lib/analytics/config";

/**
 * Mounts every configured analytics/marketing integration, gated on both
 * an env var being set (see src/lib/analytics/config.ts) AND the matching
 * cookie-consent category (src/store/consent-store.ts) — GA4 and Clarity
 * need "analytics" consent, the Meta and TikTok pixels need "marketing"
 * consent. Nothing renders before mount or before a consent decision is
 * recorded, so no tracking script loads pre-consent even for a split
 * second. Rendered once from the root layout.
 */
export function Analytics() {
  const mounted = useMounted();
  const hasDecided = useConsentStore((state) => state.hasDecided);
  const analytics = useConsentStore((state) => state.analytics);
  const marketing = useConsentStore((state) => state.marketing);

  if (!mounted || !hasDecided) return null;

  return (
    <>
      {analytics && analyticsConfig.ga4MeasurementId && <GoogleAnalytics measurementId={analyticsConfig.ga4MeasurementId} />}
      {analytics && analyticsConfig.clarityProjectId && <MicrosoftClarity projectId={analyticsConfig.clarityProjectId} />}
      {marketing && analyticsConfig.metaPixelId && <MetaPixel pixelId={analyticsConfig.metaPixelId} />}
      {marketing && analyticsConfig.tiktokPixelId && <TikTokPixel pixelId={analyticsConfig.tiktokPixelId} />}
    </>
  );
}

function GoogleAnalytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  const isFirstRender = React.useRef(true);

  React.useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.gtag?.("event", "page_view", { page_path: pathname });
  }, [pathname]);

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`} strategy="afterInteractive" />
      <Script id="ga4-init" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${measurementId}');`}
      </Script>
    </>
  );
}

function MicrosoftClarity({ projectId }: { projectId: string }) {
  return (
    <Script id="clarity-init" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}

function MetaPixel({ pixelId }: { pixelId: string }) {
  return (
    <Script id="meta-pixel-init" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${pixelId}');
fbq('track', 'PageView');`}
    </Script>
  );
}

function TikTokPixel({ pixelId }: { pixelId: string }) {
  return (
    <Script id="tiktok-pixel-init" strategy="afterInteractive">
      {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<e.length;n++)ttq.setAndDefer(e,e[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script");n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};
  ttq.load('${pixelId}');
  ttq.page();
}(window, document, 'ttq');`}
    </Script>
  );
}
