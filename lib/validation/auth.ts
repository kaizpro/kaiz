import { z } from "zod";
export const emailSchema = z.string().trim().email().max(254);
export const passwordSchema = z.string().min(8).max(72);
export const registerSchema = z.object({ email: emailSchema, password: passwordSchema, displayName: z.string().trim().min(2).max(60) });
export const loginSchema = z.object({ email: emailSchema, password: z.string().min(1) });
