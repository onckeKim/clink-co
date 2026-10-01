import Link from "next/link";
import { notFound } from "next/navigation";
import { templateRegistry } from "@/lib/email/templates/registry";

export const metadata = { title: "Email Template Preview", robots: { index: false, follow: false } };

/**
 * Local development preview — lists every transactional/marketing email
 * template with rendered sample data (see registry.ts's sampleOrder(),
 * fictional data only). Blocked entirely outside development so this
 * never ships as a reachable route in production; there's no admin-auth
 * gate on it because it doesn't need one — it can't send anything, it only
 * renders sample HTML.
 */
export default function EmailPreviewIndexPage() {
  if (process.env.NODE_ENV === "production") notFound();

  const customer = templateRegistry.filter((t) => t.audience === "customer");
  const admin = templateRegistry.filter((t) => t.audience === "admin");

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: "48px 24px", fontFamily: "sans-serif" }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Email template preview</h1>
      <p style={{ color: "#746c62", marginBottom: 32 }}>
        Development only — renders each template with fictional sample data. No email is sent from this page.
      </p>

      <h2 style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 1, color: "#746c62", marginBottom: 12 }}>
        Customer ({customer.length})
      </h2>
      <TemplateList templates={customer} />

      <h2 style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: 1, color: "#746c62", margin: "32px 0 12px" }}>
        Administrator ({admin.length})
      </h2>
      <TemplateList templates={admin} />
    </div>
  );
}

function TemplateList({ templates }: { templates: typeof templateRegistry }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
      {templates.map((t) => (
        <li key={t.key}>
          <Link
            href={`/dev/emails/${t.key}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "12px 16px",
              border: "1px solid #e9e7e2",
              borderRadius: 10,
              textDecoration: "none",
              color: "#1c1c1a",
            }}
          >
            <span>{t.label}</span>
            <span style={{ color: t.emailCategory === "marketing" ? "#b69a68" : "#a99b8a", fontSize: 12 }}>
              {t.emailCategory}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
