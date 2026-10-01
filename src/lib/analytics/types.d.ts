/** Ambient globals the third-party analytics scripts attach to `window` once loaded — see src/components/analytics/Analytics.tsx. */
export {};

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    fbq?: ((...args: unknown[]) => void) & { callMethod?: (...args: unknown[]) => void; queue?: unknown[] };
    ttq?: {
      track: (event: string, params?: Record<string, unknown>) => void;
      page: () => void;
      [key: string]: unknown;
    };
    clarity?: (...args: unknown[]) => void;
  }
}
