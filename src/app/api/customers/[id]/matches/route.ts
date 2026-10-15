import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCustomerOwnership } from "@/lib/auth/session";
import { rankCandidates, getScoreLabel, getCoverageLabel } from "@/lib/matching/score";
import { calculateAge, formatHeight, formatIncome } from "@/lib/utils/format";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { customer } = await requireCustomerOwnership(id);

    // Fetch customer's partner preferences
    const preferences = await prisma.partnerPreferences.findUnique({
      where: { customerId: customer.id },
    });

    // Query active opposite-gender candidates
    const oppositeGender = customer.gender.toLowerCase() === "female" ? "Male" : "Female";

    const candidates = await prisma.candidate.findMany({
      where: {
        gender: { equals: oppositeGender, mode: "insensitive" },
        active: true,
      },
    });

    // Also fetch any existing match suggestions for this customer to mark previously sent
    const existingSuggestions = await prisma.matchSuggestionEvent.findMany({
      where: { customerId: customer.id },
      select: { candidateId: true, status: true, createdAt: true },
    });

    const sentCandidateMap = new Map(
      existingSuggestions.map((s) => [s.candidateId, s])
    );

    // Format for ranking algorithm
    const customerProfile = {
      id: customer.id,
      gender: customer.gender,
      dateOfBirth: customer.dateOfBirth,
      city: customer.city,
      heightCm: customer.heightCm,
      incomeAnnual: customer.incomeAnnual,
      incomeCurrency: customer.incomeCurrency,
      wantKids: customer.wantKids,
      openToRelocate: customer.openToRelocate,
      openToPets: customer.openToPets,
      values: customer.values,
      professionCategory: customer.professionCategory,
      maritalStatus: customer.maritalStatus,
    };

    const candidateProfiles = candidates.map((c) => ({
      id: c.id,
      gender: c.gender,
      dateOfBirth: c.dateOfBirth,
      city: c.city,
      heightCm: c.heightCm,
      incomeAnnual: c.incomeAnnual,
      incomeCurrency: c.incomeCurrency,
      wantKids: c.wantKids,
      openToRelocate: c.openToRelocate,
      openToPets: c.openToPets,
      values: c.values,
      professionCategory: c.professionCategory,
      maritalStatus: c.maritalStatus,
      preferredMinAge: c.preferredMinAge,
      preferredMaxAge: c.preferredMaxAge,
      preferredMinHeightCm: c.preferredMinHeightCm,
      preferredMaxHeightCm: c.preferredMaxHeightCm,
      preferredMinIncome: c.preferredMinIncome,
      preferredCities: c.preferredCities,
      preferredMaritalStatuses: c.preferredMaritalStatuses,
      preferredRelocation: c.preferredRelocation,
      preferredKids: c.preferredKids,
    }));

    // Rank candidates deterministically
    const rankedScored = rankCandidates(
      customerProfile,
      preferences,
      candidateProfiles,
      25 // Return top 25 matches
    );

    // Map candidate raw metadata back to scored candidates
    const candidateMap = new Map(candidates.map((c) => [c.id, c]));

    const matches = rankedScored.map((scored, index) => {
      const cand = candidateMap.get(scored.candidateId)!;
      const age = calculateAge(cand.dateOfBirth);
      const scoreMeta = getScoreLabel(scored.score);
      const coverageText = getCoverageLabel(scored.coverage);
      const sentRecord = sentCandidateMap.get(cand.id);

      return {
        rank: index + 1,
        candidateId: cand.id,
        firstName: cand.firstName,
        lastName: cand.lastName,
        fullName: `${cand.firstName} ${cand.lastName}`,
        gender: cand.gender,
        age,
        dateOfBirth: cand.dateOfBirth,
        city: cand.city,
        country: cand.country,
        heightCm: cand.heightCm,
        heightFormatted: formatHeight(cand.heightCm),
        professionCategory: cand.professionCategory,
        designation: cand.designation,
        currentCompany: cand.currentCompany,
        undergraduateCollege: cand.undergraduateCollege,
        degree: cand.degree,
        incomeAnnual: cand.incomeAnnual,
        incomeFormatted: formatIncome(cand.incomeAnnual, cand.incomeCurrency),
        maritalStatus: cand.maritalStatus,
        wantKids: cand.wantKids,
        openToRelocate: cand.openToRelocate,
        openToPets: cand.openToPets,
        values: cand.values,
        verificationStatus: cand.verificationStatus,
        score: scored.score,
        scoreLabel: scoreMeta.label,
        scoreColor: scoreMeta.color,
        coverage: scored.coverage,
        coverageLabel: coverageText,
        topReasons: scored.topReasons,
        tradeoffs: scored.tradeoffs,
        breakdown: scored.features,
        mockSent: !!sentRecord,
        mockSentAt: sentRecord?.createdAt || null,
      };
    });

    return NextResponse.json({
      matches,
      totalCandidatesEvaluated: candidates.length,
      oppositeGender,
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("[Matches API Error]", err);
    return NextResponse.json(
      { error: "Failed to evaluate candidate matches" },
      { status: 500 }
    );
  }
}
