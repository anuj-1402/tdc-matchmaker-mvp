/**
 * Utility functions for age, currency, and formatting.
 * Pure functions — no DB or API calls.
 */

/**
 * Calculate age from date of birth at a reference date (defaults to now).
 * Handles leap-day birthdays correctly.
 */
export function calculateAge(dob: Date, referenceDate: Date = new Date()): number {
  const ref = referenceDate;
  let age = ref.getFullYear() - dob.getFullYear();
  const monthDiff = ref.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && ref.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

/**
 * Format height from cm to a display string.
 * e.g. 175 → "175 cm (5'9\")"
 */
export function formatHeight(cm: number): string {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return `${cm} cm (${feet}'${inches}")`;
}

/**
 * Format annual income in INR with LPA notation.
 * e.g. 2400000 → "₹24 LPA"
 */
export function formatIncome(amount: number | null | undefined, currency: string = "INR"): string {
  if (amount == null) return "Not provided";
  if (currency === "INR") {
    const lpa = amount / 100000;
    if (lpa >= 1) {
      return `₹${lpa % 1 === 0 ? lpa : lpa.toFixed(1)} LPA`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  }
  return `${currency} ${amount.toLocaleString()}`;
}

/**
 * Capitalize first letter of each word.
 */
export function titleCase(str: string): string {
  return str
    .toLowerCase()
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Format a journey stage enum to human-readable.
 * e.g. "IN_MATCHING" → "In Matching"
 */
export function formatStage(stage: string): string {
  return stage
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Format date to locale string.
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * Format date with time.
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Get initials from a name for avatar.
 */
export function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}
