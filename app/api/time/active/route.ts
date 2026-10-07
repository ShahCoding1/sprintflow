import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { timeEntryService } from "@/server/services/time-entry.service";

export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const entry = await timeEntryService.getActive(
      session.user.id,
    );

    return NextResponse.json({
      entry,
    });
  } catch (error) {
    console.error(
      "GET /api/time/active failed:",
      error,
    );

    return NextResponse.json(
      {
        error: "Failed to load active timer.",
      },
      { status: 500 },
    );
  }
}