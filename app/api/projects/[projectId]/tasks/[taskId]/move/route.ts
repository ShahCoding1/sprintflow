import { NextResponse } from "next/server";

import { moveTaskSchema } from "@/features/task/schemas/move-task.schema";
import { taskAuthorizationService } from "@/server/services/task-authorization.service";
import { taskService } from "@/server/services/task.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function PATCH(
  request: Request,
  context: RouteContext,
) {
  try {
    const {
      projectId,
      taskId,
    } = await context.params;

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
      action: "MOVE",
    });

    const body = await request.json();

    const parsed =
      moveTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movement data.",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const task =
      await taskService.moveTask({
        taskId,
        projectId,
        organizationId: workspace.id,
        actorId: workspace.userId,
        status: parsed.data.status,
        position: parsed.data.position,
      });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error(
      "Move task error:",
      error,
    );

    const message =
      error instanceof Error
        ? error.message
        : "Unable to move task.";

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
      message.includes("not found") ||
      message.includes("Not found")
    ) {
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
      { status: 400 },
    );
  }
}