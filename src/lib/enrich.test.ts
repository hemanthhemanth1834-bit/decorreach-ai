import { describe, it, expect } from "vitest";
import { extractPublicEmails } from "@/providers/enrich/website-email";

describe("public website email extraction", () => {
  it("prefers mailto: contact addresses", () => {
    const html = `<a href="mailto:hello@shop.com">Email us</a> footer@noreply.shop.com`;
    const out = extractPublicEmails(html);
    expect(out[0]).toBe("hello@shop.com");
  });

  it("finds bare addresses in text", () => {
    const out = extractPublicEmails(`<p>Write to sales@example-store.com for trade.</p>`);
    expect(out).toContain("sales@example-store.com");
  });

  it("never returns example.* or asset-like addresses", () => {
    const out = extractPublicEmails(`contact@example.com logo.png@2x test@logo.png`);
    expect(out).toHaveLength(0);
  });

  it("returns [] when nothing is listed (never invents)", () => {
    expect(extractPublicEmails(`<html><body><h1>Fine Furniture</h1></body></html>`)).toEqual([]);
  });

  it("ranks noreply below real contacts", () => {
    const out = extractPublicEmails(`noreply@shop.com info@shop.com`);
    expect(out[0]).toBe("info@shop.com");
  });

  it("ignores invalid shapes", () => {
    expect(extractPublicEmails(`@@ bad@ @x @y.z a@b`)).toEqual([]);
  });
});
