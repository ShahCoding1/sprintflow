import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { timeSummaryService } from "@/server/services/time-summary.service";

export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const url = new URL(request.url);

    const projectId = url.searchParams.get("projectId");
    const requestedUserId =
      url.searchParams.get("userId") ?? session.user.id;

    if (!projectId) {
      return NextResponse.json(
        { error: "PROJECT_ID_REQUIRED" },
        { status: 400 },
      );
    }

    const project = await prisma.project.findUnique({
      where: {
        id: projectId,
      },
      select: {
        id: true,
        organizationId: true,
      },
    });

    if (!project) {
      return NextResponse.json(
        { error: "PROJECT_NOT_FOUND" },
        { status: 404 },
      );
    }

    const membership =
      await prisma.organizationMember.findUnique({
        where: {
          organizationId_userId: {
            organizationId: project.organizationId,
            userId: session.user.id,
          },
        },
        select: {
          role: true,
        },
      });

    if (!membership) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const canViewAnotherUser =
      membership.role === "OWNER" ||
      membership.role === "ADMIN";

    if (
      requestedUserId !== session.user.id &&
      !canViewAnotherUser
    ) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const summary = await timeSummaryService.getUserSummary(
      project.id,
      project.organizationId,
      requestedUserId,
    );

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    console.error("GET user time summary error:", error);

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}