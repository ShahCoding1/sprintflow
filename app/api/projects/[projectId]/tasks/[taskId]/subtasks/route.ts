import { NextResponse } from "next/server";

import { auth } from "@/auth";

import {
  createSubtaskSchema,
} from "@/features/task/schemas/subtask.schema";

import { subtaskService } from "@/server/services/subtask.service";
import { taskAuthorizationService } from "@/server/services/task-authorization.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

export async function GET(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          message: "Workspace not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      projectId,
      taskId,
    } = await params;

    const result =
      await subtaskService.getSubtasks({
        parentId: taskId,
        projectId,
        organizationId: workspace.id,
      });

    return NextResponse.json({
      subtasks: result,
    });
  } catch (error) {
    console.error(
      "GET subtasks error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to load subtasks.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        {
          message: "Unauthorized.",
        },
        {
          status: 401,
        },
      );
    }

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        {
          message: "Workspace not found.",
        },
        {
          status: 404,
        },
      );
    }

    const {
      projectId,
      taskId,
    } = await params;

    const authorized =
      await taskAuthorizationService.authorize({
        userId: session.user.id,
        organizationId: workspace.id,
        projectId,
        action: "CREATE",
      });

    if (!authorized) {
      return NextResponse.json(
        {
          message: "Forbidden.",
        },
        {
          status: 403,
        },
      );
    }

    const body = await request.json();

    const parsed =
      createSubtaskSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message:
            parsed.error.issues[0]?.message ??
            "Invalid subtask data.",
        },
        {
          status: 400,
        },
      );
    }

    const subtask =
      await subtaskService.createSubtask({
        parentId: taskId,
        projectId,
        organizationId: workspace.id,
        creatorId: session.user.id,
        input: parsed.data,
      });

    return NextResponse.json(
      {
        subtask,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "POST subtask error:",
      error,
    );

    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Unable to create subtask.",
      },
      {
        status: 500,
      },
    );
  }
}