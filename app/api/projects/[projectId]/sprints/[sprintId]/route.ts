import { NextResponse } from "next/server";

import { updateSprintSchema } from "@/features/task/schemas/update-sprint.schema";
import { sprintService } from "@/server/services/sprint.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    sprintId: string;
  }>;
};

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const {
      projectId,
      sprintId,
    } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const body: unknown =
      await request.json();

    const parsed =
      updateSprintSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid sprint data.",
          errors:
            parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const sprint =
      await sprintService.updateSprint({
        sprintId,
        projectId,
        organizationId:
          workspace.id,
        name: parsed.data.name,
        goal:
          parsed.data.goal,
        status:
          parsed.data.status,
        startDate:
          parsed.data.startDate,
        endDate:
          parsed.data.endDate,
      });

    return NextResponse.json({
      success: true,
      sprint,
    });
  } catch (error) {
    console.error(
      "Update sprint error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update sprint.";

    if (
      message ===
        "Project not found." ||
      message ===
        "Sprint not found."
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 404 },
      );
    }

    if (
      message.includes(
        "already exists",
      ) ||
      message.includes(
        "Only one sprint",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const {
      projectId,
      sprintId,
    } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    await sprintService.deleteSprint({
      sprintId,
      projectId,
      organizationId:
        workspace.id,
    });

    return NextResponse.json({
      success: true,
      message:
        "Sprint deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Delete sprint error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to delete sprint.";

    if (
      message ===
        "Project not found." ||
      message ===
        "Sprint not found."
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 404 },
      );
    }

    if (
      message.includes(
        "cannot be deleted",
      ) ||
      message.includes(
        "containing tasks",
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 },
    );
  }
}