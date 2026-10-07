import { NextResponse } from "next/server";

import { auth } from "@/auth";
import { stopTimeEntrySchema } from "@/features/time-tracking/schemas/time-entry.schema";
import { timeEntryAuthorizationService } from "@/server/services/time-entry-authorization.service";
import { timeEntryService } from "@/server/services/time-entry.service";
import { workspaceContextService } from "@/server/services/workspace-context.service";

type RouteContext = {
  params: Promise<{
    projectId: string;
    taskId: string;
    entryId: string;
  }>;
};

function getErrorStatus(message: string) {
  const statusMap: Record<string, number> = {
    WORKSPACE_MEMBERSHIP_REQUIRED: 403,
    TIME_ENTRY_NOT_FOUND: 404,
    PROJECT_NOT_FOUND: 404,
    TASK_NOT_FOUND: 404,
    FORBIDDEN: 403,
    INVALID_TIME_ENTRY: 400,
    INVALID_TIME_DURATION: 400,
    TIME_ENTRY_ALREADY_STOPPED: 409,
  };

  return statusMap[message] ?? 500;
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

    const { projectId, taskId, entryId } =
      await context.params;

    const workspace =
      await workspaceContextService.getWorkspaceContext();

    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace context not found." },
        { status: 403 },
      );
    }

    const authorization =
      await timeEntryAuthorizationService.authorizeEntryAccess(
        workspace.id,
        entryId,
        session.user.id,
      );

    if (
      authorization.entry.taskId !== taskId ||
      authorization.entry.task.projectId !== projectId
    ) {
      return NextResponse.json(
        {
          error:
            "Time entry does not belong to this task.",
        },
        { status: 404 },
      );
    }

    if (authorization.entry.userId !== session.user.id) {
      return NextResponse.json(
        {
          error:
            "Only the timer owner can stop this timer.",
        },
        { status: 403 },
      );
    }

    if (authorization.entry.endedAt) {
      return NextResponse.json(
        {
          error: "Time entry is already stopped.",
        },
        { status: 409 },
      );
    }

    let body: unknown = {};

    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const parsed = stopTimeEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid stop request.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const endedAt =
      parsed.data.endedAt ?? new Date();

    const durationSeconds = Math.floor(
      (endedAt.getTime() -
        authorization.entry.startedAt.getTime()) /
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

    const entry = await timeEntryService.stop({
      entryId,
      endedAt,
    });

    return NextResponse.json({
      entry,
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
            ? "Failed to stop time entry."
            : message,
      },
      { status: getErrorStatus(message) },
    );
  }
}