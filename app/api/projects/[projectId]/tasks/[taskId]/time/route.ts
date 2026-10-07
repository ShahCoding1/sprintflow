import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { createTimeEntrySchema } from "@/features/time-tracking/schemas/time-entry.schema";
import { timeEntryAuthorizationService } from "@/server/services/time-entry-authorization.service";
import { timeEntryService } from "@/server/services/time-entry.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
  }>;
};

function getErrorStatus(message: string) {
  const statusMap: Record<string, number> = {
    WORKSPACE_MEMBERSHIP_REQUIRED: 403,
    PROJECT_NOT_FOUND: 404,
    TASK_NOT_FOUND: 404,
    FORBIDDEN: 403,
    ACTIVE_TIMER_EXISTS: 409,
    INVALID_TIME_ENTRY: 400,
    INVALID_TIME_DURATION: 400,
  };

  return statusMap[message] ?? 500;
}

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { projectId, taskId } =
      await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context not found." },
        { status: 403 },
      );
    }

    await timeEntryAuthorizationService.authorizeTaskAccess(
      workspace.id,
      projectId,
      taskId,
      session.user.id,
    );

    const entries =
      await timeEntryService.listByTask(taskId);

    return NextResponse.json({
      entries,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        error:
          message === "UNKNOWN_ERROR"
            ? "Failed to load time entries."
            : message,
      },
      { status: getErrorStatus(message) },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 },
      );
    }

    const { projectId, taskId } =
      await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context not found." },
        { status: 403 },
      );
    }

    await timeEntryAuthorizationService.authorizeTaskAccess(
      workspace.id,
      projectId,
      taskId,
      session.user.id,
    );

    const body = await request.json();

    const parsed =
      createTimeEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid time entry.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    if (parsed.data.endedAt) {
      const durationSeconds = Math.floor(
        (parsed.data.endedAt.getTime() -
          parsed.data.startedAt.getTime()) /
          1000,
      );

      if (durationSeconds < 1) {
        return NextResponse.json(
          {
            error:
              "End time must be after start time.",
          },
          { status: 400 },
        );
      }

      const entry =
        await timeEntryService.createManual({
          taskId,
          userId: session.user.id,
          startedAt: parsed.data.startedAt,
          endedAt: parsed.data.endedAt,
          description:
            parsed.data.description ?? null,
        });

      return NextResponse.json(
        { entry },
        { status: 201 },
      );
    }

    const entry =
      await timeEntryService.start({
        taskId,
        userId: session.user.id,
        startedAt: parsed.data.startedAt,
        description:
          parsed.data.description ?? null,
      });

    return NextResponse.json(
      { entry },
      { status: 201 },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        error:
          message === "UNKNOWN_ERROR"
            ? "Failed to create time entry."
            : message,
      },
      { status: getErrorStatus(message) },
    );
  }
}