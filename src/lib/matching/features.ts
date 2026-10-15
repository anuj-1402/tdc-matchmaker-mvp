/**
 * Matching Engine — Feature Functions
 *
 * Pure functions that compute compatibility features between a customer and candidate.
 * Each returns {score: 0..1, confidence: 0..1, reason, tradeoff?}.
 * No DB or API calls — purely deterministic and testable.
 *
 * Reference: plan.md §7.3–7.5
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export type Tri = "YES" | "NO" | "MAYBE";

export interface Feature {
  score: number;       // 0..1
  confidence: number;  // 0..1
  reason: string;
  tradeoff?: string;
}

export interface ScoredCandidate {
  candidateId: string;
  score: number;       // 0..100
  coverage: number;    // 0..1 (confidence)
  features: FeatureBreakdown[];
  topReasons: string[];
  tradeoffs: string[];
}

export interface FeatureBreakdown {
  key: string;
  weight: number;
  score: number;
  confidence: number;
  reason: string;
  tradeoff?: string;
}

// ─── Weights (sum = 100) ─────────────────────────────────────────────────────

export const WEIGHTS = {
  kids: 22,
  values: 18,
  relocation: 16,
  age: 12,
  profession: 10,
  marital: 8,
  height: 5,
  income: 5,
  pets: 4,
} as const;

export type FeatureKey = keyof typeof WEIGHTS;

// ─── Feature Functions ───────────────────────────────────────────────────────

/**
 * TriState compatibility (kids, pets).
 * YES↔YES or NO↔NO = 1; MAYBE with either = 0.65; YES↔NO = 0.
 */
export function triCompatibility(
  a?: Tri | null,
  b?: Tri | null
): Feature {
  if (!a || !b) {
    return { score: 0.5, confidence: 0.25, reason: "Preference not provided" };
  }
  if (a === b) {
    return { score: 1, confidence: 1, reason: "Preferences align" };
  }
  if (a === "MAYBE" || b === "MAYBE") {
    return { score: 0.65, confidence: 1, reason: "One person is flexible" };
  }
  return {
    score: 0,
    confidence: 1,
    reason: "Different preferences",
    tradeoff: "Discuss this difference early",
  };
}

/**
 * Values overlap using Jaccard similarity.
 */
export function valuesOverlap(
  a?: string[] | null,
  b?: string[] | null
): Feature {
  if (!a?.length || !b?.length) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: "Values not fully specified",
    };
  }

  const setA = new Set(a.map((x) => x.trim().toLowerCase()));
  const setB = new Set(b.map((x) => x.trim().toLowerCase()));
  const intersection = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  const score = intersection / union;

  if (intersection === 0) {
    return {
      score: 0,
      confidence: 1,
      reason: "No shared values",
      tradeoff: "May have different priorities",
    };
  }

  return {
    score,
    confidence: 1,
    reason: `${intersection} shared value${intersection > 1 ? "s" : ""}`,
  };
}

/**
 * City/relocation compatibility.
 * Same city = 1; cross-city if either willing = 0.75; both NO = 0.1.
 */
export function relocationCompatibility(
  customerCity?: string | null,
  candidateCity?: string | null,
  customerRelocate?: Tri | null,
  candidateRelocate?: Tri | null
): Feature {
  if (!customerCity || !candidateCity) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: "City information incomplete",
    };
  }

  const sameCity =
    customerCity.trim().toLowerCase() === candidateCity.trim().toLowerCase();

  if (sameCity) {
    return { score: 1, confidence: 1, reason: "Same city" };
  }

  // Cross-city
  const customerWilling =
    customerRelocate === "YES" || customerRelocate === "MAYBE";
  const candidateWilling =
    candidateRelocate === "YES" || candidateRelocate === "MAYBE";

  if (customerWilling && candidateWilling) {
    return {
      score: 0.85,
      confidence: 1,
      reason: "Both open to relocation",
    };
  }

  if (customerWilling || candidateWilling) {
    return {
      score: 0.75,
      confidence: 1,
      reason: "One person open to relocation",
      tradeoff: "Different cities — discuss logistics",
    };
  }

  return {
    score: 0.1,
    confidence: 1,
    reason: "Different cities, neither open to relocate",
    tradeoff: "Location mismatch — may be a dealbreaker",
  };
}

/**
 * Numeric range fit (age, height, income).
 * Within preferred range = 1; decay with distance.
 */
export function numericRangeFit(
  value: number | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined,
  tolerance: number,
  label: string
): Feature {
  if (value == null) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: `${label} not provided`,
    };
  }

  if (min == null && max == null) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: `No ${label.toLowerCase()} preference specified`,
    };
  }

  const effectiveMin = min ?? -Infinity;
  const effectiveMax = max ?? Infinity;

  if (value >= effectiveMin && value <= effectiveMax) {
    return {
      score: 1,
      confidence: 1,
      reason: `${label} within preferred range`,
    };
  }

  const distance =
    value < effectiveMin ? effectiveMin - value : value - effectiveMax;
  const score = Math.max(0, 1 - distance / tolerance);

  return {
    score,
    confidence: 1,
    reason:
      score > 0.5
        ? `${label} close to preferred range`
        : `${label} outside preferred range`,
    tradeoff: score < 0.5 ? `${label} may not match expectations` : undefined,
  };
}

/**
 * Profession/lifestyle compatibility.
 * Same category = 1; related categories = 0.6; different = 0.3; unknown = neutral.
 */
export function professionFit(
  customerProfession?: string | null,
  candidateProfession?: string | null,
  customerPreferences?: string[] | null
): Feature {
  if (!candidateProfession) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: "Profession not specified",
    };
  }

  if (!customerPreferences?.length && !customerProfession) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: "No profession preference specified",
    };
  }

  const candidateProf = candidateProfession.trim().toLowerCase();

  // Check against explicit preferences
  if (customerPreferences?.length) {
    const prefs = customerPreferences.map((p) => p.trim().toLowerCase());
    if (prefs.includes(candidateProf)) {
      return {
        score: 1,
        confidence: 1,
        reason: "Profession matches preference",
      };
    }
    // Partial match
    const hasPartial = prefs.some(
      (p) => candidateProf.includes(p) || p.includes(candidateProf)
    );
    if (hasPartial) {
      return {
        score: 0.7,
        confidence: 0.8,
        reason: "Related profession",
      };
    }
  }

  // Same category comparison
  if (customerProfession) {
    if (
      customerProfession.trim().toLowerCase() === candidateProf
    ) {
      return {
        score: 0.8,
        confidence: 0.8,
        reason: "Similar professional background",
      };
    }
  }

  return {
    score: 0.3,
    confidence: 0.6,
    reason: "Different professional field",
  };
}

/**
 * Marital status compatibility.
 * Matches stated acceptable statuses.
 */
export function maritalStatusFit(
  candidateStatus?: string | null,
  acceptableStatuses?: string[] | null
): Feature {
  if (!candidateStatus) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: "Marital status not provided",
    };
  }

  if (!acceptableStatuses?.length) {
    return {
      score: 0.5,
      confidence: 0.25,
      reason: "No marital status preference",
    };
  }

  const status = candidateStatus.trim().toLowerCase();
  const acceptable = acceptableStatuses.map((s) => s.trim().toLowerCase());

  if (acceptable.includes(status)) {
    return {
      score: 1,
      confidence: 1,
      reason: "Marital status matches preference",
    };
  }

  return {
    score: 0.2,
    confidence: 1,
    reason: "Marital status may not match preference",
    tradeoff: "Discuss expectations",
  };
}
