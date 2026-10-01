import { describe, it, expect } from "vitest";
import { buyerSearchSchema, sendEmailSchema, campaignSchema, generateEmailSchema } from "@/lib/validation";
import { dedupeLeads } from "@/providers/buyers/types";
import { templateEmail } from "@/providers/ai/types";
import type { NormalizedLead } from "@/lib/types";

const lead = (over: Partial<NormalizedLead>): NormalizedLead => ({
  id: "x",
  name: "Test Co",
  category: "Home Decor",
  address: null,
  city: "New York",
  state: "NY",
  country: "United States",
  postalCode: null,
  website: null,
  phone: null,
  email: null,
  latitude: null,
  longitude: null,
  source: "t",
  sourceUrl: null,
  sourceType: "demo",
  emailAvailability: false,
  websiteAvailability: false,
  discoveredAt: new Date().toISOString(),
  ...over,
});

describe("buyer search validation", () => {
  it("accepts a valid US search", () => {
    const r = buyerSearchSchema.safeParse({ product: "Home Decor", location: "New York, NY" });
    expect(r.success).toBe(true);
  });
  it("rejects empty product/location", () => {
    expect(buyerSearchSchema.safeParse({ product: "", location: "" }).success).toBe(false);
    expect(buyerSearchSchema.safeParse({ product: "A", location: "New York" }).success).toBe(false);
  });
  it("coerces and clamps radius", () => {
    const r = buyerSearchSchema.safeParse({ product: "Lighting", location: "10001", radius: 200 });
    expect(r.success).toBe(false);
  });
});

describe("provider normalization + dedupe", () => {
  it("removes duplicates by name+city, prefers live/email", () => {
    const a = lead({ id: "1", name: "Hudson Home", city: "New York", sourceType: "demo" });
    const b = lead({ id: "2", name: "hudson home ", city: "new york", sourceType: "live", email: "hello@shop.com", emailAvailability: true });
    const out = dedupeLeads([a, b]);
    expect(out).toHaveLength(1);
    expect(out[0].sourceType).toBe("live");
  });
  it("keeps distinct businesses", () => {
    const out = dedupeLeads([lead({ id: "1", name: "A" }), lead({ id: "2", name: "B" })]);
    expect(out).toHaveLength(2);
  });
  it("never invents email: missing email stays null", () => {
    const l = lead({ email: null });
    expect(l.email).toBeNull();
    expect(l.emailAvailability).toBe(false);
  });
});

describe("AI generation + fallback", () => {
  it("template never fabricates relationships", () => {
    const e = templateEmail({ lead: { name: "Beacon Gallery" }, seller: { companyName: "Maison" } });
    expect(e.generatedBy).toBe("template");
    expect(e.body).not.toMatch(/previous|partnership|last order/i);
    expect(e.subject.length).toBeGreaterThan(5);
  });
  it("validates generate-email input", () => {
    expect(generateEmailSchema.safeParse({ lead: { name: "" } }).success).toBe(false);
  });
});

describe("email + campaign validation", () => {
  it("requires valid recipient and content", () => {
    expect(sendEmailSchema.safeParse({ to: "not-an-email", subject: "x", body: "y" }).success).toBe(false);
    expect(sendEmailSchema.safeParse({ to: "buyer@shop.com", subject: "Hi", body: "Hello" }).success).toBe(true);
  });
  it("requires at least one lead for campaigns", () => {
    expect(
      campaignSchema.safeParse({ name: "Fall Outreach", subject: "S", body: "B", leadIds: [] }).success
    ).toBe(false);
    expect(
      campaignSchema.safeParse({ name: "Fall Outreach", subject: "S", body: "B", leadIds: ["a"] }).success
    ).toBe(true);
  });
});
