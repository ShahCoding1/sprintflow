import { NextResponse } from "next/server";

import { updateTaskSchema } from "@/features/task/schemas/update-task.schema";
import { taskService } from "@/server/services/task.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type TaskRouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: TaskRouteContext,
) {
  try {
    const { projectId, taskId } =
      await params;

    if (!projectId || !taskId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project ID and task ID are required.",
        },
        { status: 400 },
      );
    }

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

    const tasks = await taskService.getTasks({
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
    console.error(
      "Get task error:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Unable to retrieve the task.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: TaskRouteContext,
) {
  try {
    const { projectId, taskId } =
      await params;

    if (!projectId || !taskId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Project ID and task ID are required.",
        },
        { status: 400 },
      );
    }

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
      updateTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task data.",
          errors:
            parsed.error.flatten()
              .fieldErrors,
        },
        { status: 400 },
      );
    }

    const task =
      await taskService.updateTask({
        taskId,
        projectId,
        organizationId: workspace.id,
        title: parsed.data.title,
        description:
          parsed.data.description,
        type: parsed.data.type,
        status: parsed.data.status,
        priority: parsed.data.priority,
        sprintId: parsed.data.sprintId,
        parentId: parsed.data.parentId,
        assigneeId: parsed.data.assigneeId,
        storyPoints:
          parsed.data.storyPoints,
        dueDate: parsed.data.dueDate,
        position: parsed.data.position,
      });

    return NextResponse.json({
      success: true,
      message: "Task updated successfully.",
      task,
    });
  } catch (error) {
    console.error(
      "Update task error:",
      error,
    );

    if (
      error instanceof Error &&
      (
        error.message ===
          "Project not found." ||
        error.message ===
          "Task not found."
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 },
      );
    }

    if (
      error instanceof Error &&
      (
        error.message.includes(
          "does not belong to this project",
        ) ||
        error.message.includes(
          "not a project member",
        ) ||
        error.message.includes(
          "cannot be its own parent",
        )
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to update the task.",
      },
      { status: 500 },
    );
  }
}