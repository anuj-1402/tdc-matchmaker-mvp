/**
 * Unit tests for matching engine feature functions.
 * Reference: plan.md §12 — Unit tests
 */

import { describe, it, expect } from "vitest";
import {
  triCompatibility,
  valuesOverlap,
  relocationCompatibility,
  numericRangeFit,
  professionFit,
  maritalStatusFit,
  WEIGHTS,
} from "@/lib/matching/features";

// ─── Weights Sum ─────────────────────────────────────────────────────────────

describe("Weights", () => {
  it("should sum to 100", () => {
    const sum = Object.values(WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });
});

// ─── TriState Compatibility ──────────────────────────────────────────────────

describe("triCompatibility", () => {
  it("YES↔YES = 1", () => {
    const result = triCompatibility("YES", "YES");
    expect(result.score).toBe(1);
    expect(result.confidence).toBe(1);
  });

  it("NO↔NO = 1", () => {
    const result = triCompatibility("NO", "NO");
    expect(result.score).toBe(1);
  });

  it("MAYBE↔YES = 0.65", () => {
    const result = triCompatibility("MAYBE", "YES");
    expect(result.score).toBe(0.65);
    expect(result.confidence).toBe(1);
  });

  it("YES↔NO = 0", () => {
    const result = triCompatibility("YES", "NO");
    expect(result.score).toBe(0);
    expect(result.tradeoff).toBeDefined();
  });

  it("null = neutral (0.5, low confidence)", () => {
    const result = triCompatibility(null, "YES");
    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0.25);
  });

  it("both null = neutral", () => {
    const result = triCompatibility(null, null);
    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0.25);
  });

  // Full 3×3 matrix
  const triValues = ["YES", "NO", "MAYBE"] as const;
  for (const a of triValues) {
    for (const b of triValues) {
      it(`${a}↔${b} score is 0..1`, () => {
        const result = triCompatibility(a, b);
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      });
    }
  }
});

// ─── Values Overlap ──────────────────────────────────────────────────────────

describe("valuesOverlap", () => {
  it("identical values = 1", () => {
    const result = valuesOverlap(["family", "career"], ["family", "career"]);
    expect(result.score).toBe(1);
  });

  it("no overlap = 0", () => {
    const result = valuesOverlap(["family"], ["career"]);
    expect(result.score).toBe(0);
    expect(result.tradeoff).toBeDefined();
  });

  it("partial overlap = Jaccard", () => {
    const result = valuesOverlap(["family", "career"], ["career", "travel"]);
    // intersection=1 (career), union=3 → 1/3
    expect(result.score).toBeCloseTo(1 / 3, 2);
  });

  it("case insensitive", () => {
    const result = valuesOverlap(["Family"], ["family"]);
    expect(result.score).toBe(1);
  });

  it("empty array = neutral", () => {
    const result = valuesOverlap([], ["career"]);
    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0.25);
  });

  it("null = neutral", () => {
    const result = valuesOverlap(null, ["career"]);
    expect(result.score).toBe(0.5);
  });
});

// ─── Relocation Compatibility ────────────────────────────────────────────────

describe("relocationCompatibility", () => {
  it("same city = 1", () => {
    const result = relocationCompatibility("Mumbai", "Mumbai", "NO", "NO");
    expect(result.score).toBe(1);
  });

  it("case insensitive city match", () => {
    const result = relocationCompatibility("mumbai", "Mumbai", "NO", "NO");
    expect(result.score).toBe(1);
  });

  it("different city, both willing = 0.85", () => {
    const result = relocationCompatibility("Mumbai", "Delhi", "YES", "YES");
    expect(result.score).toBe(0.85);
  });

  it("different city, one willing = 0.75", () => {
    const result = relocationCompatibility("Mumbai", "Delhi", "YES", "NO");
    expect(result.score).toBe(0.75);
  });

  it("different city, neither willing = 0.1", () => {
    const result = relocationCompatibility("Mumbai", "Delhi", "NO", "NO");
    expect(result.score).toBe(0.1);
    expect(result.tradeoff).toBeDefined();
  });

  it("missing city = neutral", () => {
    const result = relocationCompatibility(null, "Delhi", "YES", "YES");
    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0.25);
  });
});

// ─── Numeric Range Fit ───────────────────────────────────────────────────────

describe("numericRangeFit", () => {
  it("within range = 1", () => {
    const result = numericRangeFit(28, 25, 35, 8, "Age");
    expect(result.score).toBe(1);
  });

  it("at range boundary = 1", () => {
    const result = numericRangeFit(25, 25, 35, 8, "Age");
    expect(result.score).toBe(1);
  });

  it("outside range decays", () => {
    const result = numericRangeFit(40, 25, 35, 8, "Age");
    // distance 5, tolerance 8 → 1 - 5/8 = 0.375
    expect(result.score).toBeCloseTo(0.375, 2);
  });

  it("far outside range = 0", () => {
    const result = numericRangeFit(50, 25, 35, 8, "Age");
    expect(result.score).toBe(0);
  });

  it("no preference = neutral", () => {
    const result = numericRangeFit(28, null, null, 8, "Age");
    expect(result.score).toBe(0.5);
    expect(result.confidence).toBe(0.25);
  });

  it("null value = neutral", () => {
    const result = numericRangeFit(null, 25, 35, 8, "Age");
    expect(result.score).toBe(0.5);
  });
});

// ─── Profession Fit ──────────────────────────────────────────────────────────

describe("professionFit", () => {
  it("matches preference = 1", () => {
    const result = professionFit("Technology", "Technology", ["Technology", "Finance"]);
    expect(result.score).toBe(1);
  });

  it("no preferences = neutral", () => {
    const result = professionFit(null, "Technology", null);
    expect(result.score).toBe(0.5);
  });

  it("different field = low score", () => {
    const result = professionFit("Technology", "Healthcare", ["Technology"]);
    expect(result.score).toBeLessThanOrEqual(0.5);
  });
});

// ─── Marital Status Fit ──────────────────────────────────────────────────────

describe("maritalStatusFit", () => {
  it("matches preference = 1", () => {
    const result = maritalStatusFit("Never married", ["Never married", "Divorced"]);
    expect(result.score).toBe(1);
  });

  it("doesn't match = low", () => {
    const result = maritalStatusFit("Divorced", ["Never married"]);
    expect(result.score).toBeLessThan(0.5);
  });

  it("no preference = neutral", () => {
    const result = maritalStatusFit("Never married", null);
    expect(result.score).toBe(0.5);
  });
});

// ─── Score Range ─────────────────────────────────────────────────────────────

describe("Score constraints", () => {
  it("all feature scores are 0..1", () => {
    const features = [
      triCompatibility("YES", "YES"),
      triCompatibility("YES", "NO"),
      valuesOverlap(["a"], ["b"]),
      relocationCompatibility("Mumbai", "Delhi", "NO", "NO"),
      numericRangeFit(100, 0, 50, 10, "Test"),
    ];
    for (const f of features) {
      expect(f.score).toBeGreaterThanOrEqual(0);
      expect(f.score).toBeLessThanOrEqual(1);
      expect(f.confidence).toBeGreaterThanOrEqual(0);
      expect(f.confidence).toBeLessThanOrEqual(1);
    }
  });
});
