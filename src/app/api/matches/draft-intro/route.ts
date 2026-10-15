import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCustomerOwnership } from "@/lib/auth/session";
import { generateIntroDraft } from "@/lib/ai/draft";
import { evaluateFeatures } from "@/lib/matching/score";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, candidateId } = body;

    if (!customerId || !candidateId) {
      return NextResponse.json(
        { error: "customerId and candidateId are required" },
        { status: 400 }
      );
    }

    // Strict ownership verification
    const { customer } = await requireCustomerOwnership(customerId);

    // Fetch candidate
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Get partner preferences to evaluate shared reasons
    const preferences = await prisma.partnerPreferences.findUnique({
      where: { customerId: customer.id },
    });

    // Evaluate features to extract verified reasons
    const features = evaluateFeatures(
      {
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
      },
      preferences,
      {
        id: candidate.id,
        gender: candidate.gender,
        dateOfBirth: candidate.dateOfBirth,
        city: candidate.city,
        heightCm: candidate.heightCm,
        incomeAnnual: candidate.incomeAnnual,
        incomeCurrency: candidate.incomeCurrency,
        wantKids: candidate.wantKids,
        openToRelocate: candidate.openToRelocate,
        openToPets: candidate.openToPets,
        values: candidate.values,
        professionCategory: candidate.professionCategory,
        maritalStatus: candidate.maritalStatus,
      }
    );

    // Extract positive reasons (> 0.5 score)
    const positiveReasons = Object.values(features)
      .filter((f) => f.score > 0.5)
      .map((f) => f.reason);

    const draftInput = {
      customerFirstName: customer.firstName,
      candidateFirstName: candidate.firstName,
      candidateCity: candidate.city,
      candidateProfession: candidate.professionCategory || candidate.designation,
      verifiedReasons: positiveReasons.slice(0, 3),
      approvedForSharing: [
        candidate.city,
        candidate.professionCategory || "Professional",
        ...(candidate.values || []).slice(0, 3),
      ],
    };

    const draft = await generateIntroDraft(draftInput);

    return NextResponse.json({
      success: true,
      draft,
      disclaimer: "Mock intro draft generated. Review and personalize before sending.",
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("[Draft Intro Error]", err);
    return NextResponse.json(
      { error: "Failed to generate introduction draft" },
      { status: 500 }
    );
  }
}
