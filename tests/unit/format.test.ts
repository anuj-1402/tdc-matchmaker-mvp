/**
 * Unit tests for utility functions.
 */

import { describe, it, expect } from "vitest";
import {
  calculateAge,
  formatHeight,
  formatIncome,
  formatStage,
  getInitials,
} from "@/lib/utils/format";

describe("calculateAge", () => {
  it("calculates age correctly", () => {
    const dob = new Date(1998, 3, 15); // April 15, 1998
    const ref = new Date(2026, 9, 15); // October 15, 2026
    expect(calculateAge(dob, ref)).toBe(28);
  });

  it("handles birthday not yet passed this year", () => {
    const dob = new Date(1998, 11, 25); // December 25
    const ref = new Date(2026, 9, 15); // October 15
    expect(calculateAge(dob, ref)).toBe(27);
  });

  it("handles birthday on reference date", () => {
    const dob = new Date(1998, 9, 15); // October 15
    const ref = new Date(2026, 9, 15);
    expect(calculateAge(dob, ref)).toBe(28);
  });

  it("handles leap day birthday", () => {
    const dob = new Date(1996, 1, 29); // Feb 29
    const ref = new Date(2026, 2, 1); // March 1, 2026
    expect(calculateAge(dob, ref)).toBe(30);
  });

  it("enforces 18+ adult threshold", () => {
    const dob = new Date(2010, 0, 1);
    const ref = new Date(2026, 9, 15);
    expect(calculateAge(dob, ref)).toBeLessThan(18);
  });
});

describe("formatHeight", () => {
  it("formats 175cm correctly", () => {
    const result = formatHeight(175);
    expect(result).toContain("175 cm");
    expect(result).toContain("5'");
  });

  it("formats 160cm correctly", () => {
    const result = formatHeight(160);
    expect(result).toContain("160 cm");
  });
});

describe("formatIncome", () => {
  it("formats INR income as LPA", () => {
    expect(formatIncome(2400000)).toBe("₹24 LPA");
  });

  it("formats smaller income", () => {
    expect(formatIncome(500000)).toBe("₹5 LPA");
  });

  it("handles null income", () => {
    expect(formatIncome(null)).toBe("Not provided");
  });

  it("handles undefined income", () => {
    expect(formatIncome(undefined)).toBe("Not provided");
  });
});

describe("formatStage", () => {
  it("formats IN_MATCHING", () => {
    expect(formatStage("IN_MATCHING")).toBe("In Matching");
  });

  it("formats NEW", () => {
    expect(formatStage("NEW")).toBe("New");
  });

  it("formats AWAITING_FEEDBACK", () => {
    expect(formatStage("AWAITING_FEEDBACK")).toBe("Awaiting Feedback");
  });
});

describe("getInitials", () => {
  it("returns correct initials", () => {
    expect(getInitials("Asha", "Mehta")).toBe("AM");
  });
});
