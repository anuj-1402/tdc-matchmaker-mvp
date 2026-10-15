/**
 * Unit tests for matching engine scoring and ranking.
 * Reference: plan.md §12
 */

import { describe, it, expect } from "vitest";
import {
  evaluateFeatures,
  computeScore,
  rankCandidates,
  getScoreLabel,
  getCoverageLabel,
  type CustomerProfile,
  type CustomerPreferences,
  type CandidateProfile,
} from "@/lib/matching/score";

describe("Scoring & Ranking Engine", () => {
  const baseCustomer: CustomerProfile = {
    id: "cust-1",
    gender: "Female",
    dateOfBirth: new Date("1996-05-15"), // ~30 years old in 2026
    city: "Mumbai",
    heightCm: 165,
    incomeAnnual: 1800000,
    incomeCurrency: "INR",
    wantKids: "YES",
    openToRelocate: "YES",
    openToPets: "YES",
    values: ["family", "ambition", "travel"],
    professionCategory: "Technology",
    maritalStatus: "Never Married",
  };

  const basePrefs: CustomerPreferences = {
    minAge: 27,
    maxAge: 33,
    minHeightCm: 170,
    maxHeightCm: 185,
    minIncome: 1500000,
    desiredCities: ["Mumbai", "Pune"],
    desiredMaritalStatuses: ["Never Married"],
    kidsPreference: "YES",
    preferredRelocation: "YES",
    petsPreference: "YES",
    desiredValues: ["family", "ambition", "travel"],
    professionPreferences: ["Technology", "Finance"],
  };

  const highMatchCandidate: CandidateProfile = {
    id: "cand-high",
    gender: "Male",
    dateOfBirth: new Date("1995-02-10"), // 31 years old
    city: "Mumbai",
    heightCm: 178,
    incomeAnnual: 2500000,
    incomeCurrency: "INR",
    wantKids: "YES",
    openToRelocate: "YES",
    openToPets: "YES",
    values: ["family", "ambition", "travel", "fitness"],
    professionCategory: "Technology",
    maritalStatus: "Never Married",
  };

  const lowMatchCandidate: CandidateProfile = {
    id: "cand-low",
    gender: "Male",
    dateOfBirth: new Date("1980-01-01"), // 46 years old
    city: "Kolkata",
    heightCm: 155,
    incomeAnnual: 600000,
    incomeCurrency: "INR",
    wantKids: "NO",
    openToRelocate: "NO",
    openToPets: "NO",
    values: ["tradition", "spirituality"],
    professionCategory: "Arts",
    maritalStatus: "Divorced",
  };

  it("produces high score for closely aligned candidate", () => {
    const features = evaluateFeatures(baseCustomer, basePrefs, highMatchCandidate);
    const result = computeScore(features);

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.coverage).toBeGreaterThan(0.9);
  });

  it("produces low score for misaligned candidate", () => {
    const features = evaluateFeatures(baseCustomer, basePrefs, lowMatchCandidate);
    const result = computeScore(features);

    expect(result.score).toBeLessThan(40);
  });

  it("ranks candidates deterministically in descending score order", () => {
    const mediumCandidate: CandidateProfile = {
      ...highMatchCandidate,
      id: "cand-med",
      city: "Bengaluru",
      openToRelocate: "MAYBE",
      wantKids: "MAYBE",
      values: ["family"],
    };

    const candidates = [lowMatchCandidate, mediumCandidate, highMatchCandidate];

    const ranked1 = rankCandidates(baseCustomer, basePrefs, candidates);
    const ranked2 = rankCandidates(baseCustomer, basePrefs, [...candidates].reverse());

    // Deterministic ranking
    expect(ranked1.map((c) => c.candidateId)).toEqual([
      "cand-high",
      "cand-med",
      "cand-low",
    ]);

    expect(ranked1).toEqual(ranked2);
    expect(ranked1[0].topReasons.length).toBeGreaterThan(0);
    expect(ranked1[2].tradeoffs.length).toBeGreaterThan(0);
  });

  it("returns proper score and coverage labels", () => {
    expect(getScoreLabel(90).label).toBe("High Potential");
    expect(getScoreLabel(75).label).toBe("Promising");
    expect(getScoreLabel(55).label).toBe("Worth Reviewing");
    expect(getScoreLabel(30).label).toBe("Low Alignment");

    expect(getCoverageLabel(0.85)).toBe("High confidence");
    expect(getCoverageLabel(0.6)).toBe("Medium confidence");
    expect(getCoverageLabel(0.3)).toContain("Low confidence");
  });
});
