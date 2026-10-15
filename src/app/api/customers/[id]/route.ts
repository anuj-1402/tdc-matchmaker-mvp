import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { calculateAge } from "@/lib/utils/format";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const matchmaker = await requireAuth();
    const { id } = await params;

    // Strict ownership enforcement
    const customer = await prisma.customer.findFirst({
      where: {
        id,
        assignedMatchmakerId: matchmaker.id,
      },
      include: {
        partnerPreferences: true,
        notes: {
          orderBy: { createdAt: "desc" },
          include: {
            author: {
              select: { id: true, displayName: true, username: true },
            },
          },
        },
        journeyEvents: {
          orderBy: { createdAt: "desc" },
          include: {
            actor: {
              select: { id: true, displayName: true, username: true },
            },
          },
        },
        matchSuggestions: {
          orderBy: { createdAt: "desc" },
          include: {
            candidate: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                gender: true,
                city: true,
                designation: true,
                currentCompany: true,
                verificationStatus: true,
              },
            },
            actor: {
              select: { id: true, displayName: true },
            },
          },
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const age = calculateAge(customer.dateOfBirth);

    return NextResponse.json({
      customer: {
        ...customer,
        age,
        fullName: `${customer.firstName} ${customer.lastName}`,
      },
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Customer Detail Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch customer details" },
      { status: 500 }
    );
  }
}
