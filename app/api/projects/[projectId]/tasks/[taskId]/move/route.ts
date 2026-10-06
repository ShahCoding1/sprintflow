import { NextResponse } from "next/server";

import { moveTaskSchema } from "@/features/task/schemas/move-task.schema";
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
  { params }: RouteContext,
) {
  try {
    const { projectId, taskId } = await params;

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

    const body: unknown = await request.json();

    const parsed =
      moveTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task movement data.",
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
        status: parsed.data.status,
        position: parsed.data.position,
      });

    return NextResponse.json({
      success: true,
      task,
    });
  } catch (error) {
    console.error("Move task error:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Unable to move task.";

    if (
      message === "Project not found." ||
      message === "Task not found."
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
      { status: 500 },
    );
  }
}