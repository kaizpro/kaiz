import { z } from "zod";

const optionalInteger = (minimum: number, maximum: number) =>
  z.preprocess(
    (value) => value === "" || value == null ? undefined : value,
    z.coerce.number().int().min(minimum).max(maximum).optional(),
  );

const optionalHttpUrl = z.string().trim().url().max(200).refine(
  (value) => /^https?:\/\//i.test(value),
  "Enter an HTTP or HTTPS URL",
).or(z.literal("")).optional();

export const profileSchema = z.object({
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_]{3,24}$/),
  displayName: z.string().trim().min(2).max(60),
  bio: z.string().trim().max(300).optional(),
  city: z.string().trim().max(80).optional(),
  school: z.string().trim().max(140).optional(),
  grade: optionalInteger(5, 13),
  graduationYear: optionalInteger(2020, 2040),
  kaggleUsername: z.string().trim().max(60).optional(),
  githubUsername: z.string().trim().max(60).optional(),
  website: optionalHttpUrl,
});
