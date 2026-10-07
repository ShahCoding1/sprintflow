import { NextResponse } from "next/server";

import { createTaskSchema } from "@/features/task/schemas/create-task.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { taskAuthorizationService } from "@/server/services/task-authorization.service";
import { taskService } from "@/server/services/task.service";

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
    const { projectId } = await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    const tasks =
      await taskService.getTasks({
        projectId,
        organizationId: workspace.id,
      });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error("Get tasks error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load tasks.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const { projectId } = await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          success: false,
          message: "Unauthorized.",
        },
        { status: 401 },
      );
    }

    await taskAuthorizationService.authorize({
      organizationId: workspace.id,
      projectId,
      userId: workspace.userId,
      action: "CREATE",
    });

    const body = await request.json();

    const parsed =
      createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const task =
      await taskService.createTask({
        projectId,
        organizationId: workspace.id,
        creatorId: workspace.userId,
        ...parsed.data,
      });

    return NextResponse.json(
      {
        success: true,
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create task error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to create task.";

    if (
      message.includes("permission") ||
      message.includes("member") ||
      message.includes("workspace")
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 403 },
      );
    }

    if (
      message.includes("Project not found") ||
      message.includes("Sprint not found") ||
      message.includes("Parent task") ||
      message.includes("Assignee")
    ) {
      return NextResponse.json(
        {
          success: false,
          message,
        },
        { status: 400 },
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