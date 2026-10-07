import { NextResponse } from "next/server";

import { sprintSummaryService } from "@/server/services/sprint-summary.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    sprintId: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Workspace context is required.",
        },
        {
          status: 401,
        },
      );
    }

    const {
      projectId,
      sprintId,
    } = await context.params;

    const summary =
      await sprintSummaryService.getSprintSummary(
        {
          sprintId,
          projectId,
          organizationId:
            workspace.id,
        },
      );

    return NextResponse.json({
      success: true,
      summary,
    });
  } catch (error) {
    console.error(
      "Get sprint summary error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load sprint summary.";

    const status =
      message === "Project not found." ||
      message === "Sprint not found."
        ? 404
        : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      {
        status,
      },
    );
  }
}