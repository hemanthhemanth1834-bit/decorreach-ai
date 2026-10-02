import { z } from "zod";

export const buyerSearchSchema = z.object({
  product: z.string().trim().min(2, "Product/category is required").max(120),
  location: z.string().trim().min(2, "U.S. location is required").max(200),
  keyword: z.string().trim().max(120).optional().default(""),
  buyerType: z.string().trim().max(40).optional().default("Business"),
  radius: z.coerce.number().int().min(1).max(100).optional().default(25),
});

export const leadSchema = z.object({
  id: z.string().min(1).optional(),
  name: z.string().min(1).max(300),
  category: z.string().min(1).max(120),
  address: z.string().max(500).nullable().optional(),
  city: z.string().max(120).nullable().optional(),
  state: z.string().max(60).nullable().optional(),
  country: z.string().max(80).nullable().optional(),
  postalCode: z.string().max(20).nullable().optional(),
  website: z.string().max(500).nullable().optional(),
  phone: z.string().max(60).nullable().optional(),
  email: z.string().max(320).nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
  source: z.string().max(120).optional().default("DecorReach"),
  sourceUrl: z.string().max(1000).nullable().optional(),
  sourceType: z.enum(["live", "demo"]).optional().default("live"),
});

export const generateEmailSchema = z.object({
  lead: z.object({
    name: z.string().min(1),
    category: z.string().optional().default(""),
    city: z.string().nullable().optional(),
    state: z.string().nullable().optional(),
    website: z.string().nullable().optional(),
  }),
  seller: z
    .object({
      companyName: z.string().max(200).optional(),
      productDescription: z.string().max(2000).optional(),
      website: z.string().max(500).optional(),
      contactName: z.string().max(200).optional(),
      contactEmail: z.string().max(320).optional(),
      phone: z.string().max(60).optional(),
      companyDescription: z.string().max(2000).optional(),
    })
    .optional()
    .default({}),
});

export const sendEmailSchema = z.object({
  to: z.string().email("Valid recipient email is required"),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().trim().min(1, "Body is required").max(20000),
  leadId: z.string().max(200).optional(),
  campaignId: z.string().max(200).optional(),
});

export const campaignSchema = z.object({
  name: z.string().trim().min(2, "Campaign name is required").max(200),
  product: z.string().trim().min(1).max(200).optional().default(""),
  location: z.string().trim().min(1).max(200).optional().default(""),
  subject: z.string().trim().min(1, "Subject is required").max(300),
  body: z.string().trim().min(1, "Body is required").max(20000),
  leadIds: z.array(z.string().min(1)).min(1, "Select at least one lead").max(200),
});

export const sellerProfileSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  productDescription: z.string().trim().min(1).max(2000),
  website: z.string().trim().max(500).optional().default(""),
  contactName: z.string().trim().min(1).max(200),
  contactEmail: z.string().email().max(320),
  phone: z.string().trim().max(60).optional().default(""),
  companyDescription: z.string().trim().max(2000).optional().default(""),
});

export type BuyerSearchInput = z.infer<typeof buyerSearchSchema>;
