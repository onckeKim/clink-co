import "server-only";
import { siteConfig } from "@/config/site";
import type { Order } from "@/lib/orders/types";
import type { ReturnReason } from "@/lib/account/returns-store";
import { renderEmailHtml, renderEmailText } from "../layout";
import { heading, paragraph, paragraphText, ctaButton, ctaButtonText, calloutBox, calloutBoxText } from "../components";
import type { EmailContent } from "../types";

const REASON_LABELS: Record<ReturnReason, string> = {
  "changed-mind": "Changed my mind",
  damaged: "Item arrived damaged",
  "wrong-item": "Received the wrong item",
  "not-as-described": "Not as described",
  other: "Other",
};

function firstName(order: Pick<Order, "customerName">): string {
  return order.customerName.split(" ")[0] || order.customerName;
}

function orderUrl(order: Pick<Order, "orderNumber">): string {
  return `${siteConfig.url}/account/orders/${order.orderNumber}`;
}

export function returnRequestReceivedTemplate(order: Order, reason: ReturnReason, notes?: string): EmailContent {
  const subject = `We've received your return request — ${order.orderNumber}`;
  const previewText = "Your return request is with our team.";
  const bodyHtml = [
    heading(`Return request received, ${firstName(order)}`),
    paragraph(`We've received your return request for order ${order.orderNumber}.`),
    calloutBox(`<strong>Reason:</strong> ${REASON_LABELS[reason]}${notes ? `<br /><strong>Notes:</strong> ${notes}` : ""}`),
    paragraph("Our team will review this within 1–2 business days and follow up with next steps by email."),
    ctaButton("View Order", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Return request received, ${firstName(order)}`,
    paragraphText(`We've received your return request for order ${order.orderNumber}.`),
    calloutBoxText(`Reason: ${REASON_LABELS[reason]}${notes ? ` | Notes: ${notes}` : ""}`),
    paragraphText("Our team will review this within 1–2 business days and follow up with next steps by email."),
    ctaButtonText("View Order", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function returnApprovedTemplate(order: Order, instructions?: string): EmailContent {
  const subject = `Your return has been approved — ${order.orderNumber}`;
  const previewText = "Your return is approved — here's how to send it back.";
  const bodyHtml = [
    heading(`Return approved, ${firstName(order)}`),
    paragraph(`Good news — your return request for order ${order.orderNumber} has been approved.`),
    calloutBox(
      instructions ||
        "Please repack the item(s) securely in their original packaging where possible. Our courier will collect from your delivery address, or you can drop off at your convenience — we'll be in touch to arrange this.",
      "success",
    ),
    ctaButton("View Order", orderUrl(order)),
  ].join("");
  const bodyText = [
    `Return approved, ${firstName(order)}`,
    paragraphText(`Good news — your return request for order ${order.orderNumber} has been approved.`),
    calloutBoxText(instructions || "Please repack the item(s) securely. Our courier will collect from your delivery address, or you can drop off — we'll be in touch to arrange this."),
    ctaButtonText("View Order", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}

export function returnRejectedTemplate(order: Order, reason: string): EmailContent {
  const subject = `An update on your return request — ${order.orderNumber}`;
  const previewText = "An update on your return request.";
  const bodyHtml = [
    heading(`An update on your return, ${firstName(order)}`),
    paragraph(`After review, we're unable to approve the return request for order ${order.orderNumber}.`),
    calloutBox(`<strong>Reason:</strong> ${reason}`, "error"),
    paragraph("If you have any questions about this decision, please reach out — we're happy to talk it through."),
    ctaButton("View Order", orderUrl(order)),
  ].join("");
  const bodyText = [
    `An update on your return, ${firstName(order)}`,
    paragraphText(`After review, we're unable to approve the return request for order ${order.orderNumber}.`),
    calloutBoxText(`Reason: ${reason}`),
    paragraphText("If you have any questions about this decision, please reach out — we're happy to talk it through."),
    ctaButtonText("View Order", orderUrl(order)),
  ].join("\n\n");

  return {
    subject,
    previewText,
    html: renderEmailHtml({ previewText, bodyHtml, category: "transactional" }),
    text: renderEmailText({ bodyText, category: "transactional" }),
  };
}
