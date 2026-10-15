/**
 * Matching Engine — Scoring & Ranking
 *
 * Combines feature scores into a weighted total with explanations.
 * Pure functions — deterministic and testable.
 *
 * Reference: plan.md §7.3–7.6
 */

import {
  type Feature,
  type FeatureKey,
  type FeatureBreakdown,
  type ScoredCandidate,
  WEIGHTS,
  triCompatibility,
  valuesOverlap,
  relocationCompatibility,
  numericRangeFit,
  professionFit,
  maritalStatusFit,
} from "./features";
import { calculateAge } from "@/lib/utils/format";

// ─── Types for customer/candidate profiles ───────────────────────────────────

export interface CustomerProfile {
  id: string;
  gender: string;
  dateOfBirth: Date;
  city: string;
  heightCm: number;
  incomeAnnual: number | null;
  incomeCurrency: string;
  wantKids: string | null;
  openToRelocate: string | null;
  openToPets: string | null;
  values: string[];
  professionCategory: string | null;
  maritalStatus: string;
}

export interface CustomerPreferences {
  minAge?: number | null;
  maxAge?: number | null;
  minHeightCm?: number | null;
  maxHeightCm?: number | null;
  minIncome?: number | null;
  desiredCities?: string[];
  desiredMaritalStatuses?: string[];
  preferredRelocation?: string | null;
  kidsPreference?: string | null;
  petsPreference?: string | null;
  desiredValues?: string[];
  professionPreferences?: string[];
}

export interface CandidateProfile {
  id: string;
  gender: string;
  dateOfBirth: Date;
  city: string;
  heightCm: number;
  incomeAnnual: number | null;
  incomeCurrency: string;
  wantKids: string | null;
  openToRelocate: string | null;
  openToPets: string | null;
  values: string[];
  professionCategory: string | null;
  maritalStatus: string;
  // Candidate-side preferences for mutual scoring
  preferredMinAge?: number | null;
  preferredMaxAge?: number | null;
  preferredMinHeightCm?: number | null;
  preferredMaxHeightCm?: number | null;
  preferredMinIncome?: number | null;
  preferredCities?: string[];
  preferredMaritalStatuses?: string[];
  preferredRelocation?: string | null;
  preferredKids?: string | null;
}

// ─── Evaluate All Features ───────────────────────────────────────────────────

type Tri = "YES" | "NO" | "MAYBE";

function asTri(v: string | null | undefined): Tri | null {
  if (v === "YES" || v === "NO" || v === "MAYBE") return v;
  return null;
}

export function evaluateFeatures(
  customer: CustomerProfile,
  prefs: CustomerPreferences | null,
  candidate: CandidateProfile
): Record<FeatureKey, Feature> {
  const customerAge = calculateAge(new Date(customer.dateOfBirth));
  const candidateAge = calculateAge(new Date(candidate.dateOfBirth));

  return {
    kids: triCompatibility(
      asTri(prefs?.kidsPreference ?? customer.wantKids),
      asTri(candidate.wantKids)
    ),

    values: valuesOverlap(
      prefs?.desiredValues?.length ? prefs.desiredValues : customer.values,
      candidate.values
    ),

    relocation: relocationCompatibility(
      customer.city,
      candidate.city,
      asTri(customer.openToRelocate),
      asTri(candidate.openToRelocate)
    ),

    age: numericRangeFit(
      candidateAge,
      prefs?.minAge ?? null,
      prefs?.maxAge ?? null,
      8, // tolerance: 8 years
      "Age"
    ),

    profession: professionFit(
      customer.professionCategory,
      candidate.professionCategory,
      prefs?.professionPreferences ?? null
    ),

    marital: maritalStatusFit(
      candidate.maritalStatus,
      prefs?.desiredMaritalStatuses ?? null
    ),

    height: numericRangeFit(
      candidate.heightCm,
      prefs?.minHeightCm ?? null,
      prefs?.maxHeightCm ?? null,
      20, // tolerance: 20 cm
      "Height"
    ),

    income: (() => {
      // Only compare if same currency
      if (
        candidate.incomeCurrency !== customer.incomeCurrency ||
        candidate.incomeAnnual == null
      ) {
        return {
          score: 0.5,
          confidence: 0.25,
          reason: "Income not comparable",
        };
      }
      return numericRangeFit(
        candidate.incomeAnnual,
        prefs?.minIncome ?? null,
        null, // no max income preference by default
        2000000, // tolerance: ₹20 LPA
        "Income"
      );
    })(),

    pets: triCompatibility(
      asTri(prefs?.petsPreference ?? customer.openToPets),
      asTri(candidate.openToPets)
    ),
  };
}

// ─── Weighted Score Calculation ──────────────────────────────────────────────

export function computeScore(features: Record<FeatureKey, Feature>): {
  score: number;
  coverage: number;
  breakdown: FeatureBreakdown[];
} {
  const keys = Object.keys(WEIGHTS) as FeatureKey[];
  const totalWeight = keys.reduce((sum, k) => sum + WEIGHTS[k], 0);

  const rawScore = keys.reduce(
    (sum, k) => sum + WEIGHTS[k] * features[k].score,
    0
  ) / totalWeight;

  const coverage = keys.reduce(
    (sum, k) => sum + WEIGHTS[k] * features[k].confidence,
    0
  ) / totalWeight;

  const breakdown: FeatureBreakdown[] = keys.map((k) => ({
    key: k,
    weight: WEIGHTS[k],
    score: features[k].score,
    confidence: features[k].confidence,
    reason: features[k].reason,
    tradeoff: features[k].tradeoff,
  }));

  return {
    score: Math.round(100 * rawScore),
    coverage,
    breakdown,
  };
}

// ─── Rank Candidates ─────────────────────────────────────────────────────────

export function rankCandidates(
  customer: CustomerProfile,
  prefs: CustomerPreferences | null,
  candidates: CandidateProfile[],
  limit: number = 20
): ScoredCandidate[] {
  const scored: ScoredCandidate[] = candidates.map((candidate) => {
    const features = evaluateFeatures(customer, prefs, candidate);
    const { score, coverage, breakdown } = computeScore(features);

    // Top 3 positive reasons (highest weighted score contribution)
    const sortedPositive = [...breakdown]
      .filter((f) => f.score > 0.5)
      .sort((a, b) => b.weight * b.score - a.weight * a.score);

    const topReasons = sortedPositive
      .slice(0, 3)
      .map((f) => f.reason);

    // Top 2 tradeoffs
    const tradeoffs = breakdown
      .filter((f) => f.tradeoff)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 2)
      .map((f) => f.tradeoff!);

    return {
      candidateId: candidate.id,
      score,
      coverage,
      features: breakdown,
      topReasons,
      tradeoffs,
    };
  });

  // Stable sort: score desc, coverage desc, candidateId asc (for determinism)
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.candidateId.localeCompare(b.candidateId);
  });

  return scored.slice(0, limit);
}

// ─── Score Labels ────────────────────────────────────────────────────────────

export function getScoreLabel(score: number): {
  label: string;
  color: string;
} {
  if (score >= 85)
    return { label: "High Potential", color: "emerald" };
  if (score >= 70)
    return { label: "Promising", color: "blue" };
  if (score >= 50)
    return { label: "Worth Reviewing", color: "amber" };
  return { label: "Low Alignment", color: "slate" };
}

export function getCoverageLabel(coverage: number): string {
  if (coverage >= 0.8) return "High confidence";
  if (coverage >= 0.5) return "Medium confidence";
  return "Low confidence — some data missing";
}
