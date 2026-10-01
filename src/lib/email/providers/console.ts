import "server-only";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { EmailMessage, EmailProvider, EmailProviderResult } from "../types";

const PREVIEW_DIR = path.join(process.cwd(), ".email-previews");

function slugify(subject: string): string {
  return subject.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 60) || "email";
}

/**
 * The fallback provider used whenever no real provider is configured (or
 * one is picked via EMAIL_PROVIDER but its API key is missing) — never
 * fails and never sends anything over the network. It logs the message to
 * the server console AND writes the rendered HTML to a local
 * `.email-previews/` file (gitignored — see .gitignore), so a developer
 * can open the file directly in a browser to see exactly what a customer
 * would have received. This is also what src/app/dev/emails uses under
 * the hood when you click "send a test" in the local preview UI.
 */
export const consoleProvider: EmailProvider = {
  id: "console",
  async send(message: EmailMessage): Promise<EmailProviderResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${timestamp}--${slugify(message.subject)}.html`;

    console.log(
      `[email:console] "${message.subject}" → ${message.to.name} <${message.to.email}>` +
        (process.env.NODE_ENV !== "production" ? ` — preview: .email-previews/${filename}` : ""),
    );

    try {
      await mkdir(PREVIEW_DIR, { recursive: true });
      await writeFile(path.join(PREVIEW_DIR, filename), message.html, "utf8");
    } catch (error) {
      // Writing the preview file is a nice-to-have, not a delivery
      // guarantee — a read-only filesystem (some serverless platforms)
      // shouldn't make this provider report failure.
      console.warn("[email:console] Could not write preview file:", error);
    }

    return { ok: true, providerMessageId: `console-${timestamp}` };
  },
};
