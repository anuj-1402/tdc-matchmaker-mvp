import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCustomerOwnership } from "@/lib/auth/session";
import { stageUpdateSchema } from "@/lib/validation/schemas";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { matchmaker, customer } = await requireCustomerOwnership(id);

    const body = await request.json();
    const result = stageUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid stage specified" },
        { status: 400 }
      );
    }

    const { stage } = result.data;
    const previousStage = customer.journeyStage;

    if (previousStage === stage) {
      return NextResponse.json({
        customer,
        message: "Stage unchanged",
      });
    }

    // Run update and event creation in a transaction
    const [updatedCustomer, journeyEvent] = await prisma.$transaction([
      prisma.customer.update({
        where: { id: customer.id },
        data: { journeyStage: stage },
      }),
      prisma.journeyEvent.create({
        data: {
          customerId: customer.id,
          actorId: matchmaker.id,
          fromStage: previousStage,
          toStage: stage,
        },
        include: {
          actor: {
            select: { id: true, displayName: true, username: true },
          },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      customer: updatedCustomer,
      journeyEvent,
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("[Stage Update Error]", err);
    return NextResponse.json(
      { error: "Failed to update journey stage" },
      { status: 500 }
    );
  }
}
