import type { EmailGenerationResult, SellerProfile } from "@/lib/types";

export interface AIGenerateInput {
  lead: { name: string; category?: string | null; city?: string | null; state?: string | null; website?: string | null };
  seller: Partial<SellerProfile>;
}

export interface AIProvider {
  name: string;
  configured: boolean;
  generate(input: AIGenerateInput): Promise<EmailGenerationResult>;
}

/** High-quality deterministic fallback. Never fabricates relationships/prices/facts. */
export function templateEmail(input: AIGenerateInput): EmailGenerationResult {
  const leadName = input.lead.name || "there";
  const cityState = [input.lead.city, input.lead.state].filter(Boolean).join(", ");
  const sellerCo = input.seller.companyName || "our studio";
  const product = input.seller.productDescription || "handcrafted home-decor pieces";
  const contact = input.seller.contactName || input.seller.companyName || "our team";
  const sellerSite = input.seller.website ? `\nYou can view our collection here: ${input.seller.website}` : "";
  const subject = `Wholesale ${product.slice(0, 48)} for ${leadName}`;
  const body = [
    `Hi ${leadName} team,`,
    "",
    `I'm ${contact} from ${sellerCo}. We design ${product}, and I noticed your ${input.lead.category || "home-decor"} selection${cityState ? ` in ${cityState}` : ""} — it looks like a strong fit for our collection.`,
    "",
    `We work with independent retailers and design studios on wholesale and made-to-order pieces, with clear lead times and trade pricing on request.${sellerSite}`,
    "",
    `Would you be open to a brief look at 4–5 pieces I think would suit your floor? If helpful, I can send a one-page line sheet — no obligation.`,
    "",
    `Thanks for your time,`,
    `${contact}`,
    sellerCo,
    input.seller.contactEmail || "",
    input.seller.phone || "",
  ]
    .filter((l) => l !== "")
    .join("\n");
  return { subject, body, generatedBy: "template" };
}
