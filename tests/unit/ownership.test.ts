/**
 * Scoping & Ownership Tests — IDOR Prevention
 * Reference: plan.md §3 & §12, AGENTS.md Guardrails
 */

import { describe, it, expect } from "vitest";
import { prisma } from "@/lib/db/prisma";

describe("Customer Ownership & Scoping", () => {
  it("enforces that matchmakers only have access to their assigned customers", async () => {
    const priya = await prisma.matchmaker.findUnique({
      where: { username: "priya.matchmaker" },
      include: { customers: true },
    });

    const rahul = await prisma.matchmaker.findUnique({
      where: { username: "rahul.matchmaker" },
      include: { customers: true },
    });

    expect(priya).not.toBeNull();
    expect(rahul).not.toBeNull();

    if (!priya || !rahul) return;

    expect(priya.customers.length).toBeGreaterThan(0);
    expect(rahul.customers.length).toBeGreaterThan(0);

    const priyaCustomerIds = new Set(priya.customers.map((c) => c.id));
    const rahulCustomerIds = new Set(rahul.customers.map((c) => c.id));

    // Customers must be strictly disjoint between matchmakers
    for (const id of priyaCustomerIds) {
      expect(rahulCustomerIds.has(id)).toBe(false);
    }

    // Scoped query for Rahul on Priya's customer must yield null
    const firstPriyaCustomerId = priya.customers[0].id;
    const rahulAccessAttempt = await prisma.customer.findFirst({
      where: {
        id: firstPriyaCustomerId,
        assignedMatchmakerId: rahul.id,
      },
    });

    expect(rahulAccessAttempt).toBeNull();

    // Scoped query for Priya on Priya's customer must succeed
    const priyaAccessAttempt = await prisma.customer.findFirst({
      where: {
        id: firstPriyaCustomerId,
        assignedMatchmakerId: priya.id,
      },
    });

    expect(priyaAccessAttempt).not.toBeNull();
    expect(priyaAccessAttempt?.id).toBe(firstPriyaCustomerId);
  });
});
