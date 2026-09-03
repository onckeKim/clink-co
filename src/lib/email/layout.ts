import "server-only";
import { siteConfig } from "@/config/site";
import { getStoreSettings } from "@/lib/admin/settings-store";
import type { EmailCategory } from "./types";

/**
 * The branded shell every template renders its content into — a
 * table-based layout (not flexbox/grid, which many email clients still
 * don't support) with every style inlined, plus one <style> block for the
 * handful of things that can only be expressed that way (a mobile media
 * query, and link color/hover — see the comment on COLORS below for why
 * these are hex literals rather than the app's CSS custom properties).
 */

// Mirrors src/app/globals.css's :root tokens. Email HTML can't read CSS
// custom properties reliably across clients (Outlook's Word-based renderer
// in particular ignores var()), so the brand palette is duplicated here as
// literal hex values — keep the two in sync by hand if the palette changes.
export const COLORS = {
  porcelain: "#f7f5f0",
  warmWhite: "#fcfbf8",
  softGrey: "#e9e7e2",
  sand: "#d8cbbb",
  taupe: "#a99b8a",
  stone: "#746c62",
  charcoal: "#1c1c1a",
  champagne: "#b69a68",
  green: "#697262",
  success: "#287a4b",
  error: "#b42318",
} as const;

const FONT_STACK = "'Helvetica Neue', Helvetica, Arial, sans-serif";

export interface EmailLayoutInput {
  /** Shown by some inbox list views next to the subject — one sentence, no HTML. */
  previewText: string;
  bodyHtml: string;
  /** Marketing-classified emails (back-in-stock, wishlist reminder, abandoned cart) get an unsubscribe line in the footer; transactional ones don't need one (and, per CAN-SPAM/POPIA, aren't required to). */
  category: EmailCategory;
  /** Required when category is "marketing". */
  unsubscribeUrl?: string;
}

export function renderEmailHtml({ previewText, bodyHtml, category, unsubscribeUrl }: EmailLayoutInput): string {
  const settings = getStoreSettings();
  const year = new Date().getFullYear();

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="color-scheme" content="light" />
<meta name="supported-color-schemes" content="light" />
<title>${escapeHtml(settings.businessName)}</title>
<style>
  body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
  table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
  img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
  body { margin: 0; padding: 0; width: 100% !important; background: ${COLORS.porcelain}; }
  a { color: ${COLORS.charcoal}; }
  .cco-cta a { color: ${COLORS.warmWhite} !important; }
  @media only screen and (max-width: 600px) {
    .cco-container { width: 100% !important; }
    .cco-px { padding-left: 20px !important; padding-right: 20px !important; }
  }
</style>
</head>
<body style="margin:0; padding:0; background:${COLORS.porcelain};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0;">${escapeHtml(previewText)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.porcelain};">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" class="cco-container" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background:${COLORS.warmWhite}; border-radius:16px; overflow:hidden;">
          <tr>
            <td align="center" style="background:${COLORS.charcoal}; padding:28px 24px;">
              <span style="font-family:${FONT_STACK}; font-size:20px; letter-spacing:3px; color:${COLORS.warmWhite}; font-weight:600;">CLINK &amp; CO</span><br />
              <span style="font-family:${FONT_STACK}; font-size:10px; letter-spacing:2px; color:${COLORS.champagne};">BY HEIMSIGHT</span>
            </td>
          </tr>
          <tr>
            <td class="cco-px" style="padding:36px 40px; font-family:${FONT_STACK}; color:${COLORS.charcoal};">
              ${bodyHtml}
            </td>
          </tr>
          <tr>
            <td class="cco-px" style="padding:28px 40px 36px; border-top:1px solid ${COLORS.softGrey}; font-family:${FONT_STACK};">
              ${footerHtml(category, unsubscribeUrl)}
            </td>
          </tr>
        </table>
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px;">
          <tr>
            <td align="center" style="padding:20px 24px; font-family:${FONT_STACK}; font-size:11px; line-height:18px; color:${COLORS.taupe};">
              &copy; ${year} ${escapeHtml(settings.businessName)}. All rights reserved.<br />
              Cape Town, South Africa
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function footerHtml(category: EmailCategory, unsubscribeUrl?: string): string {
  const settings = getStoreSettings();
  const supportLines = [
    `<a href="mailto:${settings.contactEmail}" style="color:${COLORS.stone}; text-decoration:underline;">${escapeHtml(settings.contactEmail)}</a>`,
    settings.contactPhone ? escapeHtml(settings.contactPhone) : null,
    settings.social.whatsapp
      ? `<a href="${escapeAttr(settings.social.whatsapp)}" style="color:${COLORS.stone}; text-decoration:underline;">Chat on WhatsApp</a>`
      : null,
  ].filter(Boolean);

  const socialLinks = [
    ["Instagram", settings.social.instagram],
    ["Facebook", settings.social.facebook],
    ["TikTok", settings.social.tiktok],
    ["Pinterest", settings.social.pinterest],
  ]
    .filter(([, href]) => href)
    .map(([label, href]) => `<a href="${escapeAttr(href)}" style="color:${COLORS.stone}; text-decoration:underline;">${label}</a>`)
    .join(`<span style="color:${COLORS.taupe};"> &middot; </span>`);

  return `
    <p style="margin:0 0 10px; font-size:13px; line-height:20px; color:${COLORS.stone};">
      Need help? We're here for you.<br />
      ${supportLines.join(`<span style="color:${COLORS.taupe};"> &middot; </span>`)}
    </p>
    ${socialLinks ? `<p style="margin:0 0 10px; font-size:12px; color:${COLORS.stone};">${socialLinks}</p>` : ""}
    <p style="margin:0; font-size:12px; color:${COLORS.taupe};">
      <a href="${siteConfig.url}/privacy" style="color:${COLORS.taupe}; text-decoration:underline;">Privacy</a>
      <span> &middot; </span>
      <a href="${siteConfig.url}/terms" style="color:${COLORS.taupe}; text-decoration:underline;">Terms</a>
      ${
        category === "marketing" && unsubscribeUrl
          ? `<span> &middot; </span><a href="${escapeAttr(unsubscribeUrl)}" style="color:${COLORS.taupe}; text-decoration:underline;">Unsubscribe</a>`
          : ""
      }
    </p>`;
}

export interface EmailTextLayoutInput {
  bodyText: string;
  category: EmailCategory;
  unsubscribeUrl?: string;
}

export function renderEmailText({ bodyText, category, unsubscribeUrl }: EmailTextLayoutInput): string {
  const settings = getStoreSettings();
  const year = new Date().getFullYear();
  const support = [
    settings.contactEmail,
    settings.contactPhone || null,
    settings.social.whatsapp ? `WhatsApp: ${settings.social.whatsapp}` : null,
  ]
    .filter(Boolean)
    .join(" | ");

  return [
    "CLINK & CO — by HEIMSIGHT",
    "",
    bodyText.trim(),
    "",
    "----------------------------------------",
    "Need help? We're here for you.",
    support,
    "",
    `Privacy: ${siteConfig.url}/privacy   Terms: ${siteConfig.url}/terms`,
    category === "marketing" && unsubscribeUrl ? `Unsubscribe: ${unsubscribeUrl}` : null,
    "",
    `© ${year} ${settings.businessName}. All rights reserved.`,
    "Cape Town, South Africa",
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Same escaping as escapeHtml, split out for attribute contexts (href/src) so a reader isn't left wondering whether they're actually different — they aren't, but callers should reach for the name that matches what they're building. */
export const escapeAttr = escapeHtml;
