/**
 * Which analytics/marketing integrations are configured, read once from
 * env vars (see .env.local.example). A provider is "configured" purely
 * based on its ID being set — whether it actually loads in the browser is
 * a separate, consent-gated decision made by <Analytics /> at render time.
 */
export const analyticsConfig = {
  ga4MeasurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || undefined,
  metaPixelId: process.env.NEXT_PUBLIC_FB_PIXEL_ID || undefined,
  tiktokPixelId: process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID || undefined,
  clarityProjectId: process.env.NEXT_PUBLIC_CLARITY_ID || undefined,
} as const;

export function hasAnalyticsIntegrations(): boolean {
  return Boolean(
    analyticsConfig.ga4MeasurementId ||
      analyticsConfig.metaPixelId ||
      analyticsConfig.tiktokPixelId ||
      analyticsConfig.clarityProjectId,
  );
}
