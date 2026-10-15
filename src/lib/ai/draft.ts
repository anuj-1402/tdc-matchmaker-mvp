/**
 * AI Adapter — Introduction Email Drafting
 *
 * Server-side only. Uses OpenAI to generate personalized intro drafts.
 * Falls back to deterministic templates when API is unavailable.
 *
 * Reference: plan.md §8
 */

import OpenAI from "openai";
import { aiDraftSchema, type AIDraftOutput } from "@/lib/validation/schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DraftInput {
  customerFirstName: string;
  candidateFirstName: string;
  candidateCity: string;
  candidateProfession: string | null;
  verifiedReasons: string[];
  approvedForSharing: string[];
}

export interface DraftResult {
  subject: string;
  body: string;
  source: "ai" | "template";
}

// ─── OpenAI Client ───────────────────────────────────────────────────────────

function getOpenAIClient(): OpenAI | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-..." || apiKey.length < 20) {
    return null;
  }
  return new OpenAI({ apiKey });
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You draft respectful, concise matchmaking introduction emails for an internal matchmaker. Use ONLY supplied facts. Never invent achievements, personality traits, compatibility guarantees, or consent. Avoid caste/religion, salary, personal contact, internal notes, and exact birth dates. Keep it warm and neutral. Return JSON: {"subject": string, "body": string}. Maximum 120 words in body.`;

// ─── AI Draft ────────────────────────────────────────────────────────────────

export async function generateIntroDraft(
  input: DraftInput
): Promise<DraftResult> {
  const client = getOpenAIClient();

  if (!client) {
    console.log("[AI] No API key configured — using template fallback");
    return generateFallbackDraft(input);
  }

  try {
    const userMessage = JSON.stringify({
      customerFirstName: input.customerFirstName,
      candidateFirstName: input.candidateFirstName,
      candidateCity: input.candidateCity,
      candidateProfession: input.candidateProfession ?? "not specified",
      verifiedReasons: input.verifiedReasons,
      approvedForSharing: input.approvedForSharing,
    });

    const response = await Promise.race([
      client.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 300,
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
      // 10-second timeout
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("AI request timeout")), 10000)
      ),
    ]);

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.warn("[AI] Empty response — using fallback");
      return generateFallbackDraft(input);
    }

    // Parse and validate
    const parsed = JSON.parse(content);
    const validated = aiDraftSchema.safeParse(parsed);

    if (!validated.success) {
      console.warn("[AI] Invalid response format — using fallback");
      return generateFallbackDraft(input);
    }

    // Cap body at 120 words
    const words = validated.data.body.split(/\s+/);
    const cappedBody =
      words.length > 120 ? words.slice(0, 120).join(" ") + "..." : validated.data.body;

    return {
      subject: validated.data.subject,
      body: cappedBody,
      source: "ai",
    };
  } catch (error) {
    console.warn("[AI] Error generating draft:", (error as Error).message);
    return generateFallbackDraft(input);
  }
}

// ─── Fallback Template ───────────────────────────────────────────────────────

export function generateFallbackDraft(input: DraftInput): DraftResult {
  const reasons =
    input.verifiedReasons.length > 0
      ? input.verifiedReasons.slice(0, 3).join(", ")
      : "shared interests and compatible preferences";

  const professionLine = input.candidateProfession
    ? ` ${input.candidateFirstName} works in ${input.candidateProfession} and is`
    : ` ${input.candidateFirstName} is`;

  return {
    subject: `Potential introduction — ${input.customerFirstName} and ${input.candidateFirstName}`,
    body: `Hi ${input.customerFirstName},

I wanted to share ${input.candidateFirstName}'s profile for your consideration. Based on your preferences, you both show compatibility in: ${reasons}.${professionLine} based in ${input.candidateCity}.

Please review the profile and let us know whether you'd like to explore an introduction.

Warm regards,
Your TDC Matchmaker`,
    source: "template",
  };
}
