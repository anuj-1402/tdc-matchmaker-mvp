/**
 * AI Adapter — Introduction Email & Executive Match Summary Drafting
 *
 * Server-side only. Uses OpenAI GPT-4o-mini to generate personalized intro drafts.
 * Falls back to intelligent deterministic synthesis when API is unavailable or rate-limited.
 *
 * Reference: plan.md §8
 */

import OpenAI from "openai";
import { aiDraftSchema } from "@/lib/validation/schemas";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface DraftInput {
  customerFirstName: string;
  customerLastName?: string;
  customerCity?: string;
  customerProfession?: string | null;
  customerCompany?: string | null;
  customerValues?: string[];
  customerWantKids?: string | null;
  customerRelocation?: string | null;

  candidateFirstName: string;
  candidateLastName?: string;
  candidateAge?: number;
  candidateCity: string;
  candidateProfession: string | null;
  candidateCompany?: string | null;
  candidateCollege?: string | null;
  candidateDegree?: string | null;
  candidateValues?: string[];
  candidateWantKids?: string | null;
  candidateRelocation?: string | null;

  verifiedReasons: string[];
  tradeoffs?: string[];
  score?: number;
}

export interface DraftResult {
  subject: string;
  body: string;
  source: "ai" | "template";
  modelUsed?: string;
  summary?: string;
}

// ─── OpenAI Client ───────────────────────────────────────────────────────────

function getOpenAIClient(): { client: OpenAI; model: string } | null {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey || apiKey === "sk-..." || apiKey.length < 20) {
    return null;
  }
  const baseURL = process.env.OPENAI_BASE_URL || undefined;
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const client = new OpenAI({ apiKey, baseURL });
  return { client, model };
}

// ─── System Prompt ───────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an elite executive matchmaker at TDC. You draft elegant, warm, highly personalized introduction emails for your private clients.
You must return only a valid JSON object with exactly two keys: "subject" (a string for the email subject line) and "body" (a string containing the warm intro email, maximum 120 words).
Never mention caste, religion, salary figures, or contact info. Keep it warm, curated, and respectful.`;

// ─── AI Draft Generator ──────────────────────────────────────────────────────

export async function generateIntroDraft(
  input: DraftInput
): Promise<DraftResult> {
  const aiConfig = getOpenAIClient();

  if (!aiConfig) {
    console.log("[AI] No API key configured — using dynamic synthesis fallback");
    return generateFallbackDraft(input);
  }

  const { client, model } = aiConfig;

  try {
    const userPrompt = `Draft an introduction email in JSON format: {"subject": string, "body": string}.
Client: ${input.customerFirstName} based in ${input.customerCity || "city"}
Candidate: ${input.candidateFirstName}, ${input.candidateAge || 28} years old, based in ${input.candidateCity}, working as ${input.candidateProfession || "Professional"}${input.candidateCompany ? ` at ${input.candidateCompany}` : ""}
Shared alignment strengths: ${input.verifiedReasons.join(", ") || "compatible values and life goals"}
Values: ${(input.candidateValues || []).join(", ") || "personal growth and family"}
Ensure the response is strictly a valid JSON object with keys "subject" and "body". Body must be under 120 words.`;

    const response = await Promise.race([
      client.chat.completions.create({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        max_tokens: 350,
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
      summary: parsed.summary || generateMatchSummary(input),
      source: "ai",
      modelUsed: model,
    };
  } catch (error: any) {
    console.warn("[AI] Notice: OpenAI request did not complete (e.g. quota or timeout):", error.message);
    return generateFallbackDraft(input);
  }
}

// ─── Dynamic Matchmaker Executive Summary ────────────────────────────────────

export function generateMatchSummary(input: DraftInput): string {
  const role = input.candidateProfession || "Established professional";
  const city = input.candidateCity;
  const sharedVal = input.candidateValues?.slice(0, 2).join(" & ");
  const kidStatus =
    input.candidateWantKids === "YES" ? "aligned on wanting children" : "flexible on life timing";

  return `High-compatibility match based in ${city} working in ${role}. Strongly ${kidStatus}${
    sharedVal ? ` with core resonance in ${sharedVal}` : ""
  }.`;
}

// ─── Enhanced Dynamic Fallback ───────────────────────────────────────────────

export function generateFallbackDraft(input: DraftInput): DraftResult {
  const candidateName = input.candidateFirstName;
  const clientName = input.customerFirstName;
  const city = input.candidateCity;
  const role = input.candidateProfession
    ? `${input.candidateProfession}${input.candidateCompany ? ` at ${input.candidateCompany}` : ""}`
    : "their chosen professional domain";

  const sharedValues =
    input.candidateValues && input.candidateValues.length > 0
      ? input.candidateValues.slice(0, 3).join(", ")
      : "family, personal growth, and authentic partnership";

  const reasons =
    input.verifiedReasons.length > 0
      ? input.verifiedReasons.slice(0, 2).join(" and ")
      : "complementary goals and strong shared values";

  const subject = `Curated Matchmaker Introduction — ${clientName} & ${candidateName}`;

  const body = `Hi ${clientName},

I have curated a thoughtful introduction for your review. I'd love you to meet ${candidateName}, who is based in ${city} and works as ${role}.

What stood out to me is your clear alignment in ${reasons}. You both place high importance on ${sharedValues}, creating an organic foundation for connection.

Take your time reviewing ${candidateName}'s verified biodata, and let me know if you would like me to facilitate an introduction.

Warmly,
Your TDC Matchmaker`;

  return {
    subject,
    body,
    summary: generateMatchSummary(input),
    source: "template",
    modelUsed: "TDC Adaptive Synthesizer",
  };
}
