import { NextResponse } from "next/server";

import { createTaskSchema } from "@/features/task/schemas/create-task.schema";
import { workspaceContextService } from "@/server/services/workspace-context.service";
import { taskService } from "@/server/services/task.service";

type TaskRouteContext = {
  params: Promise<{
    projectId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: TaskRouteContext,
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required.",
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
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const tasks = await taskService.getTasks({
      projectId,
      organizationId: workspace.id,
    });

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error) {
    console.error(
      "Get project tasks error:",
      error,
    );

    if (
      error instanceof Error &&
      error.message === "Project not found."
    ) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
        },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Unable to retrieve project tasks.",
      },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: TaskRouteContext,
) {
  try {
    const { projectId } = await params;

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          message: "Project ID is required.",
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
          message: "Workspace context is required.",
        },
        { status: 401 },
      );
    }

    const body: unknown = await request.json();

    const parsed =
      createTaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid task data.",
          errors:
            parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const task = await taskService.createTask({
      projectId,
      organizationId: workspace.id,
      creatorId: workspace.userId,
      title: parsed.data.title,
      description: parsed.data.description,
      type: parsed.data.type,
      status: parsed.data.status,
      priority: parsed.data.priority,
      sprintId: parsed.data.sprintId,
      parentId: parsed.data.parentId,
      assigneeId: parsed.data.assigneeId,
      storyPoints: parsed.data.storyPoints,
      dueDate: parsed.data.dueDate,
    });

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully.",
        task,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(
      "Create project task error:",
      error,
    );

    if (
      error instanceof Error &&
      (
        error.message ===
          "Project not found." ||
        error.message.includes(
          "does not belong to this project",
        ) ||
        error.message.includes(
          "does not belong to this project",
        ) ||
        error.message.includes(
          "not a project member",
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
        message: "Unable to create the task.",
      },
      { status: 500 },
    );
  }
}