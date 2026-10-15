import { NextResponse } from "next/server";
import { getCurrentMatchmaker } from "@/lib/auth/session";

export async function GET() {
  const matchmaker = await getCurrentMatchmaker();
  if (!matchmaker) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    user: matchmaker,
  });
}
