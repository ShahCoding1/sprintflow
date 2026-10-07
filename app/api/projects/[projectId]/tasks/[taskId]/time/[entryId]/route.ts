import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { updateTimeEntrySchema } from "@/features/time-tracking/schemas/time-entry.schema";
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
    PROJECT_NOT_FOUND: 404,
    TASK_NOT_FOUND: 404,
    TIME_ENTRY_NOT_FOUND: 404,
    FORBIDDEN: 403,
    INVALID_TIME_ENTRY: 400,
    INVALID_TIME_DURATION: 400,
    TIME_ENTRY_ALREADY_STOPPED: 409,
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

    await timeEntryAuthorizationService.authorizeTaskAccess(
      workspace.id,
      projectId,
      taskId,
      session.user.id,
    );

    const entries =
      await timeEntryService.listByTask(taskId);

    const entry = entries.find(
      (item) => item.id === entryId,
    );

    if (!entry) {
      return NextResponse.json(
        { error: "TIME_ENTRY_NOT_FOUND" },
        { status: 404 },
      );
    }

    return NextResponse.json({ entry });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        error:
          message === "UNKNOWN_ERROR"
            ? "Failed to load time entry."
            : message,
      },
      { status: getErrorStatus(message) },
    );
  }
}

export async function PATCH(
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

    const access =
      await timeEntryAuthorizationService.authorizeEntryAccess(
        workspace.id,
        entryId,
        session.user.id,
      );

    if (
      access.entry.taskId !== taskId ||
      access.entry.task.projectId !== projectId
    ) {
      return NextResponse.json(
        { error: "TIME_ENTRY_NOT_FOUND" },
        { status: 404 },
      );
    }

    const body = await request.json();

    const parsed = updateTimeEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid time entry.",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const entry = await timeEntryService.update({
      entryId,
      startedAt: parsed.data.startedAt,
      endedAt: parsed.data.endedAt ?? null,
      description: parsed.data.description ?? null,
    });

    return NextResponse.json({ entry });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "UNKNOWN_ERROR";

    return NextResponse.json(
      {
        error:
          message === "UNKNOWN_ERROR"
            ? "Failed to update time entry."
            : message,
      },
      { status: getErrorStatus(message) },
    );
  }
}

export async function DELETE(
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

    const access =
      await timeEntryAuthorizationService.authorizeEntryAccess(
        workspace.id,
        entryId,
        session.user.id,
      );

    if (
      access.entry.taskId !== taskId ||
      access.entry.task.projectId !== projectId
    ) {
      return NextResponse.json(
        { error: "TIME_ENTRY_NOT_FOUND" },
        { status: 404 },
      );
    }

    await timeEntryService.delete(entryId);

    return NextResponse.json({
      success: true,
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
            ? "Failed to delete time entry."
            : message,
      },
      { status: getErrorStatus(message) },
    );
  }
}