import { describe, it, expect } from "vitest";
import { safeJsonLdStringify, breadcrumbJsonLd } from "@/lib/seo/json-ld";

describe("safeJsonLdStringify (XSS protection for JSON-LD script tags)", () => {
  it("produces valid, parseable JSON for ordinary data", () => {
    const data = { "@type": "Product", name: "Solstice Coupe Glasses" };
    expect(JSON.parse(safeJsonLdStringify(data))).toEqual(data);
  });

  it("escapes a literal </script> sequence so it can't close the surrounding script tag", () => {
    const malicious = { reviewBody: "Great glasses!</script><script>alert(document.cookie)</script>" };
    const output = safeJsonLdStringify(malicious);
    expect(output).not.toContain("</script>");
    expect(output).toContain("\\u003c/script>");
  });

  it("round-trips the escaped value back to the original string when parsed", () => {
    const malicious = { text: "</script><img src=x onerror=alert(1)>" };
    const parsed = JSON.parse(safeJsonLdStringify(malicious));
    expect(parsed.text).toBe(malicious.text);
  });

  it("escapes every '<' character, not just the first occurrence", () => {
    const data = { text: "<a><b><c>" };
    const output = safeJsonLdStringify(data);
    expect(output).not.toContain("<");
  });
});

describe("breadcrumbJsonLd", () => {
  it("builds a BreadcrumbList with 1-indexed positions", () => {
    const result = breadcrumbJsonLd([{ label: "Home", href: "/" }, { label: "Shop" }]);
    expect(result["@type"]).toBe("BreadcrumbList");
    expect(result.itemListElement[0].position).toBe(1);
    expect(result.itemListElement[1].position).toBe(2);
  });

  it("omits the item URL for the current (no-href) page", () => {
    const result = breadcrumbJsonLd([{ label: "Shop" }]);
    expect(result.itemListElement[0]).not.toHaveProperty("item");
  });
});
