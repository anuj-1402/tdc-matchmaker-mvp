import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { verifyPassword, createSession } from "@/lib/auth/session";
import { loginSchema } from "@/lib/validation/schemas";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid username or password format" },
        { status: 400 }
      );
    }

    const { username, password } = result.data;

    // Generic error message to prevent account enumeration
    const matchmaker = await prisma.matchmaker.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (!matchmaker) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    const valid = await verifyPassword(matchmaker.passwordHash, password);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid username or password" },
        { status: 401 }
      );
    }

    // Set signed session cookie
    const token = await createSession(matchmaker.id);

    const response = NextResponse.json({
      success: true,
      user: {
        id: matchmaker.id,
        username: matchmaker.username,
        displayName: matchmaker.displayName,
        role: matchmaker.role,
      },
    });

    response.cookies.set("matchmaker_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[Login Error]", err);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
