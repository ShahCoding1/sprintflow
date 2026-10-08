import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { timeSummaryService } from "@/server/services/time-summary.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "UNAUTHORIZED" },
        { status: 401 },
      );
    }

    const { projectId } = await context.params;

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
          id: true,
        },
      });

    if (!membership) {
      return NextResponse.json(
        { error: "FORBIDDEN" },
        { status: 403 },
      );
    }

    const summary = await timeSummaryService.getProjectSummary(
      project.id,
      project.organizationId,
    );

    return NextResponse.json({
      data: summary,
    });
  } catch (error) {
    console.error("GET project time summary error:", error);

    return NextResponse.json(
      {
        error: "INTERNAL_SERVER_ERROR",
      },
      { status: 500 },
    );
  }
}