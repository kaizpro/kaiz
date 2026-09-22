import { z } from "zod";
import { COMPETITION_CATEGORIES, COMPETITION_FORMATS, COMPETITION_STATUSES } from "@/lib/constants";

const optionalDate = z.preprocess(
  (value) => value === "" || value == null ? undefined : value,
  z.coerce.date().optional(),
);

const optionalHttpUrl = z.string().trim().url().refine(
  (value) => /^https?:\/\//i.test(value),
  "Enter an HTTP or HTTPS URL",
).optional().or(z.literal(""));

export const competitionSchema = z.object({
  title: z.string().trim().min(3).max(140),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().min(20).max(5000),
  organizer: z.string().trim().min(2).max(140),
  officialWebsite: optionalHttpUrl,
  registrationUrl: optionalHttpUrl,
  startDate: z.coerce.date(), endDate: z.coerce.date(), registrationDeadline: optionalDate,
  city: z.string().trim().max(80).optional(), country: z.string().trim().min(2).max(80).default("Kazakhstan"),
  format: z.enum(COMPETITION_FORMATS), status: z.enum(COMPETITION_STATUSES),
  category: z.enum(COMPETITION_CATEGORIES), eligibility: z.string().trim().max(500).optional(),
  tags: z.string().transform((value) => value.split(",").map((tag) => tag.trim()).filter(Boolean).slice(0, 12)),
  verified: z.coerce.boolean().default(false),
}).refine((data) => data.endDate >= data.startDate, { message: "End date must be after the start date", path: ["endDate"] });
