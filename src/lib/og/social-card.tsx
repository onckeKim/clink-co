/**
 * Shared branded card for dynamic Open Graph / Twitter images, rendered via
 * `next/og`'s ImageResponse (Satori — flexbox + inline styles only, see
 * brand-mark.tsx). Used by opengraph-image.tsx routes for the homepage,
 * products, collections and journal articles, so every social preview
 * looks like one system regardless of whether the underlying content has
 * real photography (this project's seed images are local SVG placeholders,
 * which most social platforms won't render as an og:image at all).
 */
export function SocialCard({
  eyebrow,
  title,
  footer,
}: {
  eyebrow?: string;
  title: string;
  footer?: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        background: "#f7f5f0",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 11,
            background: "#1c1c1a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <span style={{ fontFamily: "serif", fontSize: 26, color: "#fcfbf8" }}>C</span>
        </div>
        <span style={{ fontSize: 22, letterSpacing: 3, textTransform: "uppercase", color: "#1c1c1a" }}>
          Clink &amp; Co
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 980 }}>
        {eyebrow && (
          <span style={{ fontSize: 24, letterSpacing: 4, textTransform: "uppercase", color: "#b69a68" }}>
            {eyebrow}
          </span>
        )}
        <span style={{ fontFamily: "serif", fontSize: 60, lineHeight: 1.15, color: "#1c1c1a" }}>{title}</span>
        {footer && <span style={{ fontSize: 24, color: "#6b655c" }}>{footer}</span>}
      </div>
    </div>
  );
}
