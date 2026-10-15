import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCustomerOwnership } from "@/lib/auth/session";
import { JourneyStage, MatchChannel, MatchSendStatus } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { customerId, candidateId, introDraft, scoreSnapshot } = body;

    if (!customerId || !candidateId) {
      return NextResponse.json(
        { error: "customerId and candidateId are required" },
        { status: 400 }
      );
    }

    const { matchmaker, customer } = await requireCustomerOwnership(customerId);

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      return NextResponse.json(
        { error: "Candidate not found" },
        { status: 404 }
      );
    }

    // Check duplicate send
    const existing = await prisma.matchSuggestionEvent.findUnique({
      where: {
        customerId_candidateId_channel: {
          customerId: customer.id,
          candidateId: candidate.id,
          channel: MatchChannel.MOCK_EMAIL,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "This candidate has already been sent to this customer.",
          sentAt: existing.createdAt,
        },
        { status: 409 }
      );
    }

    // In a transaction: record match suggestion event and conditionally advance stage
    const result = await prisma.$transaction(async (tx) => {
      const matchEvent = await tx.matchSuggestionEvent.create({
        data: {
          customerId: customer.id,
          candidateId: candidate.id,
          actorId: matchmaker.id,
          scoreSnapshot: scoreSnapshot || {},
          introDraft: introDraft || null,
          channel: MatchChannel.MOCK_EMAIL,
          status: MatchSendStatus.MOCK_SENT,
        },
        include: {
          candidate: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      // If customer is currently in matching or prior stage, advance to MATCH_SENT
      let updatedStage: JourneyStage | null = null;
      if (
        ([
          JourneyStage.NEW,
          JourneyStage.PROFILE_REVIEW,
          JourneyStage.VERIFIED,
          JourneyStage.IN_MATCHING,
        ] as JourneyStage[]).includes(customer.journeyStage)
      ) {
        updatedStage = JourneyStage.MATCH_SENT;
        await tx.customer.update({
          where: { id: customer.id },
          data: { journeyStage: JourneyStage.MATCH_SENT },
        });

        await tx.journeyEvent.create({
          data: {
            customerId: customer.id,
            actorId: matchmaker.id,
            fromStage: customer.journeyStage,
            toStage: JourneyStage.MATCH_SENT,
          },
        });
      }

      return { matchEvent, updatedStage };
    });

    return NextResponse.json({
      success: true,
      matchEventId: result.matchEvent.id,
      stageUpdated: result.updatedStage !== null,
      newStage: result.updatedStage,
      notice: "Mock email recorded — no real email sent.",
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("[Match Send Error]", err);
    return NextResponse.json(
      { error: "Failed to record match send" },
      { status: 500 }
    );
  }
}
