import { z } from "zod";

export const ENQUIRY_TYPES = [
  "general",
  "vehicle",
  "test-drive",
  "finance",
  "trade-in",
  "contact",
] as const;
export type EnquiryType = (typeof ENQUIRY_TYPES)[number];

/** Honeypot field name — bots fill it, humans never see it. Must stay empty. */
export const HONEYPOT = "company";

/** Canonical server-side schema for any lead submission. */
export const submissionSchema = z
  .object({
    type: z.enum(ENQUIRY_TYPES),
    name: z.string().trim().min(2, "Please enter your name").max(120),
    email: z.union([z.string().trim().email("Enter a valid email address").max(160), z.literal("")]).optional(),
    phone: z.string().trim().max(40).optional(),
    message: z.string().trim().max(4000).optional(),
    vehicleId: z.number().int().positive().optional(),
    vehicleTitle: z.string().max(200).optional(),
    preferredDate: z.string().max(120).optional(),
    consent: z.boolean().optional().default(false),
    details: z.record(z.string(), z.unknown()).optional(),
    source: z.string().max(300).optional(),
    [HONEYPOT]: z.string().max(0).optional(),
  })
  .refine((d) => Boolean(d.email && d.email.length) || Boolean(d.phone && d.phone.length), {
    message: "Please provide an email address or phone number",
    path: ["email"],
  });

export type SubmissionInput = z.infer<typeof submissionSchema>;
