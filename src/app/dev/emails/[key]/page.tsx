import Link from "next/link";
import { notFound } from "next/navigation";
import { getTemplate } from "@/lib/email/templates/registry";
import { getStoreSettings } from "@/lib/admin/settings-store";

export const metadata = { title: "Email Template Preview", robots: { index: false, follow: false } };

export default async function EmailPreviewPage({ params }: PageProps<"/dev/emails/[key]">) {
  if (process.env.NODE_ENV === "production") notFound();

  const { key } = await params;
  const template = getTemplate(key);
  if (!template) notFound();

  const settings = await getStoreSettings();
  const content = template.render(settings);

  return (
    <div style={{ fontFamily: "sans-serif" }}>
      <div style={{ padding: "16px 24px", borderBottom: "1px solid #e9e7e2", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
        <Link href="/dev/emails" style={{ color: "#746c62", fontSize: 13, textDecoration: "none" }}>
          &larr; All templates
        </Link>
        <strong>{template.label}</strong>
        <span style={{ fontSize: 12, color: "#a99b8a" }}>{template.emailCategory}</span>
        <span style={{ fontSize: 13, color: "#746c62" }}>
          Subject: <strong style={{ color: "#1c1c1a" }}>{content.subject}</strong>
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: "80vh" }}>
        <div>
          <div style={{ padding: "8px 24px", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#a99b8a" }}>HTML</div>
          <iframe title="HTML preview" srcDoc={content.html} style={{ width: "100%", height: "80vh", border: "none" }} />
        </div>
        <div style={{ borderLeft: "1px solid #e9e7e2" }}>
          <div style={{ padding: "8px 24px", fontSize: 11, textTransform: "uppercase", letterSpacing: 1, color: "#a99b8a" }}>
            Plain-text fallback
          </div>
          <pre style={{ padding: "0 24px 24px", fontSize: 13, lineHeight: 1.6, whiteSpace: "pre-wrap", color: "#1c1c1a" }}>{content.text}</pre>
        </div>
      </div>
    </div>
  );
}
