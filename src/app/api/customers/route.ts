import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireAuth } from "@/lib/auth/session";
import { calculateAge } from "@/lib/utils/format";
import { JourneyStage, VerificationStatus } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const matchmaker = await requireAuth();

    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage") as JourneyStage | null;
    const city = searchParams.get("city");
    const q = searchParams.get("q")?.trim();
    const verified = searchParams.get("verified");
    const sort = searchParams.get("sort") || "updated";

    // Build scoped where filter
    const where: any = {
      assignedMatchmakerId: matchmaker.id,
    };

    if (stage && Object.values(JourneyStage).includes(stage)) {
      where.journeyStage = stage;
    }

    if (city) {
      where.city = { contains: city, mode: "insensitive" };
    }

    if (verified === "true") {
      where.verificationStatus = VerificationStatus.DEMO_VERIFIED;
    } else if (verified === "false") {
      where.verificationStatus = VerificationStatus.UNVERIFIED;
    }

    if (q) {
      where.OR = [
        { firstName: { contains: q, mode: "insensitive" } },
        { lastName: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { designation: { contains: q, mode: "insensitive" } },
        { currentCompany: { contains: q, mode: "insensitive" } },
        { undergraduateCollege: { contains: q, mode: "insensitive" } },
      ];
    }

    // Determine sorting
    let orderBy: any = { updatedAt: "desc" };
    if (sort === "name") {
      orderBy = { firstName: "asc" };
    } else if (sort === "created") {
      orderBy = { createdAt: "desc" };
    }

    const [customers, allAssigned] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy,
        include: {
          _count: {
            select: {
              notes: true,
              matchSuggestions: true,
            },
          },
        },
      }),
      // KPI summary for all assigned customers to this matchmaker
      prisma.customer.findMany({
        where: { assignedMatchmakerId: matchmaker.id },
        select: { journeyStage: true, city: true },
      }),
    ]);

    // Compute KPIs
    const stats = {
      totalAssigned: allAssigned.length,
      active: allAssigned.filter((c) =>
        ([
          JourneyStage.IN_MATCHING,
          JourneyStage.MATCH_SENT,
          JourneyStage.PROFILE_REVIEW,
        ] as JourneyStage[]).includes(c.journeyStage)
      ).length,
      awaitingFeedback: allAssigned.filter(
        (c) => c.journeyStage === JourneyStage.AWAITING_FEEDBACK
      ).length,
      matched: allAssigned.filter(
        (c) => c.journeyStage === JourneyStage.MATCHED
      ).length,
    };

    // Distinct cities in assigned list for filter dropdown
    const availableCities = Array.from(
      new Set(allAssigned.map((c) => c.city).filter(Boolean))
    ).sort();

    const formattedCustomers = customers.map((c) => ({
      id: c.id,
      firstName: c.firstName,
      lastName: c.lastName,
      fullName: `${c.firstName} ${c.lastName}`,
      gender: c.gender,
      age: calculateAge(c.dateOfBirth),
      city: c.city,
      country: c.country,
      designation: c.designation,
      currentCompany: c.currentCompany,
      maritalStatus: c.maritalStatus,
      verificationStatus: c.verificationStatus,
      journeyStage: c.journeyStage,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
      noteCount: c._count.notes,
      matchCount: c._count.matchSuggestions,
    }));

    return NextResponse.json({
      customers: formattedCustomers,
      stats,
      availableCities,
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("[Customers API Error]", err);
    return NextResponse.json(
      { error: "Failed to fetch customers" },
      { status: 500 }
    );
  }
}
