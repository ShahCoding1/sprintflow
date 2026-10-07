import { NextResponse } from "next/server";

import { updateTaskSchema } from "@/features/task/schemas/update-task.schema";
import { taskAuthorizationService } from "@/server/services/task-authorization.service";
import { taskService } from "@/server/services/task.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
  _request: Request,
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

    const tasks =
      await taskService.getTasks({
        projectId,
        organizationId: workspace.id,
      });

    const task = tasks.find(
      (item) => item.id === taskId,
    );

    if (!task) {
      return NextResponse.json(
        {
          success: false,
          message: "Task not found.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Get task error:", error);

    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Unable to load task.",
      },
      { status: 500 },
    );
  }
}

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
      action: "UPDATE",
    });

    const body = await request.json();

    const parsed =
      updateTaskSchema.safeParse(body);

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
      await taskService.updateTask({
        taskId,
        projectId,
        organizationId: workspace.id,
        ...parsed.data,
      });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Update task error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to update task.";

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