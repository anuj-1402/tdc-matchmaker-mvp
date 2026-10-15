import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireCustomerOwnership } from "@/lib/auth/session";
import { noteSchema } from "@/lib/validation/schemas";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { matchmaker, customer } = await requireCustomerOwnership(id);

    const body = await request.json();
    const result = noteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || "Invalid note data" },
        { status: 400 }
      );
    }

    const { body: noteBody, interactionType } = result.data;

    const note = await prisma.customerNote.create({
      data: {
        customerId: customer.id,
        authorId: matchmaker.id,
        body: noteBody,
        interactionType,
      },
      include: {
        author: {
          select: { id: true, displayName: true, username: true },
        },
      },
    });

    return NextResponse.json({
      success: true,
      note,
    });
  } catch (err: any) {
    if (err?.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err?.message === "Customer not found") {
      return NextResponse.json({ error: "Customer not found" }, { status: 404 });
    }
    console.error("[Customer Note Error]", err);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
