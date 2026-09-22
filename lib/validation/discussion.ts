import { z } from "zod";
import { DISCUSSION_CATEGORIES } from "@/lib/constants";

const optionalCompetitionId = z.preprocess(
  (value) => (typeof value === "string" && value.trim() ? value.trim() : null),
  z.string().uuid().nullable(),
);

export const discussionPostSchema = z.object({
  title: z.string().trim().min(4, "Title must be at least 4 characters.").max(140, "Title must be 140 characters or fewer."),
  body: z.string().trim().min(1, "Post body is required.").max(12000, "Post body must be 12,000 characters or fewer."),
  category: z.enum(DISCUSSION_CATEGORIES, { error: "Choose a valid category." }),
  competitionId: optionalCompetitionId,
});

export const discussionReplySchema = z.object({
  body: z.string().trim().min(1, "Reply body is required.").max(6000, "Reply must be 6,000 characters or fewer."),
});

export const moderationSchema = z.object({
  reason: z.string().trim().max(300, "Reason must be 300 characters or fewer.").optional(),
});
