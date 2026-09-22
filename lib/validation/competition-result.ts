import { z } from "zod";
import { RESULT_ENTRY_STATUSES, RESULT_PARTICIPANT_TYPES, RESULT_SET_STATUSES } from "@/lib/constants";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
const optionalHttpUrl = z.string().trim().url().refine(
  (value) => /^https?:\/\//i.test(value),
  "Enter an HTTP or HTTPS URL",
).optional().or(z.literal(""));
const optionalInteger = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().int().positive().optional());
const optionalNumber = z.preprocess((value) => value === "" || value == null ? undefined : value, z.coerce.number().finite().optional());

export const resultSetSchema = z.object({
  name: z.string().trim().min(2).max(120),
  status: z.enum(RESULT_SET_STATUSES),
  source: z.string().trim().toLowerCase().regex(/^[a-z][a-z0-9_]{1,39}$/),
  sourceLabel: optionalText(120),
  sourceUrl: optionalHttpUrl,
  published: z.coerce.boolean().default(false),
});

export const competitionResultSchema = z.object({
  resultSetId: z.string().uuid(),
  participantType: z.enum(RESULT_PARTICIPANT_TYPES),
  participantName: z.string().trim().min(1).max(160),
  linkedUsername: optionalText(40),
  rank: optionalInteger,
  score: optionalNumber,
  scoreDisplay: optionalText(80),
  countryCode: z.string().trim().toUpperCase().regex(/^[A-Z]{2,3}$/, "Use a 2- or 3-letter country code").optional().or(z.literal("")),
  award: optionalText(80),
  resultStatus: z.enum(RESULT_ENTRY_STATUSES),
  externalParticipantId: optionalText(200),
}).superRefine((data, context) => {
  if (data.resultStatus === "ranked" && data.rank == null) {
    context.addIssue({ code: "custom", path: ["rank"], message: "Rank is required for ranked results" });
  }
  if (data.resultStatus !== "ranked" && data.rank != null) {
    context.addIssue({ code: "custom", path: ["rank"], message: "Unranked and disqualified results cannot have a rank" });
  }
});

