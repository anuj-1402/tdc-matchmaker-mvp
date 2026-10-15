import { z } from "zod";

// ─── Auth Schemas ────────────────────────────────────────────────────────────

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, "Username is required")
    .max(50, "Username too long")
    .trim(),
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password too long"),
});

export type LoginInput = z.infer<typeof loginSchema>;

// ─── Journey Stage ───────────────────────────────────────────────────────────

export const journeyStages = [
  "NEW",
  "PROFILE_REVIEW",
  "VERIFIED",
  "IN_MATCHING",
  "MATCH_SENT",
  "AWAITING_FEEDBACK",
  "MATCHED",
  "ON_HOLD",
  "CLOSED",
] as const;

export const stageUpdateSchema = z.object({
  stage: z.enum(journeyStages),
});

export type StageUpdateInput = z.infer<typeof stageUpdateSchema>;

// ─── Customer Notes ──────────────────────────────────────────────────────────

export const interactionTypes = ["CALL", "MEETING", "OTHER"] as const;

export const noteSchema = z.object({
  body: z
    .string()
    .min(1, "Note cannot be empty")
    .max(2000, "Note must be under 2000 characters")
    .trim(),
  interactionType: z.enum(interactionTypes).default("OTHER"),
});

export type NoteInput = z.infer<typeof noteSchema>;

// ─── Match Send ──────────────────────────────────────────────────────────────

export const matchSendSchema = z.object({
  subject: z.string().min(1, "Subject is required").max(200).trim(),
  body: z.string().min(1, "Body is required").max(5000).trim(),
});

export type MatchSendInput = z.infer<typeof matchSendSchema>;

// ─── AI Draft Response ───────────────────────────────────────────────────────

export const aiDraftSchema = z.object({
  subject: z.string().max(200),
  body: z.string().max(1000),
});

export type AIDraftOutput = z.infer<typeof aiDraftSchema>;

// ─── Query Params ────────────────────────────────────────────────────────────

export const customerListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  query: z.string().optional(),
  stage: z.enum(journeyStages).optional(),
  city: z.string().optional(),
  verified: z.enum(["true", "false"]).optional(),
  sort: z.enum(["name", "updated", "age"]).default("updated"),
});

export type CustomerListQuery = z.infer<typeof customerListQuerySchema>;
