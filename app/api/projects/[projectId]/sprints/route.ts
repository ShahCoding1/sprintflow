import { NextResponse } from "next/server";

import { createSprintSchema } from "@/features/task/schemas/create-sprint.schema";
import { sprintService } from "@/server/services/sprint.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { projectId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const sprints =
      await sprintService.getSprints({
        projectId,
        organizationId: workspace.id,
      });

    return NextResponse.json({
      success: true,
      sprints,
    });
  } catch (error) {
    console.error(
      "Get sprints error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to load sprints.";

    if (message === "Project not found.") {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 404 },
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

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { projectId } = await params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const body: unknown =
      await request.json();

    const parsed =
      createSprintSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid sprint data.",
          errors:
            parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const sprint =
      await sprintService.createSprint({
        projectId,
        organizationId:
          workspace.id,
        name: parsed.data.name,
        goal:
          parsed.data.goal,
        startDate:
          parsed.data.startDate,
        endDate:
          parsed.data.endDate,
      });

    return NextResponse.json(
      {
        success: true,
        sprint,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create sprint error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create sprint.";

    if (
      message ===
        "Project not found."
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