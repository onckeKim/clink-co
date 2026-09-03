/**
 * Shared monogram mark for generated icons/OG images (favicon, apple-icon,
 * manifest icons, opengraph-image routes). Rendered through `next/og`'s
 * ImageResponse (Satori), which only supports a flexbox subset of CSS and
 * inline styles — no Tailwind classes, no next/font — hence plain JSX with
 * style objects here rather than reusing any app component.
 */
export function BrandMark({ size, radius }: { size: number; radius?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#1c1c1a",
        borderRadius: radius ?? Math.round(size * 0.22),
      }}
    >
      <span
        style={{
          fontFamily: "serif",
          fontSize: Math.round(size * 0.52),
          color: "#fcfbf8",
          lineHeight: 1,
        }}
      >
        C
      </span>
    </div>
  );
}
