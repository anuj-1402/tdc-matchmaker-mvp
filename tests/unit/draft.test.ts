/**
 * Unit tests for AI draft generation and fallback templates.
 * Reference: plan.md §8 & §12
 */

import { describe, it, expect } from "vitest";
import { generateFallbackDraft, generateIntroDraft } from "@/lib/ai/draft";

describe("Intro Draft Generator", () => {
  const sampleInput = {
    customerFirstName: "Asha",
    candidateFirstName: "Arjun",
    candidateCity: "Mumbai",
    candidateProfession: "Technology",
    verifiedReasons: [
      "Both aligned on wanting children",
      "Both open to relocating",
      "Shared values in family, travel",
    ],
    approvedForSharing: ["Technology", "Mumbai", "Vegetarian"],
  };

  it("generates deterministic fallback draft when OpenAI is not configured", async () => {
    const result = await generateIntroDraft(sampleInput);

    expect(result.source).toBe("template");
    expect(result.subject).toContain("Asha");
    expect(result.subject).toContain("Arjun");
    expect(result.body).toContain("Arjun");
    expect(result.body).toContain("Mumbai");
    expect(result.body).toContain("Technology");
    expect(result.body.length).toBeGreaterThan(50);
  });

  it("fallback draft adheres to ≤ 120 words rule", () => {
    const draft = generateFallbackDraft(sampleInput);
    const words = draft.body.trim().split(/\s+/).length;

    expect(words).toBeLessThanOrEqual(120);
    expect(draft.subject).toContain("Asha");
    expect(draft.subject).toContain("Arjun");
  });

  it("never includes sensitive fields like caste, religion, or exact salary in fallback", () => {
    const draft = generateFallbackDraft(sampleInput);
    const text = (draft.subject + " " + draft.body).toLowerCase();

    expect(text).not.toContain("caste");
    expect(text).not.toContain("religion");
    expect(text).not.toContain("salary");
    expect(text).not.toContain("inr");
  });
});
